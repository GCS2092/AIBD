import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface DriverProfile {
  id: string;
  licenseNumber: string;
  status: string;
  isVerified: boolean;
  totalRides: number;
  rating: number;
  vehicles?: Vehicle[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  color?: string;
  year?: number;
  capacity?: number;
  photoUrl?: string;
  isActive: boolean;
}

export interface RequestProfileUpdateDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface CreateVehicleDto {
  brand: string;
  model: string;
  licensePlate: string;
  color?: string;
  year?: number;
  capacity?: number;
  photoUrl?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Ride {
  id: string;
  rideType: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string;
  status: string;
  price: number;
  createdAt: string;
  numberOfPassengers?: number;
  numberOfBags?: number;
  clientFirstName?: string;
  clientLastName?: string;
  clientPhone?: string;
  clientEmail?: string;
  flightNumber?: string;
  driverLocation?: {
    lat: number;
    lng: number;
    timestamp?: string;
  };
  pickupLocation?: {
    lat: number;
    lng: number;
  };
  dropoffLocation?: {
    lat: number;
    lng: number;
  };
}

export const driverService = {
  getProfile: async (): Promise<DriverProfile> => {
    const response = await apiClient.get(API_ENDPOINTS.DRIVER_PROFILE);
    return response.data;
  },

  updateStatus: async (status: string): Promise<DriverProfile> => {
    const response = await apiClient.put(API_ENDPOINTS.DRIVER_STATUS, { status });
    return response.data;
  },

  getMyRides: async (page: number = 1, limit: number = 10, status?: string): Promise<PaginatedResponse<Ride>> => {
    const response = await apiClient.get(API_ENDPOINTS.DRIVER_RIDES, {
      params: { page, limit, ...(status ? { status } : {}) },
    });
    return response.data;
  },

  getRideById: async (rideId: string): Promise<Ride> => {
    const response = await apiClient.get(`/driver/rides/${rideId}`);
    return response.data;
  },

  getAvailableRides: async (): Promise<Ride[]> => {
    const response = await apiClient.get('/driver/rides/available');
    return response.data;
  },

  acceptRide: async (rideId: string): Promise<Ride> => {
    const response = await apiClient.post(API_ENDPOINTS.DRIVER_ACCEPT_RIDE(rideId));
    return response.data;
  },

  refuseRide: async (rideId: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.DRIVER_REFUSE_RIDE(rideId));
  },

  startRide: async (rideId: string): Promise<Ride> => {
    const response = await apiClient.post(API_ENDPOINTS.DRIVER_START_RIDE(rideId));
    return response.data;
  },

  completeRide: async (rideId: string): Promise<Ride> => {
    const response = await apiClient.post(API_ENDPOINTS.DRIVER_COMPLETE_RIDE(rideId));
    return response.data;
  },

  requestProfileUpdate: async (data: RequestProfileUpdateDto): Promise<{ message: string }> => {
    const response = await apiClient.post('/driver/profile/request-update', data);
    return response.data;
  },

  registerVehicle: async (data: CreateVehicleDto): Promise<Vehicle> => {
    const response = await apiClient.post('/driver/vehicle', data);
    return response.data;
  },

  getMyVehicle: async (): Promise<Vehicle | null> => {
    const response = await apiClient.get('/driver/vehicle');
    return response.data;
  },
};

