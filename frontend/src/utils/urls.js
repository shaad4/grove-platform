const PROTOCOL = window.location.protocol  // 'https:' or 'http:'
const WS_PROTOCOL = PROTOCOL === 'https:' ? 'wss:' : 'ws:'
const PORT = import.meta.env.VITE_PORT || '5173'
const API_PORT = PROTOCOL === 'https:' ? '8443' : '8000'
const DOMAIN = import.meta.env.VITE_APP_DOMAIN || 'lvh.me'

export const appUrl = (slug, path = '') =>
  slug
    ? `${PROTOCOL}//${slug}.${DOMAIN}:${PORT}${path}`
    : `${PROTOCOL}//${DOMAIN}:${PORT}${path}`

export const wsUrl = (path) =>
  `${WS_PROTOCOL}//api.${DOMAIN}:${API_PORT}${path}`