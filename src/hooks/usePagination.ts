import { useState } from 'react';
import type { PageRequest } from '@/types/pagination';

export function usePagination() {
  const [request, setRequest] = useState<PageRequest>({
    page: 1,
    pageSize: 25,
    search: '',
    status: 'all',
  });
  const change = (values: Partial<PageRequest>) =>
    setRequest((current) => ({ ...current, ...values, page: 1 }));
  return {
    request,
    setPage: (page: number) => setRequest((current) => ({ ...current, page })),
    setPageSize: (pageSize: number) => change({ pageSize }),
    setSearch: (search: string) => change({ search }),
    setStatus: (status: string) => change({ status }),
  };
}
