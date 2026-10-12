import { useRef, useState } from 'react';
import { adminModules } from '@/config/administration';
import { useAdministration } from './useAdministration';
import type { AdminRecord, ModuleId } from '@/types/administration';
import { useLocalPagination } from '@/hooks/useLocalPagination';

export function useAdministrationPage(module: ModuleId) {
  const definition = adminModules[module];
  const query = useAdministration();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
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

  const filtered = records.filter(
    (record) =>
      (status === 'all' ||
        Boolean(record.values.activo) === (status === 'active')) &&
      definition.columns.some((key) =>
        display(record, key)
          .toLocaleLowerCase('es')
          .includes(search.trim().toLocaleLowerCase('es')),
      ),
  );

  function open(record: AdminRecord | 'new', triggerId: string) {
    trigger.current = triggerId;
    setSaved(false);
    setEditing(record);
  }

  const paged = useLocalPagination(
    filtered,
    module + ':' + search + ':' + status,
  );

  function finishSaving() {
    setSaved(true);
    close();
  }

  return {
    query,
    records,
    filtered: paged.items,
    pagination: paged.pagination,
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
