import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Pricing {
  id: string;
  name: string;
  rideType: string;
  type: 'standard' | 'peak_hours' | 'night' | 'special';
  price: number;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  basePrice?: number; // Pour compatibilité (déprécié, utiliser 'price')
  additionalBagPrice?: number; // Pour compatibilité (déprécié)
}

export interface CreatePricingDto {
  name: string;
  rideType: string;
  type: 'standard' | 'peak_hours' | 'night' | 'special';
  price: number;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  isActive?: boolean;
  description?: string;
}

export const pricingService = {
  getAllPricing: async (rideType?: string, includeInactive: boolean = false): Promise<Pricing[]> => {
    const params: any = {};
    if (rideType) params.rideType = rideType;
    if (includeInactive) params.includeInactive = 'true';
    const response = await apiClient.get(API_ENDPOINTS.PRICING, { params });
    return response.data;
  },

  getPricingById: async (id: string): Promise<Pricing> => {
    const response = await apiClient.get(`${API_ENDPOINTS.PRICING}/${id}`);
    return response.data;
  },

  createPricing: async (data: CreatePricingDto): Promise<Pricing> => {
    const response = await apiClient.post(API_ENDPOINTS.PRICING, data);
    return response.data;
  },

  updatePricing: async (id: string, data: Partial<CreatePricingDto>): Promise<Pricing> => {
    const response = await apiClient.put(`${API_ENDPOINTS.PRICING}/${id}`, data);
    return response.data;
  },

  deletePricing: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.PRICING}/${id}`);
  },
};

