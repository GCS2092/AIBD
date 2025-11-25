import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface CreateRideDto {
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail?: string; // Email optionnel
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string;
  rideType: 'airport_to_city' | 'city_to_airport' | 'city_to_city';
  flightNumber?: string;
  numberOfPassengers: number;
  numberOfBags: number;
  specialRequests?: string;
}

export interface Ride {
  id: string;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail?: string; // Email optionnel
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string;
  rideType: string;
  flightNumber?: string;
  numberOfPassengers: number;
  numberOfBags: number;
  price: number;
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  driverId?: string;
  assignedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  accessCode?: string; // Code d'accès unique
  driverLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const rideService = {
  createRide: async (data: CreateRideDto): Promise<Ride> => {
    const response = await apiClient.post(API_ENDPOINTS.RIDES, data);
    return response.data;
  },

  getRideStatus: async (id: string): Promise<Ride> => {
    const response = await apiClient.get(API_ENDPOINTS.RIDE_STATUS(id));
    return response.data;
  },

  cancelRide: async (id: string, reason: string, cancelledBy: string): Promise<Ride> => {
    const response = await apiClient.post(API_ENDPOINTS.CANCEL_RIDE(id), {
      reason,
      cancelledBy,
    });
    return response.data;
  },

  getMyRides: async (
    page: number = 1,
    limit: number = 10,
    phone?: string,
    email?: string,
    firstName?: string,
    lastName?: string,
    accessCode?: string
  ): Promise<PaginatedResponse<Ride>> => {
    const params: any = { page, limit };
    if (phone) params.phone = phone;
    if (email) params.email = email;
    if (firstName) params.firstName = firstName;
    if (lastName) params.lastName = lastName;
    if (accessCode) params.accessCode = accessCode;
    
    const response = await apiClient.get(API_ENDPOINTS.USER_RIDES, { params });
    return response.data;
  },
};

