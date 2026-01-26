
export const getLogoUrl = (slug, type = 'icon') => {
  // 1. Local overrides for Netflix
  if (slug.includes('netflix')) {
      return type === 'full' ? '/logos/netflix.svg' : '/logos/icon-netflix.svg'
  }
  
  // 2. Local overrides for Prime Video
  if (slug.includes('prime') || slug.includes('amazon')) {
      return type === 'full' ? '/logos/primevideo.svg' : '/logos/icon-primevideo.svg'
  }

  // 3. Local overrides for Spotify
  if (slug.includes('spotify')) {
      return type === 'full' ? '/logos/spotify.svg' : '/logos/icon-spotify.svg'
  }

  // 4. Local overrides for Apple One
  if (slug.includes('apple')) {
      return type === 'full' ? '/logos/apple-one.svg' : '/logos/icon-apple-one.svg'
  }

  // 2. Mapped URLs (mostly square icons)
  const urls = {
    spotify: "https://static.gamsgocdn.com/image/6d47adc2ee2ff09b0619c243178fd0e0.webp",
    youtube: "https://static.gamsgocdn.com/image/e77cda6be20a7932313652873177810b.webp",
    disney: "https://static.gamsgocdn.com/image/c6946da9047029676579ae2089851610.webp",
    prime: "https://static.gamsgocdn.com/image/8c13063462058097d6d39699042b083c.webp",
    hbo: "https://static.gamsgocdn.com/image/d367c29370cb8d672522718bb7b3699c.webp",
    chatgpt: "https://static.gamsgocdn.com/image/09873fc003290de0d015c92473456c64.webp",
    crunchyroll: "https://static.gamsgocdn.com/image/928e1d51de58f382a86566c5d9560f76.webp",
    nordvpn: "https://static.gamsgocdn.com/image/6e7e43685323a6750036ee7bf507542c.webp",
    duolingo: "https://static.gamsgocdn.com/image/05634865f33f6312a0212f71661d9a2a.png", 
    canva: "https://static.gamsgocdn.com/image/fc7f17424683070732817d230182559e.png"
  }
  
  const key = Object.keys(urls).find(k => slug.includes(k))
  return key ? urls[key] : null
}

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
