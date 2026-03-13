import axios from 'axios';

// Criamos a instância do Axios
const api = axios.create({
  // Graças ao proxy no vite.config.js, não precisamos da URL completa
  baseURL: '/api',
});

// Interceptor para adicionar o Token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    // Buscamos o token que salvaremos no localStorage após o login
    const token = localStorage.getItem('token');
    
    if (token) {
      // Se o token existir, adicionamos ao cabeçalho Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta (Opcional, mas útil para lidar com erros de login expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se o backend retornar 401 (Não autorizado), o token pode ter expirado
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // window.location.href = '/login'; // Opcional: Redireciona se o token expirar
    }
    return Promise.reject(error);
  }
);

export default api;