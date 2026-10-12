import { apiRequest } from '@/services/api';
import { mapDocument, type DocumentRow } from './repositoryService';
import type { PageResult } from '@/types/pagination';

export const documentListService = {
  async page(params: URLSearchParams, signal?: AbortSignal) {
    const result = await apiRequest<PageResult<DocumentRow>>(
      '/archivos?' + params,
      { signal },
    );
    return { ...result, items: result.items.map(mapDocument) };
  },
  async get(id: string, signal?: AbortSignal) {
    return mapDocument(
      await apiRequest<DocumentRow>('/archivos/' + encodeURIComponent(id), {
        signal,
      }),
    );
  },
};
