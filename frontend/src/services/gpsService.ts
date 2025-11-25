import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Location {
  lat: number;
  lng: number;
  timestamp?: string;
}

export interface LocationData {
  driverLocation?: Location;
  pickupLocation?: Location;
  dropoffLocation?: Location;
}

export interface ETA {
  estimatedTimeMinutes: number | null;
  estimatedTimeFormatted: string;
}

export const gpsService = {
  getDriverLocation: async (rideId: string): Promise<LocationData> => {
    const response = await apiClient.get(API_ENDPOINTS.GPS_LOCATION(rideId));
    return response.data;
  },

  getETA: async (rideId: string): Promise<ETA> => {
    const response = await apiClient.get(API_ENDPOINTS.GPS_ETA(rideId));
    return response.data;
  },

  updateDriverLocation: async (rideId: string, lat: number, lng: number): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.GPS_LOCATION(rideId), { lat, lng });
  },
};

