-- =====================================================================
-- LowSplit — Snapshot REAL de funciones/RPC del esquema public
-- Capturado: 2026-05-29 vía Supabase Management API (sin Docker)
-- Fuente de verdad de las RPCs que viven en producción.
-- Cierra el hallazgo C6 (RPCs antes no versionadas: handle_join_group_card,
-- handle_partial_wallet_payment, increment_group_slots) + incluye la nueva
-- handle_join_group_wallet_v2.
-- =====================================================================

-- ---------------------------------------------------------------------
-- add_wallet_earning(p_user_id uuid, p_amount numeric, p_description text, p_reference_id uuid)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_wallet_earning(p_user_id uuid, p_amount numeric, p_description text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO wallet_transactions (user_id, type, amount, description, reference_id, reference_type)
  VALUES (p_user_id, 'earning', p_amount, p_description, p_reference_id, 'membership')
  RETURNING id INTO v_transaction_id;
  
  INSERT INTO user_wallets (user_id, balance, total_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = user_wallets.balance + p_amount,
    total_earned = user_wallets.total_earned + p_amount,
    updated_at = now();
  
  RETURN v_transaction_id;
END;
$function$
;

-- ---------------------------------------------------------------------
-- calculate_slot_price(service_uuid uuid, commission_rate numeric)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_slot_price(service_uuid uuid, commission_rate numeric DEFAULT 0.10)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  base_price DECIMAL;
  max_slots INT;
  price_per_user DECIMAL;
BEGIN
  SELECT total_price, s.max_slots INTO base_price, max_slots
  FROM services s
  WHERE s.id = service_uuid;
  
  -- Precio base dividido entre slots + comisión
  price_per_user := (base_price / max_slots) * (1 + commission_rate);
  
  RETURN ROUND(price_per_user, 2);
END;
$function$
;

-- ---------------------------------------------------------------------
-- check_user_role(required_roles user_role[])
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_user_role(required_roles user_role[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = ANY(required_roles)
  );
$function$
;

-- ---------------------------------------------------------------------
-- create_user_wallet()
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_user_wallet()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO user_wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$function$
;

-- ---------------------------------------------------------------------
-- get_group_credentials(p_group_id uuid)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_group_credentials(p_group_id uuid)
 RETURNS TABLE(login text, password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Check if user is admin or paid member
  IF NOT EXISTS (
    SELECT 1 FROM subscription_groups WHERE id = p_group_id AND admin_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM memberships 
    WHERE group_id = p_group_id 
    AND user_id = auth.uid() 
    AND payment_status = 'paid'
  ) THEN
    RAISE EXCEPTION 'No autorizado para ver credenciales';
  END IF;
  
  RETURN QUERY
  SELECT credentials_login, credentials_password
  FROM subscription_groups
  WHERE id = p_group_id;
END;
$function$
;

-- ---------------------------------------------------------------------
-- guard_group_columns()
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_group_columns()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.admin_id IS DISTINCT FROM NEW.admin_id THEN
        RAISE EXCEPTION 'No puedes cambiar admin_id';
    END IF;
    IF OLD.service_id IS DISTINCT FROM NEW.service_id THEN
        RAISE EXCEPTION 'No puedes cambiar service_id';
    END IF;
    -- slots_occupied solo lo cambia el sistema (RPC SECURITY DEFINER):
    NEW.slots_occupied := OLD.slots_occupied;
    RETURN NEW;
END $function$
;

-- ---------------------------------------------------------------------
-- handle_join_group_card(p_user_id uuid, p_group_id uuid, p_card_amount numeric, p_wallet_amount numeric, p_stripe_id text)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_join_group_card(p_user_id uuid, p_group_id uuid, p_card_amount numeric, p_wallet_amount numeric, p_stripe_id text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_membership_id UUID;
BEGIN
  -- Insert new membership
  INSERT INTO memberships (user_id, group_id, payment_status, stripe_subscription_id)
  VALUES (p_user_id, p_group_id, 'paid', p_stripe_id)
  RETURNING id INTO v_membership_id;

  -- Increment slots_occupied
  UPDATE subscription_groups
  SET slots_occupied = slots_occupied + 1
  WHERE id = p_group_id;

  RETURN v_membership_id;
END;
$function$
;

-- ---------------------------------------------------------------------
-- handle_join_group_wallet_v2(p_group_id uuid, p_description text)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_join_group_wallet_v2(p_group_id uuid, p_description text DEFAULT 'Pago de suscripción'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_uid UUID := auth.uid();
    v_amount DECIMAL;
    v_slots_occupied INT;
    v_max_slots INT;
    v_balance DECIMAL;
    v_membership_id UUID;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

    -- No miembro ya
    IF EXISTS (SELECT 1 FROM memberships WHERE group_id = p_group_id AND user_id = v_uid) THEN
        RAISE EXCEPTION 'Ya eres miembro de este grupo';
    END IF;

    -- Lock del grupo + precio real desde servidor (price_per_slot + comisión fija 0.35)
    SELECT slots_occupied, max_slots, price_per_slot + 0.35
      INTO v_slots_occupied, v_max_slots, v_amount
      FROM subscription_groups WHERE id = p_group_id FOR UPDATE;

    IF v_amount IS NULL THEN RAISE EXCEPTION 'Grupo no encontrado'; END IF;
    IF v_slots_occupied >= v_max_slots THEN RAISE EXCEPTION 'Grupo lleno'; END IF;

    -- Saldo: tabla `wallets`, PK `id` = user id, columna `balance`
    SELECT balance INTO v_balance FROM wallets WHERE id = v_uid FOR UPDATE;
    IF COALESCE(v_balance, 0) < v_amount THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;

    UPDATE wallets SET balance = balance - v_amount, updated_at = now() WHERE id = v_uid;
    INSERT INTO transactions (wallet_id, amount, type, status, description)
         VALUES (v_uid, v_amount, 'purchase', 'completed', p_description);
    INSERT INTO memberships (group_id, user_id, role, payment_status, last_payment_at)
         VALUES (p_group_id, v_uid, 'member', 'paid', now())
      RETURNING id INTO v_membership_id;
    INSERT INTO payment_transactions (user_id, membership_id, amount, currency, status, stripe_payment_intent_id)
         VALUES (v_uid, v_membership_id, v_amount, 'EUR', 'completed', 'wallet_' || v_membership_id);
    UPDATE subscription_groups
       SET slots_occupied = slots_occupied + 1,
           status = CASE WHEN slots_occupied + 1 >= v_max_slots THEN 'full' ELSE status END,
           updated_at = now()
     WHERE id = p_group_id;

    RETURN v_membership_id;
END $function$
;

-- ---------------------------------------------------------------------
-- handle_new_user()
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario'), 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error in a production environment, but don't block user creation
  RETURN new;
END;
$function$
;

-- ---------------------------------------------------------------------
-- handle_new_user_wallet()
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_wallets (user_id, balance)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$function$
;

-- ---------------------------------------------------------------------
-- handle_new_wallet()
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_wallet()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    INSERT INTO public.wallets (id, balance)
    VALUES (new.id, 0.00)
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$function$
;

-- ---------------------------------------------------------------------
-- handle_partial_wallet_payment(p_user_id uuid, p_amount numeric, p_description text)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_partial_wallet_payment(p_user_id uuid, p_amount numeric, p_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_current_balance NUMERIC;
BEGIN
  SELECT balance INTO v_current_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  UPDATE wallets SET balance = balance - p_amount WHERE user_id = p_user_id;
  
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'expense', p_amount, p_description);
END;
$function$
;

-- ---------------------------------------------------------------------
-- handle_wallet_topup(p_user_id uuid, p_amount numeric, p_stripe_id text, p_description text)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_wallet_topup(p_user_id uuid, p_amount numeric, p_stripe_id text, p_description text DEFAULT 'Recarga de saldo via Stripe'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- 0. Asegurar que la billetera existe (por si es un perfil antiguo sin ella)
    INSERT INTO public.wallets (id, balance)
    VALUES (p_user_id, 0.00)
    ON CONFLICT (id) DO NOTHING;

    -- 1. Incrementar saldo en la billetera
    UPDATE public.wallets
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE id = p_user_id;

    -- 2. Registrar la transacción en el historial de la billetera (Lógica interna)
    INSERT INTO public.transactions (wallet_id, amount, type, status, description)
    VALUES (p_user_id, p_amount, 'deposit', 'completed', p_description);

    -- 3. Registrar en payment_transactions (Auditoría externa/Stripe)
    -- Usamos INSERT ... ON CONFLICT por si el webhook se dispara dos veces
    INSERT INTO public.payment_transactions (user_id, amount, currency, status, stripe_payment_intent_id)
    VALUES (p_user_id, p_amount, 'EUR', 'completed', p_stripe_id)
    ON CONFLICT (stripe_payment_intent_id) DO NOTHING;
END;
$function$
;

-- ---------------------------------------------------------------------
-- increment_group_slots(group_id uuid)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_group_slots(group_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.subscription_groups
  SET slots_occupied = slots_occupied + 1,
      updated_at = NOW()
  WHERE id = group_id;
END;
$function$
;

-- ---------------------------------------------------------------------
-- prevent_privileged_self_edit()
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_privileged_self_edit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Solo super_admin puede cambiar roles
    IF OLD.role IS DISTINCT FROM NEW.role
       AND NOT EXISTS (
           SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
       ) THEN
        RAISE EXCEPTION 'No tienes permiso para modificar el rol';
    END IF;

    -- reputation_score no editable por el propio usuario
    IF OLD.reputation_score IS DISTINCT FROM NEW.reputation_score
       AND auth.uid() = NEW.id THEN
        NEW.reputation_score := OLD.reputation_score;
    END IF;

    RETURN NEW;
END $function$
;

