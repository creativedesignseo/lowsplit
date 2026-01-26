export const MOCK_SERVICES = [
  {
    id: '1',
    name: 'Netflix Premium',
    slug: 'netflix',
    category: 'streaming',
    description: 'Plan Premium con 4 pantallas simultáneas y Ultra HD 4K.',
    total_price: 17.99,
    max_slots: 4,
    color: '#E50914',
    features: ['4 Pantallas 4K', 'Sin Anuncios', 'Descargas', 'Audio Espacial']
  },
  {
    id: '2',
    name: 'Spotify Family',
    slug: 'spotify',
    category: 'music',
    description: 'Hasta 6 cuentas Premium para disfrutar música sin límites.',
    total_price: 17.99,
    max_slots: 6,
    color: '#1DB954',
    features: ['6 Cuentas Premium', 'Sin Anuncios', 'Modo Offline', 'Spotify Kids']
  },
  {
    id: '3',
    name: 'Disney+ Premium',
    slug: 'disney',
    category: 'streaming',
    description: 'Todo Disney, Pixar, Marvel, Star Wars y National Geographic.',
    total_price: 11.99,
    max_slots: 4,
    color: '#113CCF',
    features: ['4 Pantallas 4K', 'IMAX Enhanced', 'Descargas', 'GroupWatch']
  },
  {
    id: '4',
    name: 'YouTube Premium',
    slug: 'youtube',
    category: 'streaming',
    description: 'YouTube y YouTube Music sin anuncios, en segundo plano.',
    total_price: 17.99,
    max_slots: 5,
    color: '#FF0000',
    features: ['Sin Anuncios', 'Segundo Plano', 'YouTube Music', 'Descargas']
  },
  {
    id: '13',
    name: 'Amazon Prime',
    slug: 'amazon-prime',
    category: 'streaming',
    description: 'Envíos rápidos, Prime Video, Amazon Music y más.',
    total_price: 4.99,
    max_slots: 3,
    color: '#00A8E1',
    features: ['Envíos Gratis', 'Prime Video', 'Amazon Music', 'Prime Gaming']
  },
  {
    id: '5',
    name: 'HBO Max',
    slug: 'hbo', // mapped to hbo-max in utils? need to align
    category: 'streaming',
    description: 'Series y películas exclusivas de HBO, Warner Bros y más.',
    total_price: 9.99,
    max_slots: 3,
    color: '#5822B4',
    features: ['3 Pantallas', '4K UHD', 'Descargas', 'Perfiles Niños']
  },
  {
    id: '6',
    name: 'ChatGPT Plus',
    slug: 'chatgpt-plus',
    category: 'ai',
    description: 'Acceso a GPT-4, navegación, análisis de datos y DALL·E.',
    total_price: 20.00,
    max_slots: 4, // Shared account usually
    color: '#10A37F',
    features: ['Acceso GPT-4', 'Plugins', 'Navegación Web', 'DALL·E 3']
  },
  {
    id: '7',
    name: 'Nintendo Switch Online',
    slug: 'nintendo',
    category: 'gaming',
    description: 'Juego en línea, guardado en la nube y juegos clásicos.',
    total_price: 34.99, // Family expansion pack year? let's say month equivalent or modify
    max_slots: 8,
    color: '#E60012',
    features: ['Juego Online', 'Juegos Clásicos', 'Nube', 'Pack Expansión']
  },
  {
    id: '8',
    name: 'NordVPN',
    slug: 'nordvpn',
    category: 'security',
    description: 'VPN segura y rápida para proteger tu privacidad online.',
    total_price: 12.99,
    max_slots: 6,
    color: '#4687FF',
    features: ['6 Dispositivos', 'IP Dedicada', 'Protección Malware', 'Sin Registros']
  },
  {
    id: '9',
    name: 'Duolingo Super',
    slug: 'duolingo',
    category: 'education',
    description: 'Aprende idiomas más rápido sin anuncios y vidas ilimitadas.',
    total_price: 12.99,
    max_slots: 6,
    color: '#58CC02',
    features: ['Vidas Ilimitadas', 'Sin Anuncios', 'Repaso Errores', 'Pruebas Nivel']
  },
  {
    id: '10',
    name: 'Microsoft 365',
    slug: 'microsoft',
    category: 'productivity',
    description: 'Office premium apps, 1TB almacenamiento en la nube.',
    total_price: 10.00,
    max_slots: 6,
    color: '#00A4EF',
    features: ['Word/Excel/PPT', '1TB OneDrive', 'Outlook', 'Teams']
  },
  {
    id: '11',
    name: 'Canva Pro',
    slug: 'canva',
    category: 'productivity',
    description: 'Diseña como un profesional con contenido premium ilimitado.',
    total_price: 14.99,
    max_slots: 5,
    color: '#00C4CC',
    features: ['Todo Ilimitado', 'Quitafondos', 'Redimensionar', 'Kit de Marca']
  },
  {
    id: '12',
    name: 'Apple One',
    slug: 'apple',
    category: 'bundle',
    description: 'Apple Music, Apple TV+, Apple Arcade y iCloud+.',
    total_price: 25.95,
    max_slots: 6,
    color: '#000000',
    features: ['Music + TV+', 'Arcade', 'iCloud+ 200GB', 'Fitness+']
  }
]
