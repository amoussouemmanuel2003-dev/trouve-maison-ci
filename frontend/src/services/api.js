import axios from 'axios';

// Utiliser la variable d'environnement Vite ou le fallback automatique de production sur Render
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  // En ligne (Vercel / production), rediriger vers l'API Render
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://trouve-maison-ci.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const baseURL = getBaseURL();

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
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
