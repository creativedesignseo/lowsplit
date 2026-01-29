
-- FIX VISIBILITY ISSUES
-- Run this in Supabase SQL Editor

-- 1. Permitir ver grupos disponibles a todo el mundo (incluyendo usuarios no logueados)
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON subscription_groups;
CREATE POLICY "Public groups are viewable by everyone"
ON subscription_groups FOR SELECT
USING ( status = 'available' OR visibility = 'public' );

-- 2. Permitir ver perfiles básicos (Nombre, Avatar) a todo el mundo
-- Necesario para mostrar quién creó el grupo en la ficha
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING ( true );

-- 3. (Opcional) Asegurar que los admins vean sus propios grupos aunque no estén 'available'
DROP POLICY IF EXISTS "Admins can view own groups" ON subscription_groups;
CREATE POLICY "Admins can view own groups"
ON subscription_groups FOR SELECT
USING ( auth.uid() = admin_id );
