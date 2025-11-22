// utils/api.js - simple API service with auth headers and 401 handling
class ApiService {
  constructor() {
    // Prefer env override first (build-time)
    const env = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL;
    if (env) {
      this.baseURL = env.replace(/\/$/, '');
    } else {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      this.baseURL = (hostname === 'localhost' || hostname === '127.0.0.1') ? 'http://localhost:5000' : '';
    }
    if (typeof window !== 'undefined') {
      // Debug one-time log (comment out if noisy)
      if (!window.__apiBaseLogged) {
        console.log('[ApiService] baseURL resolved to:', this.baseURL || '(same-origin)');
        window.__apiBaseLogged = true;
      }
    }
  }

  getToken() {
    try {
      // Prefer AuthContext-stored accessToken
      return localStorage.getItem('accessToken') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    } catch (_) {
      return null;
    }
  }

  async getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async handleResponse(response) {
    if (response.status === 401) {
      try { localStorage.removeItem('authToken'); } catch {}
      try { sessionStorage.removeItem('authToken'); } catch {}
      // Do not force redirect loop; let the page logic handle login navigation
      throw new Error('Authentication failed');
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP error! status: ${response.status}`);
    }
    try {
      return await response.json();
    } catch (_) {
      return null;
    }
  }

  async get(url) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
      credentials: 'include',
    });
    return this.handleResponse(response);
  }

  async post(url, data) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async put(url, data) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async delete(url) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
      credentials: 'include',
    });
    return this.handleResponse(response);
  }
}

const apiService = new ApiService();
export default apiService;
