import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface DashboardStats {
  rides: {
    total: number;
    completed: number;
    pending: number;
    assigned: number;
    accepted: number;
    cancelled: number;
    byDay: Array<{ date: string; count: string }>;
  };
  drivers: {
    total: number;
    active: number;
    avgRating: number;
  };
  revenue: {
    total: number;
    byDay: Array<{ date: string; revenue: string }>;
  };
  metrics: {
    acceptanceRate: number;
    cancellationRate: number;
    avgResponseTimeMinutes: number;
  };
}

export interface Driver {
  id: string;
  userId: string;
  licenseNumber: string;
  status: string;
  isVerified: boolean;
  totalRides: number;
  rating: number;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface Vehicle {
  id: string;
  driverId: string;
  brand: string;
  model: string;
  licensePlate: string;
  color?: string;
  year?: number;
  capacity?: number;
  photoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  driver?: Driver;
}

export interface Ride {
  id: string;
  rideType: string;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string;
  status: string;
  price: number;
  flightNumber?: string;
  driverId?: string;
  driver?: Driver;
  createdAt: string;
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

export const adminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN_STATS);
    return response.data;
  },

  getAllDrivers: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Driver>> => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN_DRIVERS, {
      params: { page, limit },
    });
    return response.data;
  },

  getDriverById: async (id: string): Promise<Driver> => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN_DRIVER(id));
    return response.data;
  },

  getAllRides: async (
    page: number = 1,
    limit: number = 10,
    params?: {
      status?: string;
      driverId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    }
  ): Promise<PaginatedResponse<Ride>> => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN_RIDES, {
      params: { page, limit, ...params },
    });
    return response.data;
  },

  updateDriver: async (id: string, data: Partial<Driver>): Promise<Driver> => {
    const response = await apiClient.put(API_ENDPOINTS.ADMIN_DRIVER(id), data);
    return response.data;
  },

  getRideById: async (id: string): Promise<Ride> => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN_RIDE(id));
    return response.data;
  },

  assignRideToDriver: async (rideId: string, driverId: string): Promise<Ride> => {
    const response = await apiClient.post(API_ENDPOINTS.ADMIN_ASSIGN_RIDE(rideId, driverId));
    return response.data;
  },

  getAllVehicles: async (page: number = 1, limit: number = 10, driverId?: string): Promise<PaginatedResponse<Vehicle>> => {
    const response = await apiClient.get('/admin/vehicles', {
      params: { page, limit, ...(driverId ? { driverId } : {}) },
    });
    return response.data;
  },
};

