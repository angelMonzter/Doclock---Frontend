import { useQuery, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../services/mockDocumentService';
export const documentsKey = ['documents'] as const;
export function useDocuments() {
  return useQuery({ queryKey: documentsKey, queryFn: () => documentService.getSnapshot(), staleTime: Infinity });
}
export function useRefreshDocuments() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: documentsKey });
}
