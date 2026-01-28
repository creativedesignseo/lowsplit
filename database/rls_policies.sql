-- 🚨 REPARACIÓN FINAL DE BUCLE INFINITO (VERSIÓN DEFINITIVA) 🚨
-- Este script soluciona el error "infinite recursion" (42P17).
-- USA UN MÉTODO AVANZADO PARA BORRAR TODAS LAS POLÍTICAS DE GOLPE.

-- 1. Desactivar RLS momentáneamente (Para detener los crash inmediatamente)
ALTER TABLE public.subscription_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;

-- 2. LIMPIEZA TOTAL AUTOMÁTICA
-- Este bloque de código busca TODAS las políticas activas y las borra una por una.
-- Así no importa qué nombre tengan (Español, Inglés, Viejas), se borrarán todas.
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Borrar TODAS las políticas de subscription_groups
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscription_groups' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.subscription_groups', pol.policyname);
    END LOOP;

    -- Borrar TODAS las políticas de memberships
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'memberships' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.memberships', pol.policyname);
    END LOOP;
END $$;

-- 3. REACTIVAR SEGURIDAD (Con reglas limpias)
ALTER TABLE public.subscription_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS SEGURAS (A prueba de fallos)

-- REGLA 1: Dueños ven y editan sus grupos
CREATE POLICY "owner_manage_groups" 
ON public.subscription_groups 
FOR ALL 
USING (auth.uid() = admin_id);

-- REGLA 2: Cualquier usuario registrado puede VER grupos
-- (Usamos 'true' para evitar bucles. Solo permite VER, no editar)
CREATE POLICY "auth_read_groups" 
ON public.subscription_groups 
FOR SELECT 
TO authenticated 
USING (true);

-- REGLA 3: Usuarios ven sus propias membresías
CREATE POLICY "user_view_memberships" 
ON public.memberships 
FOR ALL 
USING (auth.uid() = user_id);

-- Fin del arreglo.
