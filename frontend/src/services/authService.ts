import apiClient from './api';
import OneSignal from 'react-onesignal';
import { API_ENDPOINTS } from '../config/api';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDriverDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  licenseNumber: string;
  registrationToken: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// Token en localStorage = connexion persistante jusqu'au clic sur "Déconnecter" (ou expiration du JWT)
export const authService = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, data);
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return response.data;
  },

  registerDriver: async (data: RegisterDriverDto): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.REGISTER_DRIVER, data);
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    OneSignal.logout().catch(() => {});
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      localStorage.removeItem('token');
      return false;
    }
    try {
      // Décoder le JWT token pour vérifier l'expiration (base64url)
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const exp = payload.exp;
      if (exp && exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        return false;
      }
      return true;
    } catch {
      localStorage.removeItem('token');
      return false;
    }
  },

  getRole: (): 'admin' | 'driver' | 'client' | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.role || null;
    } catch {
      return null;
    }
  },

  /** ID utilisateur depuis le JWT (pour OneSignal.login / external_id) */
  getUserId: (): string | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.sub ?? payload.id ?? null;
    } catch {
      return null;
    }
  },
};

