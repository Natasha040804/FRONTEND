export const getApiBase = () => {
  // Allow explicit override via env first
  const envBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  // Only map localhost → backend port. All other hosts use same-origin relative /api.
  return (hostname === 'localhost' || hostname === '127.0.0.1') ? 'http://localhost:5000' : '';
};

// For quick diagnostics during deployment you can temporarily uncomment:
// console.log('[getApiBase] resolved base:', getApiBase());