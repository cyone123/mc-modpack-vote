// API Base URL resolver:
// - In local / unified fullstack: API_BASE is empty (''), fetches current origin relative path '/api/...'
// - In Vercel / Cloudflare Pages / separate frontend deployment: configure VITE_API_BASE env variable
//   e.g. VITE_API_BASE="https://my-backend-server.com"
export const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export function getApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}
