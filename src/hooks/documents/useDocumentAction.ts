import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRefreshDocuments } from './useDocuments';

//code mode S3: la UI solo confirma después de la respuesta del servidor.
export function useDocumentAction<T>(action: (value: T) => Promise<void>) {
  const refresh = useRefreshDocuments();
  const client = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: async () => {
      await Promise.all([
        refresh(),
        client.invalidateQueries({ queryKey: ['documentVersions'] }),
        client.invalidateQueries({ queryKey: ['documentTrash'] }),
      ]);
    },
    retry: false,
  });
}
