import { useQuery, useQueryClient } from '@tanstack/react-query';
import { repositoryService } from '@/services/documents/repositoryService';
import { useAuth } from '@/providers/AuthProvider';
import { historyKey } from '@/hooks/administration/controlKeys';
export const documentsKey = ['documents'] as const;
export function useDocuments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...documentsKey, user?.id, user?.permissions],
    queryFn: ({ signal }) =>
      repositoryService.getSnapshot(user!.permissions, signal),
    enabled: Boolean(user),
    refetchOnWindowFocus: true,
  });
}
export function useRefreshDocuments() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: documentsKey }),
      client.invalidateQueries({ queryKey: historyKey }),
    ]);
}
