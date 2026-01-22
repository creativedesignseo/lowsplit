
export const getEmojiForSlug = (slug) => {
  const map = {
    'netflix-premium': '🔴',
    'netflix-standard': '🔴',
    'spotify-family': '🎵',
    'disney-plus': '✨',
    'hbo-max': '🎬',
    'youtube-premium': '▶️',
    'duolingo-plus': '🦉',
    'chatgpt-plus': '🤖',
    'canva-pro': '🎨',
    'crunchyroll': '🍥',
    'microsoft-365': '📊',
    'apple-one': '🍎',
    'amazon-prime': '📦',
    'xbox-gamepass': '🎮',
    'ps-plus-premium': '🎮',
    'nordvpn': '🔒'
  }
  return map[slug] || '⚡'
}

export const calculateSlotPrice = (totalPrice, maxSlots, margin = 1.25) => {
  if (!totalPrice || !maxSlots) return '0.00'
  return ((totalPrice / maxSlots) * margin).toFixed(2)
}
