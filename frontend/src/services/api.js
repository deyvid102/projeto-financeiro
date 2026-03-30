import axios from 'axios';

// Defina a URL BASE sem o /api no final se a sua variável de ambiente já o tiver, 
// ou padronize para evitar confusão.
const RENDER_URL = 'http://localhost:5000/api';

const API_URL = import.meta.env.VITE_API_URL || RENDER_URL;

// LOG DE DEBUG: Verifique no console (F12) se a URL aparece correta ou duplicada
console.log("🔗 Conectando na API:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar o Token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API ERROR]', {
      status: error?.response?.status,
      url: error?.config?.url,
      method: error?.config?.method,
      response: error?.response?.data,
    });
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Opcional: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;