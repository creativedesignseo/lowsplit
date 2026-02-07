-- =====================================================
-- LowSplit - Esquema de Base de Datos
-- Supabase (PostgreSQL)
-- =====================================================

-- 1. Perfiles (Extensión de Auth.users)
-- Almacena información adicional del usuario
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role USER_ROLE DEFAULT 'user', -- enum: 'user', 'admin', 'super_admin'
  reputation_score INT DEFAULT 100 CHECK (reputation_score >= 0 AND reputation_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================

-- 2. Servicios Maestros (Netflix, Spotify, etc.)
-- Catálogo de servicios disponibles para compartir
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- ej: 'netflix-premium', 'spotify-family'
  category TEXT NOT NULL, -- 'streaming', 'music', 'gaming', 'productivity', etc.
  description TEXT,
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price > 0),
  max_slots INT NOT NULL CHECK (max_slots > 0 AND max_slots <= 10),
  icon_url TEXT,
  color TEXT, -- Color de marca para UI (hex)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);

-- =====================================================

-- 3. Grupos de Suscripción (Instancias creadas por usuarios)
-- Grupos donde usuarios comparten un servicio
CREATE TABLE IF NOT EXISTS subscription_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT NOT NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'full', 'closed')),
  title TEXT, -- Nombre personalizado del grupo (opcional)
  description TEXT,
  access_credentials TEXT, -- Campo encriptado - solo visible para miembros pagados
  credentials_login TEXT,
  credentials_password TEXT,
  max_slots INT DEFAULT 4,
  visibility TEXT DEFAULT 'public',
  slots_occupied INT DEFAULT 1 CHECK (slots_occupied >= 0),
  price_per_slot DECIMAL(10,2), -- Calculado: total_price / max_slots + comisión
  next_payment_date DATE,
  invoice_verified BOOLEAN DEFAULT false,
  instant_acceptance BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_groups_service ON subscription_groups(service_id);
CREATE INDEX IF NOT EXISTS idx_groups_admin ON subscription_groups(admin_id);
CREATE INDEX IF NOT EXISTS idx_groups_status ON subscription_groups(status);

-- =====================================================

-- 4. Membresías (Relación Muchos a Muchos)
-- Usuarios que pertenecen a grupos
CREATE TABLE IF NOT EXISTS memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES subscription_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
  stripe_subscription_id TEXT, -- ID de suscripción en Stripe
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_payment_at TIMESTAMP WITH TIME ZONE,
  
  -- Un usuario solo puede estar una vez en cada grupo
  UNIQUE(group_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_group ON memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(payment_status);

-- =====================================================

-- 5. Transacciones de Pago (Historial)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Políticas para PROFILES
-- =====================================================

-- Cualquiera puede ver perfiles públicos
DROP POLICY IF EXISTS "Perfiles públicos visibles para todos" ON profiles;
CREATE POLICY "Perfiles públicos visibles para todos"
  ON profiles FOR SELECT
  USING (true);

-- Usuarios solo pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON profiles;
CREATE POLICY "Usuarios actualizan su propio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- Políticas para SERVICES
-- =====================================================

-- Catálogo de servicios es público
DROP POLICY IF EXISTS "Servicios visibles para todos" ON services;
CREATE POLICY "Servicios visibles para todos"
  ON services FOR SELECT
  USING (is_active = true);

-- =====================================================
-- Políticas para SUBSCRIPTION_GROUPS
-- =====================================================

-- Grupos disponibles son visibles para todos (sin credenciales)
DROP POLICY IF EXISTS "Grupos disponibles visibles" ON subscription_groups;
CREATE POLICY "Grupos disponibles visibles"
  ON subscription_groups FOR SELECT
  USING (status != 'closed');

-- Solo el admin puede crear grupos
DROP POLICY IF EXISTS "Usuarios autenticados crean grupos" ON subscription_groups;
CREATE POLICY "Usuarios autenticados crean grupos"
  ON subscription_groups FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

-- Solo el admin puede actualizar su grupo
DROP POLICY IF EXISTS "Admin actualiza su grupo" ON subscription_groups;
CREATE POLICY "Admin actualiza su grupo"
  ON subscription_groups FOR UPDATE
  USING (auth.uid() = admin_id);

-- Solo el admin puede eliminar su grupo
DROP POLICY IF EXISTS "Admin elimina su grupo" ON subscription_groups;
CREATE POLICY "Admin elimina su grupo"
  ON subscription_groups FOR DELETE
  USING (auth.uid() = admin_id);

-- =====================================================
-- Políticas para MEMBERSHIPS
-- =====================================================

-- Usuarios ven sus propias membresías
DROP POLICY IF EXISTS "Ver propias membresías" ON memberships;
CREATE POLICY "Ver propias membresías"
  ON memberships FOR SELECT
  USING (auth.uid() = user_id);

-- Admins ven membresías de sus grupos
DROP POLICY IF EXISTS "Admin ve membresías de su grupo" ON memberships;
CREATE POLICY "Admin ve membresías de su grupo"
  ON memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscription_groups 
      WHERE subscription_groups.id = memberships.group_id 
      AND subscription_groups.admin_id = auth.uid()
    )
  );

-- Usuarios autenticados pueden crear membresías (unirse a grupos)
DROP POLICY IF EXISTS "Usuarios se unen a grupos" ON memberships;
CREATE POLICY "Usuarios se unen a grupos"
  ON memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden cancelar su propia membresía
DROP POLICY IF EXISTS "Usuarios cancelan su membresía" ON memberships;
CREATE POLICY "Usuarios cancelan su membresía"
  ON memberships FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- Políticas para PAYMENT_TRANSACTIONS
-- =====================================================

-- Usuarios ven sus propias transacciones
DROP POLICY IF EXISTS "Ver propias transacciones" ON payment_transactions;
CREATE POLICY "Ver propias transacciones"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCIÓN: Obtener credenciales (solo miembros pagados)
-- =====================================================

CREATE OR REPLACE FUNCTION get_group_credentials(group_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  credentials TEXT;
BEGIN
  -- Verificar que el usuario sea miembro con pago al día
  IF EXISTS (
    SELECT 1 FROM memberships 
    WHERE group_id = group_uuid 
    AND user_id = auth.uid() 
    AND payment_status = 'paid'
  ) THEN
    SELECT access_credentials INTO credentials
    FROM subscription_groups
    WHERE id = group_uuid;
    
    RETURN credentials;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: Calcular precio por slot
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_slot_price(
  service_uuid UUID,
  commission_rate DECIMAL DEFAULT 0.10 -- 10% comisión
)
RETURNS DECIMAL AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS INICIALES: Servicios de ejemplo
-- =====================================================

INSERT INTO services (name, slug, category, description, total_price, max_slots, icon_url, color) VALUES
  ('Netflix Premium', 'netflix-premium', 'streaming', 'Plan Premium con 4 pantallas simultáneas y Ultra HD', 17.99, 4, '/icons/netflix.svg', '#E50914'),
  ('Netflix Estándar', 'netflix-standard', 'streaming', 'Plan Estándar con 2 pantallas simultáneas y Full HD', 12.99, 2, '/icons/netflix.svg', '#E50914'),
  ('Spotify Family', 'spotify-family', 'music', 'Hasta 6 cuentas Premium para la familia', 17.99, 6, '/icons/spotify.svg', '#1DB954'),
  ('Disney+ Estándar', 'disney-plus', 'streaming', 'Acceso a todo el catálogo de Disney, Pixar, Marvel y Star Wars', 8.99, 4, '/icons/disney.svg', '#113CCF'),
  ('HBO Max', 'hbo-max', 'streaming', 'Series y películas exclusivas de HBO', 9.99, 3, '/icons/hbo.svg', '#5822B4'),
  ('YouTube Premium Family', 'youtube-premium', 'streaming', 'Sin anuncios, música y descargas para toda la familia', 17.99, 5, '/icons/youtube.svg', '#FF0000'),
  ('Apple One Family', 'apple-one', 'bundle', 'Apple Music, TV+, Arcade, iCloud+ 200GB', 22.95, 6, '/icons/apple.svg', '#000000'),
  ('Amazon Prime', 'amazon-prime', 'bundle', 'Envíos gratis, Prime Video, Music y más', 4.99, 2, '/icons/amazon.svg', '#FF9900'),
  ('Crunchyroll Mega Fan', 'crunchyroll', 'streaming', 'Anime sin límites con acceso offline', 9.99, 4, '/icons/crunchyroll.svg', '#F47521'),
  ('Xbox Game Pass Ultimate', 'xbox-gamepass', 'gaming', 'Cientos de juegos, EA Play y Xbox Live Gold', 14.99, 1, '/icons/xbox.svg', '#107C10'),
  ('PlayStation Plus Premium', 'ps-plus-premium', 'gaming', 'Juegos mensuales, clásicos y streaming', 16.99, 1, '/icons/playstation.svg', '#003791'),
  ('Canva Pro', 'canva-pro', 'productivity', 'Diseño gráfico profesional para equipos', 12.99, 5, '/icons/canva.svg', '#00C4CC'),
  ('Microsoft 365 Family', 'microsoft-365', 'productivity', 'Word, Excel, PowerPoint y 1TB OneDrive por usuario', 10.00, 6, '/icons/microsoft.svg', '#00A4EF'),
  ('NordVPN', 'nordvpn', 'security', 'VPN segura y rápida', 4.99, 6, '/icons/nordvpn.svg', '#4687FF'),
  ('Duolingo Plus Family', 'duolingo-plus', 'education', 'Aprende idiomas sin anuncios ni límites', 12.99, 6, '/icons/duolingo.svg', '#58CC02');
