import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rideService, CreateRideDto } from '../services/rideService';

export const useCreateRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRideDto) => rideService.createRide(data),
    onSuccess: () => {
      // Invalider toutes les queries liées pour rafraîchir automatiquement
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['my-rides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['driver-available-rides'] });
    },
    onError: (error) => {
      console.error('Erreur création course:', error);
    },
  });
};

export const useRideStatus = (rideId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['ride', rideId],
    queryFn: () => rideService.getRideStatus(rideId!),
    enabled: enabled && !!rideId,
    refetchInterval: 5000, // Poll toutes les 5 secondes
  });
};

export const useCancelRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason, cancelledBy }: { id: string; reason: string; cancelledBy: string }) =>
      rideService.cancelRide(id, reason, cancelledBy),
    onSuccess: () => {
      // Invalider toutes les queries liées pour rafraîchir automatiquement
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['my-rides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rides'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-available-rides'] });
    },
  });
};

