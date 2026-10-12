import { useRef, useState } from 'react';
import { useControl } from './useControl';
import type { ControlModule } from '@/types/control';
import type { AdminRecord } from '@/types/administration';
import { usePagination } from '@/hooks/usePagination';

//code mode control: conserva filtros, edición y foco para los módulos con API.
export function useControlPage(module: ControlModule) {
  const pagination = usePagination();
  const { search, status } = pagination.request;
  const { setSearch, setStatus } = pagination;
  const { query, canRead, canWrite, currentRoleId } = useControl(
    module,
    pagination.request,
  );
  const [editing, setEditing] = useState<AdminRecord | 'new' | null>(null);
  const [saved, setSaved] = useState(false);
  const trigger = useRef('admin-create');
  const records = query.data?.items ?? [];

  function close() {
    setEditing(null);
    requestAnimationFrame(() =>
      (
        document.getElementById(trigger.current) ??
        document.querySelector<HTMLElement>('[data-page-heading]')
      )?.focus(),
    );
  }

  function display(record: AdminRecord, key: string) {
    const value = record.values[key];
    if (typeof value === 'boolean') return value ? 'Activo' : 'Inactivo';
    return String(value ?? '') || '—';
  }

  const filtered = query.isPlaceholderData ? [] : records;

  function open(record: AdminRecord | 'new', triggerId: string) {
    trigger.current = triggerId;
    setSaved(false);
    setEditing(record);
  }

  function finishSaving() {
    setSaved(true);
    close();
  }

  return {
    pagination: {
      page:
        query.data && !query.isPlaceholderData
          ? Math.floor(query.data.offset / query.data.limit) + 1
          : pagination.request.page,
      pageSize: pagination.request.pageSize,
      total: query.data?.total ?? 0,
      busy: query.isFetching,
      onPageChange: pagination.setPage,
      onPageSizeChange: pagination.setPageSize,
    },
    query,
    canRead,
    canWrite,
    currentRoleId,
    records,
    filtered,
    search,
    setSearch,
    status,
    setStatus,
    editing,
    saved,
    display,
    open,
    close,
    finishSaving,
  };
}
