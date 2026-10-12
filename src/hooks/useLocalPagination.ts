import { useState } from 'react';

// Para colecciones ya locales: catálogos simulados y jerarquía de carpetas.
export function useLocalPagination<T>(rows: readonly T[], filterKey: string) {
  const [state, setState] = useState({ key: filterKey, page: 1, pageSize: 25 });
  const page = Math.min(
    state.key === filterKey ? state.page : 1,
    Math.max(1, Math.ceil(rows.length / state.pageSize)),
  );
  return {
    items: rows.slice((page - 1) * state.pageSize, page * state.pageSize),
    pagination: {
      page,
      pageSize: state.pageSize,
      total: rows.length,
      onPageChange: (next: number) =>
        setState({ ...state, key: filterKey, page: next }),
      onPageSizeChange: (pageSize: number) =>
        setState({ key: filterKey, page: 1, pageSize }),
    },
  };
}
