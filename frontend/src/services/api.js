import axios from 'axios';

// Utiliser la variable d'environnement Vite ou le fallback par défaut
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Intercepteur de requête : injection automatique du token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tmci_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse : déconnexion automatique en cas de token révoqué/expiré (401)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si la session expire, nettoyer le token local
      if (localStorage.getItem('tmci_token')) {
        localStorage.removeItem('tmci_token');
        localStorage.removeItem('tmci_user');
        // Rediriger optionnellement vers la connexion si besoin
      }
    }
    return Promise.reject(error);
  }
);

export default api;
