import axios from 'axios';
import { API_URL } from '../config/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Erreur réseau (pas de réponse du serveur)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('❌ Erreur réseau:', {
        message: error.message,
        code: error.code,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        hostname: window.location.hostname,
      });
      
      // Afficher un message plus clair
      const errorMessage = `Impossible de se connecter au serveur. Vérifiez que :
1. Le backend est démarré (http://localhost:3000)
2. Vous êtes sur le même réseau WiFi
3. L'URL de l'API est correcte: ${error.config?.baseURL || 'non définie'}`;
      
      console.error(errorMessage);
      
      // Retourner une erreur avec un message plus clair
      return Promise.reject(new Error(errorMessage));
    }
    
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
    });
    
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Retourner l'erreur avec plus de détails
    return Promise.reject(error);
  }
);

export default apiClient;

