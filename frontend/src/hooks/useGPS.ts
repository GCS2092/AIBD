import { useQuery, useMutation } from '@tanstack/react-query';
import { gpsService } from '../services/gpsService';

export const useDriverLocation = (rideId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['gps', 'location', rideId],
    queryFn: () => gpsService.getDriverLocation(rideId!),
    enabled: enabled && !!rideId,
    refetchInterval: 3000, // Mise à jour toutes les 3 secondes
  });
};

export const useETA = (rideId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['gps', 'eta', rideId],
    queryFn: () => gpsService.getETA(rideId!),
    enabled: enabled && !!rideId,
    refetchInterval: 10000, // Mise à jour toutes les 10 secondes
  });
};

export const useUpdateDriverLocation = () => {
  return useMutation({
    mutationFn: ({ rideId, lat, lng }: { rideId: string; lat: number; lng: number }) =>
      gpsService.updateDriverLocation(rideId, lat, lng),
  });
};

