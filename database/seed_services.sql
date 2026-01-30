-- =====================================================
-- SEED: Servicios Maestros (Catálogo LowSplit)
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- PASO 1: INSERTAR/ACTUALIZAR SERVICIOS CORRECTOS
-- Aseguramos que los servicios "buenos" existan para poder mover los grupos allí.
INSERT INTO services (name, slug, category, description, total_price, max_slots, icon_url, color, is_active)
VALUES 
  -- STREAMING
  ('Netflix', 'netflix', 'streaming', 
   'Plan Premium con 4 pantallas simultáneas y Ultra HD 4K.', 
   17.99, 4, '/logos/icon-netflix.svg', '#E50914', true),
     
  ('Disney+', 'disney', 'streaming', 
   'Todo Disney, Pixar, Marvel, Star Wars y National Geographic.', 
   11.99, 4, '/logos/icon-disneyplus.svg', '#113CCF', true),
  
  ('HBO Max', 'hbo', 'streaming', 
   'Series y películas exclusivas de HBO, Warner Bros y más.', 
   9.99, 3, '/logos/icon-hbomax.svg', '#5822B4', true),
  
  ('YouTube Premium', 'youtube', 'streaming', 
   'YouTube y YouTube Music sin anuncios, en segundo plano.', 
   17.99, 5, '/logos/icon-youtube.svg', '#FF0000', true),
  
  ('Amazon Prime', 'amazon-prime', 'streaming', 
   'Envíos rápidos, Prime Video, Amazon Music y más.', 
   4.99, 3, '/logos/icon-primevideo.svg', '#00A8E1', true),
  
  ('Crunchyroll', 'crunchyroll', 'streaming', 
   'El mejor anime en streaming sin anuncios.', 
   7.99, 4, '/logos/icon-crunchyroll.svg', '#F47521', true),

  -- MUSIC
  ('Spotify', 'spotify', 'music', 
   'Música sin límites, sin anuncios y modo offline.', 
   17.99, 6, '/logos/icon-spotify.svg', '#1DB954', true),

  -- AI
  ('ChatGPT Plus', 'chatgpt-plus', 'ai', 
   'Acceso a GPT-4, navegación, análisis de datos y DALL·E.', 
   20.00, 4, '/logos/icon-chatgpt.svg', '#10A37F', true),

  -- GAMING
  ('Nintendo Switch Online', 'nintendo', 'gaming', 
   'Juego en línea, guardado en la nube y juegos clásicos.', 
   34.99, 8, '/logos/icon-nintendo.svg', '#E60012', true),
  
  ('Xbox Game Pass', 'xbox-gamepass', 'gaming', 
   'Cientos de juegos en consola, PC y nube + EA Play.', 
   14.99, 5, '/logos/icon-xbox.svg', '#107C10', true),
  
  ('PlayStation Plus', 'ps-plus-premium', 'gaming', 
   'Multijugador online, juegos gratis mensuales y catálogo clásico.', 
   16.99, 5, '/logos/icon-playstation.svg', '#003791', true),

  -- SECURITY
  ('NordVPN', 'nordvpn', 'security', 
   'VPN segura y rápida para proteger tu privacidad online.', 
   12.99, 6, '/logos/icon-nordvpn.svg', '#4687FF', true),

  -- EDUCATION
  ('Duolingo', 'duolingo', 'education', 
   'Aprende idiomas más rápido sin anuncios y vidas ilimitadas.', 
   12.99, 6, '/logos/icon-duolingo.svg', '#58CC02', true),

  -- PRODUCTIVITY
  ('Microsoft 365', 'microsoft', 'productivity', 
   'Office premium apps, 1TB almacenamiento en la nube.', 
   10.00, 6, '/logos/icon-microsoft.svg', '#00A4EF', true),
  
  ('Canva', 'canva', 'productivity', 
   'Diseña como un profesional con contenido premium ilimitado.', 
   14.99, 5, '/logos/icon-canva.svg', '#00C4CC', true),

  -- BUNDLES
  ('Apple One', 'apple', 'bundle', 
   'Apple Music, Apple TV+, Apple Arcade y iCloud+.', 
   25.95, 6, '/logos/icon-apple-one.svg', '#000000', true)

ON CONFLICT (slug) 
DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  total_price = EXCLUDED.total_price,
  max_slots = EXCLUDED.max_slots,
  icon_url = EXCLUDED.icon_url,
  color = EXCLUDED.color,
  is_active = EXCLUDED.is_active;

-- PASO 2: MIGRAR GRUPOS EXISTENTES
-- Antes de borrar los servicios viejos, movemos los grupos a los nuevos servicios.
-- Esto evita el error de "foreign key constraint".

-- Netflix Standard -> Netflix
UPDATE subscription_groups 
SET service_id = (SELECT id FROM services WHERE slug = 'netflix') 
WHERE service_id IN (SELECT id FROM services WHERE slug IN ('Netflix-standard', 'netflix-standard'));

-- Spotify Family -> Spotify
UPDATE subscription_groups 
SET service_id = (SELECT id FROM services WHERE slug = 'spotify') 
WHERE service_id IN (SELECT id FROM services WHERE slug = 'spotify-family');

-- Canva Pro -> Canva
UPDATE subscription_groups 
SET service_id = (SELECT id FROM services WHERE slug = 'canva') 
WHERE service_id IN (SELECT id FROM services WHERE slug IN ('canva-pro', 'canva-basic'));

-- ChatGPT typos -> chatgpt-plus
UPDATE subscription_groups 
SET service_id = (SELECT id FROM services WHERE slug = 'chatgpt-plus') 
WHERE service_id IN (SELECT id FROM services WHERE slug IN ('Chatgpt-plus', 'chatgpt-Plus'));

-- Disney+ Standard -> Disney
UPDATE subscription_groups 
SET service_id = (SELECT id FROM services WHERE slug = 'disney') 
WHERE service_id IN (SELECT id FROM services WHERE slug IN ('disney-plus-standard', 'Disney'));

-- Duolingo Plus -> Duolingo
UPDATE subscription_groups 
SET service_id = (SELECT id FROM services WHERE slug = 'duolingo') 
WHERE service_id IN (SELECT id FROM services WHERE slug = 'duolingo-plus');


-- PASO 3: ELIMINAR SERVICIOS OBSOLETOS
-- Ahora que ya no tienen grupos asociados, podemos borrarlos sin errores.
DELETE FROM services WHERE slug IN (
  'Chatgpt-plus', 'chatgpt-Plus', 
  'Netflix-standard', 'netflix-standard', 
  'canva-pro', 'canva-basic', 
  'spotify-family', 
  'duolingo-plus', 
  'Disney', 'disney-plus-standard'
);

-- Verificar
SELECT id, name, slug FROM services ORDER BY category, name;
