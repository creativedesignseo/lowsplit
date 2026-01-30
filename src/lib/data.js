// ==============================================
// LowSplit Data Module
// ==============================================
// 
// NOTA: Los datos de servicios ahora vienen de Supabase
// Este archivo solo contiene constantes de configuración
//
// Para agregar nuevos servicios, usa el SQL Editor de Supabase
// o ejecuta: database/seed_services.sql
// ==============================================

/**
 * Categorías de servicios disponibles
 */
export const SERVICE_CATEGORIES = [
  { id: 'streaming', name: 'Streaming', emoji: '🎬' },
  { id: 'music', name: 'Música', emoji: '🎵' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮' },
  { id: 'productivity', name: 'Productividad', emoji: '💼' },
  { id: 'ai', name: 'Inteligencia Artificial', emoji: '🤖' },
  { id: 'education', name: 'Educación', emoji: '📚' },
  { id: 'security', name: 'Seguridad', emoji: '🔒' },
  { id: 'bundle', name: 'Paquetes', emoji: '📦' }
]

/**
 * Estados posibles de un grupo
 */
export const GROUP_STATUS = {
  AVAILABLE: 'available',
  FULL: 'full',
  CLOSED: 'closed'
}

/**
 * Estados de membresía
 */
export const MEMBERSHIP_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
}

/**
 * Métodos de pago soportados
 */
export const PAYMENT_METHODS = {
  STRIPE: 'stripe',
  BIZUM: 'bizum',
  WALLET: 'wallet'
}
