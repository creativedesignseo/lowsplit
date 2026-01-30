// Utility functions for LowSplit
// No more MOCK data - everything comes from Supabase

/**
 * Gets the logo URL for a service
 * @param {string} slug - Service slug (e.g., 'netflix', 'spotify')
 * @param {string} iconUrl - Icon URL from database (preferred)
 * @param {string} type - 'icon' for square icons, 'full' for full logos
 * @returns {string|null} URL to the logo
 */
export const getLogoUrl = (slug, iconUrl = null, type = 'icon') => {
  // Local files for main services (Prioritized to handle Full vs Icon logic)
  const localLogos = {
    'netflix': { icon: '/logos/icon-netflix.svg', full: '/logos/netflix.svg' },
    'spotify': { icon: '/logos/icon-spotify.svg', full: '/logos/spotify.svg' },
    'amazon-prime': { icon: '/logos/icon-primevideo.svg', full: '/logos/primevideo.svg' },
    'prime': { icon: '/logos/icon-primevideo.svg', full: '/logos/primevideo.svg' },
    'apple': { icon: '/logos/icon-apple-one.svg', full: '/logos/apple-one.svg' },
    'disney': { icon: '/logos/icon-disneyplus.svg', full: '/logos/disneyplus.svg' },
    'hbo': { icon: '/logos/icon-hbomax.svg', full: '/logos/hbomax.svg' },
    'youtube': { icon: '/logos/icon-youtube.svg', full: '/logos/youtube.svg' },
    'crunchyroll': { icon: '/logos/icon-crunchyroll.svg', full: '/logos/crunchyroll.svg' },
    'chatgpt': { icon: '/logos/icon-chatgpt.svg', full: '/logos/chatgpt.svg' },
    'nintendo': { icon: '/logos/icon-nintendo.svg', full: '/logos/nintendo.svg' },
    'xbox': { icon: '/logos/icon-xbox.svg', full: '/logos/xbox.svg' },
    'playstation': { icon: '/logos/icon-playstation.svg', full: '/logos/playstation.svg' },
    'ps-plus': { icon: '/logos/icon-playstation.svg', full: '/logos/playstation.svg' },
    'nordvpn': { icon: '/logos/icon-nordvpn.svg', full: '/logos/nordvpn.svg' },
    'duolingo': { icon: '/logos/icon-duolingo.svg', full: '/logos/duolingo.svg' },
    'microsoft': { icon: '/logos/icon-microsoft.svg', full: '/logos/microsoft.svg' },
    'canva': { icon: '/logos/icon-canva.svg', full: '/logos/canva.svg' }
  }

  // 1. Try to find local match first to respect specific 'text' vs 'icon' types
  for (const [key, urls] of Object.entries(localLogos)) {
    if (slug?.includes(key)) {
      return type === 'full' ? urls.full : urls.icon
    }
  }

  // 2. Fallback to DB URL if available (usually the icon)
  if (iconUrl) {
    return iconUrl
  }

  // 3. Default placeholder
  return '/logos/default-service.svg'
}

/**
 * Gets an emoji for a service slug (for UI decoration)
 */
export const getEmojiForSlug = (slug) => {
  const map = {
    'netflix': '🔴',
    'spotify': '🎵',
    'disney': '✨',
    'hbo': '🎬',
    'youtube': '▶️',
    'duolingo': '🦉',
    'chatgpt': '🤖',
    'canva': '🎨',
    'crunchyroll': '🍥',
    'microsoft': '📊',
    'apple': '🍎',
    'amazon': '📦',
    'prime': '📦',
    'xbox': '🎮',
    'playstation': '🎮',
    'ps-plus': '🎮',
    'nintendo': '🕹️',
    'nordvpn': '🔒'
  }
  
  for (const [key, emoji] of Object.entries(map)) {
    if (slug?.includes(key)) return emoji
  }
  return '⚡'
}

/**
 * Calculates the slot price with margin
 */
export const calculateSlotPrice = (totalPrice, maxSlots, margin = 1.25) => {
  if (!totalPrice || !maxSlots) return '0.00'
  return ((totalPrice / maxSlots) * margin).toFixed(2)
}

/**
 * Gets default features for a service category
 */
export const getDefaultFeatures = (category) => {
  const features = {
    streaming: ['Streaming HD/4K', 'Sin Anuncios', 'Descargas Offline', 'Multi-dispositivo'],
    music: ['Música Sin Límites', 'Sin Anuncios', 'Modo Offline', 'Alta Calidad'],
    gaming: ['Juego Online', 'Descargas Gratis', 'Contenido Exclusivo', 'Multi-plataforma'],
    productivity: ['Apps Premium', 'Almacenamiento Nube', 'Colaboración', 'Sin Límites'],
    ai: ['Acceso Completo', 'Sin Límites', 'Funciones Avanzadas', 'Prioridad'],
    education: ['Sin Anuncios', 'Contenido Premium', 'Sin Límites', 'Certificados'],
    security: ['Multi-dispositivo', 'Sin Registros', 'Alta Velocidad', 'Servidores Globales'],
    bundle: ['Todo Incluido', 'Mejor Precio', 'Familia Completa', 'Sin Compromisos']
  }
  return features[category] || ['Acceso Completo', 'Sin Límites', 'Multi-dispositivo', 'Soporte']
}
