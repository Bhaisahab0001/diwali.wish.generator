/**
 * API client for DiwaliVerse Secret Messages
 * Handles CSRF headers, authentication tokens, credentials, and error formatting
 */

const API_BASE = '/api';

// Cached token for persistent session state across page refreshes and tabs
let memoryToken: string | null = null;
try {
  memoryToken = localStorage.getItem('dv_auth_token') || sessionStorage.getItem('dv_auth_token');
} catch (e) {
  // Ignore in restricted environments
}

export function setAuthToken(token: string | null) {
  memoryToken = token;
  try {
    if (token) {
      localStorage.setItem('dv_auth_token', token);
      sessionStorage.setItem('dv_auth_token', token);
    } else {
      localStorage.removeItem('dv_auth_token');
      sessionStorage.removeItem('dv_auth_token');
    }
  } catch (e) {
    // Ignore storage issues
  }
}

export function getAuthToken(): string | null {
  if (!memoryToken) {
    try {
      memoryToken = localStorage.getItem('dv_auth_token') || sessionStorage.getItem('dv_auth_token');
    } catch (e) {}
  }
  return memoryToken;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('X-Requested-With', 'XMLHttpRequest');

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const currentToken = getAuthToken();
  if (currentToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // sends dv_session cookie
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // If unauthorized, clear expired/invalid token
    if (response.status === 401 && endpoint !== '/auth/login' && !endpoint.includes('/unlock')) {
      setAuthToken(null);
    }
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Status & Auth
  async getStatus() {
    return request('/auth/status', { method: 'GET' });
  },

  async register(payload: {
    email: string;
    password: string;
    confirm_password?: string;
    full_name?: string;
    display_name?: string;
    username?: string;
  }) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(payload: { email?: string; username?: string; password: string }) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res?.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  async getMe() {
    return request('/auth/me', { method: 'GET' });
  },

  // Owner Messages
  async getMessages() {
    return request('/messages', { method: 'GET' });
  },

  async getMessage(id: string) {
    return request(`/messages/${id}`, { method: 'GET' });
  },

  async createMessage(payload: any) {
    return request('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateMessage(id: string, payload: any) {
    return request(`/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteMessage(id: string) {
    return request(`/messages/${id}`, { method: 'DELETE' });
  },

  async duplicateMessage(id: string) {
    return request(`/messages/${id}/duplicate`, { method: 'POST' });
  },

  // Public Recipient
  async getPublicMessage(slug: string) {
    return request(`/public/message/${slug}`, { method: 'GET' });
  },

  async unlockPublicMessage(slug: string, password: string) {
    return request(`/public/message/${slug}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },
};
