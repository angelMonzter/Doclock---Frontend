import { historyKey } from '@/hooks/administration/controlKeys';
import { useRef, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { usePagination } from '@/hooks/usePagination';
import { usersService } from '@/services/administration/usersService';
import { useAuth } from '@/providers/AuthProvider';
import type { AdminRecord } from '@/types/administration';

//code mode usuarios: estado de Usuarios aislado de los catálogos dummy.
export const usersKey = ['users'] as const;

export function useUsersPage() {
  const module = 'users';
  const { user } = useAuth();
  const canManage = Boolean(user?.permissions.puede_gestionar_usuarios);
  const client = useQueryClient();
  const pagination = usePagination();
  const { search, status } = pagination.request;
  const { setSearch, setStatus } = pagination;
  const query = useQuery({
    queryKey: [...usersKey, user?.id, pagination.request],
    queryFn: ({ signal }) => usersService.page(pagination.request, signal),
    placeholderData: keepPreviousData,
    enabled: canManage,
    retry: false,
  });
  const deactivate = useMutation({
    mutationFn: usersService.deactivate,
    onSuccess: async (_result, id) => {
      //code mode control: refresca el historial real después de cambiar usuarios.
      await Promise.all([
        client.invalidateQueries({ queryKey: usersKey }),
        client.invalidateQueries({ queryKey: historyKey }),
      ]);
      setSaved(true);
      //code mode usuarios: devuelve el foco tras retirar la acción de desactivación.
      requestAnimationFrame(() => {
        (
          document.getElementById('admin-edit-' + id) ??
          document.querySelector<HTMLElement>('[data-page-heading]')
        )?.focus();
      });
    },
    retry: false,
  });
  const [editing, setEditing] = useState<AdminRecord | 'new' | null>(null);
  const [saved, setSaved] = useState(false);
  const trigger = useRef('admin-create');
  const records = query.data?.records[module] ?? [];

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
    if (key === 'sid_rol')
      return String(
        query.data?.records.roles.find((role) => role.id === value)?.values
          .nombre ?? 'Sin rol',
      );
    if (typeof value === 'boolean') return value ? 'Activo' : 'Inactivo';
    return String(value ?? '') || '—';
  }

  const filtered = query.isPlaceholderData ? [] : records;

  function open(record: AdminRecord | 'new', triggerId: string) {
    trigger.current = triggerId;
    deactivate.reset();
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
    canManage,
    deactivate,
    currentUserId: user?.id,
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
