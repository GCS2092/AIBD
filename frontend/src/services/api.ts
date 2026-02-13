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
      
      const baseUrl = error.config?.baseURL || 'non définie';
      const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
      const isSupabaseUrl = typeof baseUrl === 'string' && baseUrl.includes('supabase.co');
      const isVercel = typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.com'));
      let errorMessage: string;
      if (isVercel && isSupabaseUrl) {
        errorMessage = `VITE_API_URL pointe vers Supabase (${baseUrl}). Il doit pointer vers ton backend NestJS (ex. https://ton-backend.onrender.com), pas vers Supabase. Sur Vercel → Settings → Environment Variables, remplace VITE_API_URL par l’URL publique de ton backend, puis redéploie.`;
      } else if (isVercel && isLocalhost) {
        errorMessage = `Impossible de se connecter au backend. L’API pointe vers ${baseUrl} (local). Sur Vercel → Settings → Environment Variables, définir VITE_API_URL avec l’URL publique de ton backend NestJS, puis redéployer.`;
      } else {
        errorMessage = `Impossible de se connecter au serveur. Vérifiez que :
1. Le backend est démarré (http://localhost:3001)
2. Vous êtes sur le même réseau WiFi
3. L’URL de l’API est correcte : ${baseUrl}
4. Le firewall autorise les connexions sur le port 3001`;
      }
      
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

