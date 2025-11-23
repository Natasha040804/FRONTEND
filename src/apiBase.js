export const getApiBase = () => {
  // Highest priority: explicit override via global or env
  const override = (typeof window !== 'undefined' && window.__API_BASE__) || process.env.REACT_APP_API_BASE;
  if (override) return override.replace(/\/$/, '');

  // SSR / build-time: fall back based on NODE_ENV
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
  }

  const host = window.location.hostname;
  // Local dev hosts -> explicit backend port
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5000';
  // Everything else (EC2 IP, domain, etc.) -> same-origin relative
  return '';
};

// Optional helper: build full URL ensuring single slash
export const apiUrl = (path = '') => {
  const base = getApiBase();
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};