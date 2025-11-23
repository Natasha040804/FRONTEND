// utils/api.js - simple API service with auth headers and 401 handling
import { getApiBase } from '../apiBase';

class ApiService {
  constructor() {
    this.baseURL = getApiBase();
    try {
      // One-time debug to confirm effective base
      if (typeof window !== 'undefined') {
        console.log('[ApiService] baseURL =', this.baseURL || '(relative)');
      }
    } catch (_) {}
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
    const full = `${this.baseURL}${url.startsWith('/') ? url : '/' + url}`;
    const response = await fetch(full, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
      credentials: 'include',
    });
    return this.handleResponse(response);
  }

  async post(url, data) {
    const full = `${this.baseURL}${url.startsWith('/') ? url : '/' + url}`;
    const response = await fetch(full, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async put(url, data) {
    const full = `${this.baseURL}${url.startsWith('/') ? url : '/' + url}`;
    const response = await fetch(full, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async delete(url) {
    const full = `${this.baseURL}${url.startsWith('/') ? url : '/' + url}`;
    const response = await fetch(full, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
      credentials: 'include',
    });
    return this.handleResponse(response);
  }
}

const apiService = new ApiService();
export default apiService;
