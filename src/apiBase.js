export const getApiBase = () => {
  // Explicit override via injected global or build-time env
  const override = (typeof window !== 'undefined' && window.__API_BASE__) || process.env.REACT_APP_API_BASE;
  if (override) return override.replace(/\/$/, '');

  // Server-side render / build: choose dev fallback; prod requires explicit override
  if (typeof window === 'undefined') {
    if (process.env.NODE_ENV === 'development') return 'http://localhost:5000';
    return ''; // expect REACT_APP_API_BASE to be set at build time for production
  }

  const host = window.location.hostname;
  // Local dev hosts -> explicit backend port
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5000';

  // Production: if still no override we warn (relative calls will hit the frontend origin and likely fail with 404/405)
  if (!override) {
    console.error('[apiBase] Missing REACT_APP_API_BASE or window.__API_BASE__ in production; API calls will target the frontend host and may return HTML/405.');
  }
  return '';
};

// Optional helper: build full URL ensuring single slash
export const apiUrl = (path = '') => {
  const base = getApiBase();
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};
