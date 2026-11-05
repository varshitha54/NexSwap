const API_URL = import.meta.env.VITE_API_URL || '/api'
const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || ''

function backendOrigin() {
  if (MEDIA_URL) return MEDIA_URL.replace(/\/$/, '')
  if (/^https?:\/\//i.test(API_URL)) {
    try {
      return new URL(API_URL).origin
    } catch {
      return ''
    }
  }
  return ''
}

export function mediaUrl(path) {
  if (!path) return null
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  const origin = backendOrigin()
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
