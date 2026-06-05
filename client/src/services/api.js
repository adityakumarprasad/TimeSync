const TOKEN_KEY = 'task_ai_token';
const API_BASE = import.meta.env.VITE_API_URL || '';

let token = localStorage.getItem(TOKEN_KEY) || null;

const api = {
  setToken: (newToken) => {
    token = newToken;
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  getToken: () => token,

  clearToken: () => {
    token = null;
    localStorage.removeItem(TOKEN_KEY);
  },

  request: async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error.message);
      throw error;
    }
  },

  auth: {
    register: (username, email, password) => 
      api.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      }),
    login: (emailOrUsername, password) => 
      api.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrUsername, password }),
      }),
    me: () => 
      api.request('/api/auth/me', {
        method: 'GET',
      }),
  },

  tasks: {
    getAll: () => 
      api.request('/api/tasks', {
        method: 'GET',
      }),
    create: (title, description) => 
      api.request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      }),
    update: (id, data) => 
      api.request(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) => 
      api.request(`/api/tasks/${id}`, {
        method: 'DELETE',
      }),
    startTimer: (id) => 
      api.request(`/api/tasks/${id}/start`, {
        method: 'POST',
      }),
    stopTimer: (id) => 
      api.request(`/api/tasks/${id}/stop`, {
        method: 'POST',
      }),
  },

  timeLogs: {
    getAll: () => 
      api.request('/api/timelogs', {
        method: 'GET',
      }),
    getTodaySummary: () => 
      api.request('/api/timelogs/today', {
        method: 'GET',
      }),
    deleteLog: (id) => 
      api.request(`/api/timelogs/${id}`, {
        method: 'DELETE',
      }),
  },

  ai: {
    optimize: (taskInput) => 
      api.request('/api/ai/optimize', {
        method: 'POST',
        body: JSON.stringify({ taskInput }),
      }),
  }
};

export default api;
