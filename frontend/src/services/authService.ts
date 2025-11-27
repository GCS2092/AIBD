import apiClient from './api';
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
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  getRole: (): 'admin' | 'driver' | 'client' | null => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      // Décoder le JWT token (partie payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  },
};

