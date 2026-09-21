import api from './api';

export const FALLBACK_LISTING_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';
const apiOrigin = new URL(api.defaults.baseURL).origin;

// Accepte les anciennes valeurs /uploads/photo.jpg et http://localhost:5000/uploads/photo.jpg.
export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return FALLBACK_LISTING_IMAGE;
  try {
    const parsed = new URL(imageUrl, window.location.origin);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return `${apiOrigin}${parsed.pathname}${parsed.search}`;
    }
    if (/^https?:$/.test(parsed.protocol)) return parsed.href;
  } catch {
    // Une URL relative est traitée ci-dessous.
  }
  return `${apiOrigin}/${String(imageUrl).replace(/^\/+/, '')}`;
}