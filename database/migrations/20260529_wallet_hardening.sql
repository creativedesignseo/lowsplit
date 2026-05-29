-- =====================================================
-- 20260529_wallet_hardening.sql
-- =====================================================
-- QUÉ HACE:
--   Define una RPC SEGURA `handle_join_group_wallet_v2` que sustituye a
--   `handle_join_group_wallet` (database/wallets.sql), la cual es INSEGURA
--   porque recibe `p_user_id` y `p_amount` como parámetros del cliente.
--   Un usuario autenticado podía invocarla pasando el user_id de otra
--   persona o un importe arbitrario (p.ej. 0.01), socavando el principio
--   de "nunca confiar en el cliente para dinero" (AGENTS.md §Payment security).
--
--   La versión v2 cierra esos vectores:
--     * El user se toma SIEMPRE de `auth.uid()` (JWT), nunca del body.
--     * El importe se RECALCULA en servidor: price_per_slot + comisión
--       fija de 0.35 EUR (idéntica a PLATFORM_FEE en create-group-checkout.js),
--       leído bajo FOR UPDATE del grupo. El cliente no puede inyectar precio.
--     * Mantiene la misma lógica atómica de la original (lock de grupo y
--       wallet, validaciones, descuento de saldo, transacción, membresía,
--       payment_transactions y actualización de slots/estado del grupo).
--
-- NOMBRES CONFIRMADOS (database/wallets.sql + database/schema.sql):
--   wallets(id PK = profiles.id, balance DECIMAL, updated_at)  -> saldo por user, PK = user id
--   transactions(wallet_id, amount, type, status, description) -> type ENUM 'purchase', status ENUM 'completed'
--   subscription_groups(id, slots_occupied, max_slots, price_per_slot, status, updated_at)
--       -> status CHECK ('available','full','closed')
--   memberships(group_id, user_id, role 'member', payment_status 'paid', last_payment_at)
--   payment_transactions(user_id, membership_id, amount, currency, status, stripe_payment_intent_id)
--
-- NOTA: la columna de saldo es `wallets.balance` con PK `id` = user id
--   (NO existe columna user_id separada en wallets). Por eso filtramos
--   `wallets WHERE id = v_uid`, consistente con la RPC original.
--
-- IMPORTANTE: esta migración NO elimina ni revoca la RPC antigua para no
--   romper código que aún la llame; migrar los callers a v2 y luego
--   retirar la antigua en una migración posterior.
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_join_group_wallet_v2(
    p_group_id UUID,
    p_description TEXT DEFAULT 'Pago de suscripción'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
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
END $$;

GRANT EXECUTE ON FUNCTION public.handle_join_group_wallet_v2(UUID, TEXT) TO authenticated;

COMMIT;

-- =====================================================
-- VERIFICACIÓN (ejecutar DESPUÉS del COMMIT, una por una)
-- =====================================================

-- 1. La función v2 existe con la firma esperada (UUID, TEXT) -> UUID
SELECT EXISTS (
    SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname = 'handle_join_group_wallet_v2'
       AND pg_get_function_identity_arguments(p.oid) = 'p_group_id uuid, p_description text'
) AS fn_exists;

-- 2. Es SECURITY DEFINER y tiene search_path fijado
SELECT p.proname,
       p.prosecdef        AS is_security_definer,
       p.proconfig        AS settings   -- debe contener search_path=public, pg_temp
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname = 'handle_join_group_wallet_v2';

-- 3. El rol `authenticated` tiene EXECUTE concedido
SELECT has_function_privilege(
    'authenticated',
    'public.handle_join_group_wallet_v2(uuid, text)',
    'EXECUTE'
) AS authenticated_can_execute;
