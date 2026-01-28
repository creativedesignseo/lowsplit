-- ==========================================
-- SCRIPT DE REPARACIÓN DEL DASHBOARD
-- ==========================================

-- 1. Habilitar seguridad (por si acaso)
ALTER TABLE subscription_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas (limpieza total)
DROP POLICY IF EXISTS "Grupos disponibles visibles" ON subscription_groups;
DROP POLICY IF EXISTS "Ver info basica de grupos" ON subscription_groups;
DROP POLICY IF EXISTS "Admins manage all groups" ON subscription_groups;
DROP POLICY IF EXISTS "Admin ve membresías de su grupo" ON memberships;
DROP POLICY IF EXISTS "Ver propias membresías" ON memberships;
DROP POLICY IF EXISTS "Owner manage their groups" ON subscription_groups;
DROP POLICY IF EXISTS "Owner see memberships of their groups" ON memberships;
DROP POLICY IF EXISTS "Members see their own memberships" ON memberships;
DROP POLICY IF EXISTS "Anyone can see available groups" ON subscription_groups;
DROP POLICY IF EXISTS "Members can see joined groups" ON subscription_groups;

-- 3. CREAR NUEVAS POLÍTICAS (SIMPLIFICADAS)

-- A. El dueño del grupo (tú) puede ver y editar TODO de sus grupos
CREATE POLICY "Owner manage their groups" ON subscription_groups
  FOR ALL USING (admin_id = auth.uid());

-- B. El dueño del grupo puede ver quiénes son miembros de sus grupos
CREATE POLICY "Owner see memberships" ON memberships
  FOR ALL USING (
    user_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM subscription_groups WHERE id = memberships.group_id AND admin_id = auth.uid())
  );

-- C. Cualquier usuario puede ver grupos "disponibles" (para comprarlos)
CREATE POLICY "Public available groups" ON subscription_groups
  FOR SELECT USING (status = 'available');

-- D. Los miembros pueden ver sus propias compras
CREATE POLICY "Members see their own memberships" ON memberships
  FOR SELECT USING (user_id = auth.uid());

-- E. Los miembros pueden ver los detalles del grupo al que pertenecen (para ver credenciales)
CREATE POLICY "Members see joined groups" ON subscription_groups
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM memberships WHERE group_id = subscription_groups.id)
  );

-- ==========================================
-- FIN DEL SCRIPT
-- ==========================================
