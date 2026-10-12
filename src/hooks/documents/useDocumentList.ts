import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { documentListService } from '@/services/documents/documentListService';
import { documentsKey } from './useDocuments';

export function useDocumentList(params: URLSearchParams) {
  const { user } = useAuth();
  const allowed = Boolean(user?.permissions.puede_ver_archivos);
  const size = Number(params.get('cantidad') ?? 25);
  const pageSize = [10, 25, 50, 100].includes(size) ? size : 25;
  const requested = Number(params.get('pagina') ?? 1);
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  const request = new URLSearchParams({
    paginated: '1',
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  for (const [source, target] of [
    ['carpeta', 'sid_carpeta'],
    ['categoria', 'sid_categoria'],
    ['q', 'search'],
    ['tipo', 'extension'],
    ['orden', 'sort'],
  ]) {
    if (params.get(source)) request.set(target, params.get(source)!);
  }
  const query = useQuery({
    queryKey: [...documentsKey, 'page', user?.id, request.toString()],
    queryFn: ({ signal }) => documentListService.page(request, signal),
    enabled: allowed,
    placeholderData: keepPreviousData,
    retry: false,
  });
  const id = params.get('documento');
  const selected = useQuery({
    queryKey: [...documentsKey, 'detail', user?.id, id],
    queryFn: ({ signal }) => documentListService.get(id!, signal),
    enabled: allowed && !!id,
    retry: false,
  });
  return {
    query,
    selected,
    pageSize,
    page:
      query.data && !query.isPlaceholderData
        ? Math.floor(query.data.offset / query.data.limit) + 1
        : page,
  };
}
