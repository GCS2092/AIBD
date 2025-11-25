import { useQuery } from '@tanstack/react-query';
import { pricingService } from '../services/pricingService';

export const usePricing = (rideType?: string) => {
  return useQuery({
    queryKey: ['pricing', rideType],
    queryFn: () => pricingService.getAllPricing(rideType),
  });
};

