import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export type TripType = 'aller_retour' | 'aller_simple' | 'retour_simple';

export interface CreateRideDto {
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail?: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string;
  tripType?: TripType;
  rideType?: 'airport_to_city' | 'city_to_airport' | 'dakar_to_airport' | 'airport_to_dakar';
  flightNumber?: string;
  pickupCountry?: string;
  pickupCity?: string;
  pickupQuartier?: string;
  dropoffCountry?: string;
  dropoffCity?: string;
  dropoffQuartier?: string;
  numberOfPassengers?: number;
  numberOfBags?: number;
  specialRequests?: string;
}

export interface Ride {
  id: string;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail?: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string;
  rideType: string;
  tripType?: TripType;
  pickupCountry?: string;
  pickupCity?: string;
  pickupQuartier?: string;
  dropoffCountry?: string;
  dropoffCity?: string;
  dropoffQuartier?: string;
  flightNumber?: string;
  numberOfPassengers?: number;
  numberOfBags?: number;
  price: number;
  status: 'pending' | 'assigned' | 'accepted' | 'driver_on_way' | 'picked_up' | 'in_progress' | 'completed' | 'cancelled';
  driverId?: string;
  assignedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  accessCode?: string;
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
  driver?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
    };
    vehicles?: Array<{
      id: string;
      brand: string;
      model: string;
      licensePlate: string;
      color?: string;
      year?: number;
      isActive: boolean;
    }>;
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

  getRideByAccessCode: async (accessCode: string, phone: string): Promise<Ride> => {
    const response = await apiClient.get(API_ENDPOINTS.RIDE_BY_CODE, {
      params: { accessCode: accessCode.trim(), phone: phone.trim() },
    });
    return response.data;
  },

  updateRideByAccessCode: async (
    accessCode: string,
    phone: string,
    data: Partial<CreateRideDto> & { scheduledAt?: string }
  ): Promise<Ride> => {
    const response = await apiClient.patch(API_ENDPOINTS.RIDE_BY_CODE, data, {
      params: { accessCode: accessCode.trim(), phone: phone.trim() },
    });
    return response.data;
  },
};

