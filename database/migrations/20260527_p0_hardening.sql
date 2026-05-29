-- =====================================================================
-- LowSplit — Migración P0 Hardening (Fase 0)
-- Fecha: 2026-05-27
-- Objetivo: cerrar los vectores P0 detectados en la auditoría de seguridad
--           y consistencia transaccional antes de pasar a producción.
--
-- Cómo aplicar:
--   1. Hacer backup de la base de datos (Supabase → Database → Backups).
--   2. Abrir Supabase SQL Editor.
--   3. Ejecutar este archivo completo (es transaccional: si algo falla,
--      se revierte todo).
--   4. Ejecutar el bloque de VERIFICACIÓN al final (después del COMMIT)
--      para confirmar que todo quedó aplicado.
--
-- Bloques incluidos:
--   A. Tabla idempotencia Stripe (stripe_events_processed)
--   B. UNIQUE en payment_transactions.stripe_payment_intent_id
--   C. CHECK constraints faltantes (amount > 0, slots dentro de max)
--   D. Bloquear self-elevation a admin (trigger en profiles)
--   E. Reescribir policies de memberships (no más FOR ALL)
--   F. Reescribir policies de subscription_groups (no exponer credenciales)
--   G. REVOKE en RPCs financieras (handle_wallet_topup → solo service_role)
--   H. search_path en funciones SECURITY DEFINER
-- =====================================================================

BEGIN;

-- =====================================================================
-- A. Tabla de idempotencia para webhooks de Stripe
-- =====================================================================
-- El webhook de Stripe DEBE insertar el event.id ANTES de procesar el
-- evento. Si ya existe (clave primaria duplicada), se devuelve 200 OK
-- sin re-procesar. Evita doble-recarga / doble-cobro si Stripe reenvía.

CREATE TABLE IF NOT EXISTS public.stripe_events_processed (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stripe_events_processed ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo accesible vía service_role (bypassa RLS).

COMMENT ON TABLE public.stripe_events_processed IS
  'Registro idempotente de webhooks de Stripe ya procesados. El webhook inserta el event.id antes de procesar — si ya existe, se devuelve 200 sin re-procesar.';


-- =====================================================================
-- B. UNIQUE en payment_transactions(stripe_payment_intent_id)
-- =====================================================================
-- Defensa en profundidad: aunque el webhook ya sea idempotente vía
-- stripe_events_processed, el UNIQUE garantiza que un mismo
-- payment_intent jamás se registre dos veces.
--
-- IMPORTANTE: si ya hay duplicados (por re-entregas previas del webhook),
-- la creación del constraint FALLARÁ. En ese caso, descomenta el bloque
-- de limpieza siguiente, ejecútalo, y vuelve a intentar la migración.
-- NOTA: 'wallet_balance' aparece como valor "marcador" en handle_join_group_wallet,
-- por lo que NO podemos forzar UNIQUE sin permitir duplicados de ese marcador.
-- Solución: índice único PARCIAL que aplica solo a IDs reales de Stripe.

-- (Limpieza opcional — descomenta si el ADD CONSTRAINT falla por duplicados)
-- DELETE FROM public.payment_transactions WHERE id IN (
--   SELECT id FROM (
--     SELECT id, ROW_NUMBER() OVER (
--       PARTITION BY stripe_payment_intent_id ORDER BY created_at DESC
--     ) AS rn
--     FROM public.payment_transactions
--     WHERE stripe_payment_intent_id IS NOT NULL
--       AND stripe_payment_intent_id <> 'wallet_balance'
--   ) t WHERE t.rn > 1
-- );

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_stripe_pi
  ON public.payment_transactions (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL
    AND stripe_payment_intent_id <> 'wallet_balance';


-- =====================================================================
-- C. CHECK constraints faltantes
-- =====================================================================

-- payment_transactions.amount > 0 (no permitir importes 0 o negativos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_amount_positive'
    ) THEN
        ALTER TABLE public.payment_transactions
            ADD CONSTRAINT chk_amount_positive CHECK (amount > 0);
    END IF;
END $$;

-- subscription_groups.slots_occupied no puede superar max_slots
-- (NOTA: schema.sql ya define `slots_occupied >= 0` como CHECK inline,
--  pero NO acota el techo. Añadimos la cota superior aquí.)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_slots_within_max'
    ) THEN
        ALTER TABLE public.subscription_groups
            ADD CONSTRAINT chk_slots_within_max
            CHECK (slots_occupied >= 0 AND slots_occupied <= max_slots);
    END IF;
END $$;


-- =====================================================================
-- D. Bloquear self-elevation a admin / reputation tampering
-- =====================================================================
-- La policy original "Usuarios actualizan su propio perfil" permite al
-- usuario actualizar CUALQUIER columna de su perfil, incluyendo `role`
-- y `reputation_score`. Reemplazamos por:
--   - WITH CHECK estricto (no puede cambiar el id)
--   - Trigger BEFORE UPDATE que bloquea cambio de role salvo super_admin
--     y revierte cambios de reputation_score hechos por el propio usuario.

DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON public.profiles;

CREATE POLICY "Usuarios actualizan campos seguros de su perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.prevent_privileged_self_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
END $$;

DROP TRIGGER IF EXISTS trg_profile_safe_update ON public.profiles;
CREATE TRIGGER trg_profile_safe_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_privileged_self_edit();


-- =====================================================================
-- E. Reescribir policies de memberships (no más FOR ALL)
-- =====================================================================
-- La policy `user_view_memberships` actual es FOR ALL: permite a
-- cualquier usuario INSERT/UPDATE/DELETE filas con su user_id, sin
-- ninguna validación de pago, slot disponible o tarifa. La eliminación
-- de slots / asignación a grupo DEBE pasar por la RPC SECURITY DEFINER
-- `handle_join_group_wallet`.

DROP POLICY IF EXISTS "user_view_memberships" ON public.memberships;
-- También limpiamos posibles policies heredadas del schema original
DROP POLICY IF EXISTS "Ver propias membresías" ON public.memberships;
DROP POLICY IF EXISTS "Admin ve membresías de su grupo" ON public.memberships;
DROP POLICY IF EXISTS "Usuarios se unen a grupos" ON public.memberships;
DROP POLICY IF EXISTS "Usuarios cancelan su membresía" ON public.memberships;

CREATE POLICY "Usuario ve sus membresías" ON public.memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin ve membresías de su grupo" ON public.memberships
  FOR SELECT USING (
     EXISTS (
       SELECT 1 FROM public.subscription_groups
        WHERE id = memberships.group_id AND admin_id = auth.uid()
     )
  );

CREATE POLICY "Usuario cancela su membresía" ON public.memberships
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND payment_status = 'cancelled');

-- NO hay policy de INSERT/DELETE — solo vía RPC SECURITY DEFINER o service_role.


-- =====================================================================
-- F. Reescribir policies de subscription_groups (no exponer credenciales)
-- =====================================================================
-- Las policies actuales (`auth_read_groups` USING true,
-- "Public groups are viewable by everyone", "Grupos disponibles visibles")
-- exponen TODA la fila — incluyendo `credentials_login` y
-- `credentials_password` — a quien pueda hacer SELECT.
--
-- Mientras movemos las credenciales a una tabla cifrada (Phase 1),
-- mitigamos así:
--   - Las queries del frontend NO deben usar select('*'); deben listar
--     columnas no sensibles explícitamente.
--   - La función get_group_credentials() es la única vía oficial.

DROP POLICY IF EXISTS "auth_read_groups" ON public.subscription_groups;
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.subscription_groups;
DROP POLICY IF EXISTS "Grupos disponibles visibles" ON public.subscription_groups;
DROP POLICY IF EXISTS "owner_manage_groups" ON public.subscription_groups;
DROP POLICY IF EXISTS "Admins can view own groups" ON public.subscription_groups;
DROP POLICY IF EXISTS "Usuarios autenticados crean grupos" ON public.subscription_groups;
DROP POLICY IF EXISTS "Admin actualiza su grupo" ON public.subscription_groups;
DROP POLICY IF EXISTS "Admin elimina su grupo" ON public.subscription_groups;

CREATE POLICY "Ver grupos disponibles o públicos" ON public.subscription_groups
  FOR SELECT USING (status = 'available' OR visibility = 'public');

CREATE POLICY "Admin ve su grupo siempre" ON public.subscription_groups
  FOR SELECT USING (auth.uid() = admin_id);

CREATE POLICY "Admin crea su grupo" ON public.subscription_groups
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admin actualiza su grupo (campos limitados)" ON public.subscription_groups
  FOR UPDATE USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admin elimina su grupo" ON public.subscription_groups
  FOR DELETE USING (auth.uid() = admin_id);

-- Trigger que bloquea cambios a campos críticos:
--  - admin_id (no transferible vía UPDATE de cliente)
--  - service_id (no se cambia el servicio del grupo)
--  - slots_occupied (solo lo cambia el sistema vía RPC SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.guard_group_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
END $$;

DROP TRIGGER IF EXISTS trg_guard_group_columns ON public.subscription_groups;
CREATE TRIGGER trg_guard_group_columns
  BEFORE UPDATE ON public.subscription_groups
  FOR EACH ROW EXECUTE FUNCTION public.guard_group_columns();

-- IMPORTANTE: las columnas credentials_login / credentials_password siguen
-- estando en la tabla. Las queries del frontend NO deben hacer select('*')
-- sobre subscription_groups — solo seleccionar columnas no sensibles. La
-- función get_group_credentials() existente ya gestiona el acceso seguro
-- a credenciales para miembros pagados.
-- TODO Phase 1: mover credenciales a tabla aparte cifrada con pgsodium.


-- =====================================================================
-- G. REVOKE en RPCs financieras
-- =====================================================================
-- handle_wallet_topup mueve dinero a la billetera y solo debe poder
-- ejecutarse desde el webhook de Stripe (que usa la service_role key).
-- Cualquier cliente authenticated NO debe poder llamarla.

REVOKE EXECUTE ON FUNCTION public.handle_wallet_topup(UUID, DECIMAL, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_wallet_topup(UUID, DECIMAL, TEXT, TEXT)
  TO service_role;

-- handle_join_group_wallet se mantiene callable por authenticated PERO
-- en una migración futura se añadirá una validación interna explícita
-- (WHERE auth.uid() = p_user_id) además de mover validación de tarifa
-- al servidor. Por ahora, dejamos la RPC accesible y confiamos en la
-- validación interna existente (slots, saldo, no-duplicado).


-- =====================================================================
-- H. search_path en funciones SECURITY DEFINER
-- =====================================================================
-- Las funciones SECURITY DEFINER que NO fijan search_path son vulnerables
-- a hijacking: un atacante con permisos de CREATE en un schema temporal
-- podría redefinir nombres (ej. crear `public.profiles` malicioso en un
-- schema cargado antes en search_path). Las pinneamos a "public, pg_temp".

-- Firmas verificadas contra la BD real (pg_get_function_identity_arguments).
-- NOTA: handle_join_group_wallet NO existe en la BD (se sustituye por
-- handle_join_group_wallet_v2 en la migración 20260529). Las 3 RPCs antes
-- "fantasma" (card/partial/increment) SÍ existen y se endurecen aquí.
ALTER FUNCTION public.handle_new_user()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.handle_new_wallet()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.handle_wallet_topup(uuid, numeric, text, text)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.get_group_credentials(uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.handle_join_group_card(uuid, uuid, numeric, numeric, text)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.handle_partial_wallet_payment(uuid, numeric, text)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.increment_group_slots(uuid)
    SET search_path = public, pg_temp;


COMMIT;


-- =====================================================================
-- VERIFICACIÓN — ejecutar tras el COMMIT para confirmar todo OK
-- =====================================================================
-- (Estas queries son SELECT puros: ejecútalas una a una en el SQL Editor.)

SELECT 'A. stripe_events_processed table' AS check_name,
       EXISTS (
         SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'stripe_events_processed'
       ) AS ok;

SELECT 'B. uq_payment_stripe_pi index' AS check_name,
       EXISTS (
         SELECT 1 FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = 'uq_payment_stripe_pi'
       ) AS ok;

SELECT 'C1. chk_amount_positive' AS check_name,
       EXISTS (
         SELECT 1 FROM pg_constraint WHERE conname = 'chk_amount_positive'
       ) AS ok;

SELECT 'C2. chk_slots_within_max' AS check_name,
       EXISTS (
         SELECT 1 FROM pg_constraint WHERE conname = 'chk_slots_within_max'
       ) AS ok;

SELECT 'D. trg_profile_safe_update' AS check_name,
       EXISTS (
         SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profile_safe_update'
       ) AS ok;

SELECT 'E. memberships policies' AS check_name,
       count(*) AS policies_count
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'memberships';

SELECT 'F1. subscription_groups policies' AS check_name,
       count(*) AS policies_count
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'subscription_groups';

SELECT 'F2. trg_guard_group_columns' AS check_name,
       EXISTS (
         SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_group_columns'
       ) AS ok;

SELECT 'G. handle_wallet_topup grants' AS check_name,
       array_agg(grantee::text ORDER BY grantee::text) AS grantees
  FROM information_schema.routine_privileges
 WHERE routine_schema = 'public'
   AND routine_name = 'handle_wallet_topup';

SELECT 'H. search_path config' AS check_name,
       proname AS function_name,
       proconfig AS config
  FROM pg_proc
 WHERE pronamespace = 'public'::regnamespace
   AND proname IN (
     'handle_new_user',
     'handle_wallet_topup',
     'handle_join_group_wallet',
     'handle_new_wallet',
     'get_group_credentials',
     'prevent_privileged_self_edit'
   );
