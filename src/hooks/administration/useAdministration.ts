import { useQuery } from '@tanstack/react-query';
import { administrationService } from '@/services/administration/mockAdministrationService';
export const administrationKey = ['administration'] as const;
export function useAdministration() {
  return useQuery({ queryKey: administrationKey, queryFn: () => administrationService.getSnapshot(), staleTime: Infinity });
}
