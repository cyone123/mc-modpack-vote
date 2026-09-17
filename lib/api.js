export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');

export function getApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}
