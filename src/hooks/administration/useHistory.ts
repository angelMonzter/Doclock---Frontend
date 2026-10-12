import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { historyService } from '@/services/administration/historyService';
import { historyKey } from './controlKeys';
import type { HistoryFilters } from '@/types/control';

//code mode control: la bitácora es de solo lectura y requiere su permiso específico.
export function useHistory(filters: HistoryFilters, valid = true) {
  const { user } = useAuth();
  const allowed = Boolean(user?.permissions.puede_ver_historial);
  const query = useQuery({
    queryKey: [...historyKey, user?.id, filters],
    queryFn: ({ signal }) => historyService.page(filters, signal),
    enabled: allowed && valid,
    placeholderData: keepPreviousData,
    retry: false,
  });
  return { query, allowed };
}
