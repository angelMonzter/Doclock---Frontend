import { apiRequest } from './api';
import type { PageRequest, PageResult } from '@/types/pagination';

export function readPage<T>(
  path: string,
  request: PageRequest,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    paginated: '1',
    limit: String(request.pageSize),
    offset: String((request.page - 1) * request.pageSize),
    search: request.search.trim(),
    status: request.status,
  });
  return apiRequest<PageResult<T>>(path + '?' + params, { signal });
}

//code mode control: recorre la paginación del backend sin truncar las listas a 100 registros.
export async function readAllPages<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const records: T[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await apiRequest<T[]>(
      path + (path.includes('?') ? '&' : '?') + 'limit=100&offset=' + offset,
      {
        signal,
      },
    );
    records.push(...page);
    if (page.length < 100) return records;
  }
}
