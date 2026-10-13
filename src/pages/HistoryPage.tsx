//code mode control: historial real y diferencias parciales de la API.
import { SelectField } from '@/components/ui/SelectField';
import { useState } from 'react';
import {
  actionLabels,
  entityLabels,
  historyChanges,
  historyDescription,
} from '@/models/history';
import { useHistory } from '@/hooks/administration/useHistory';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextField } from '@/components/ui/TextField';
import { Notice } from '@/components/ui/Notice';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { HistoryFilters } from '@/types/control';
import { Pagination } from '@/components/ui/Pagination';

export function HistoryPage() {
  const [filters, setFilters] = useState<HistoryFilters>({
    page: 1,
    pageSize: 25,
    search: '',
    entity: 'all',
    action: 'all',
    from: '',
    to: '',
  });
  const { search, entity, action, from, to } = filters;
  const invalidDates = !!from && !!to && from > to;
  const { query, allowed } = useHistory(filters, !invalidDates);
  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const page =
    query.data && !query.isPlaceholderData
      ? Math.floor(query.data.offset / query.data.limit) + 1
      : filters.page;
  const change = (values: Partial<HistoryFilters>) =>
    setFilters((current) => ({ ...current, ...values, page: 1 }));
  if (!allowed)
    return (
      <Notice tone="error">
        No tienes permiso para consultar el historial.
      </Notice>
    );
  return (
    <div className="admin-module">
      <PageHeader
        title="Historial"
        description="Consulta quién realizó cada acción y qué cambió en el sistema."
      />
      <p className="demo-disclosure">
        Bitácora de los movimientos registrados por el sistema, de solo lectura.
      </p>
      <section className="panel">
        <div className="admin-toolbar">
          <TextField
            label="Buscar por descripción o usuario"
            value={search}
            maxLength={200}
            onChange={(event) => change({ search: event.target.value })}
          />
          <SelectField
            label="Módulo"
            value={entity}
            onChange={(event) => change({ entity: event.target.value })}
          >
            <option value="all">Todos</option>
            {Object.entries({
              ...entityLabels,
              ...Object.fromEntries(
                (query.data?.entities ?? [])
                  .filter((value) => !entityLabels[value])
                  .map((value) => [value, value]),
              ),
            }).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Acción"
            value={action}
            onChange={(event) => change({ action: event.target.value })}
          >
            <option value="all">Todas</option>
            {[
              ...new Set([
                ...(query.data?.actions ?? []),
                ...(action === 'all' ? [] : [action]),
              ]),
            ].map((value) => (
              <option key={value} value={value}>
                {actionLabels[value] ?? value.replaceAll('_', ' ')}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Desde"
            type="date"
            value={from}
            onChange={(event) => change({ from: event.target.value })}
          />
          <TextField
            label="Hasta"
            type="date"
            min={from}
            value={to}
            onChange={(event) => change({ to: event.target.value })}
          />
        </div>
        {invalidDates && (
          <Notice tone="error">
            La fecha final debe ser igual o posterior a la inicial.
          </Notice>
        )}
        {invalidDates ? null : query.isPending ? (
          <p role="status">Cargando historial…</p>
        ) : query.isError ? (
          <Notice tone="error">
            {query.error.message}{' '}
            <Button onClick={() => query.refetch()}>Reintentar</Button>
          </Notice>
        ) : (
          <>
            <p className="muted-text" role="status">
              {total} movimientos
            </p>
            <Pagination
              label="Paginación del historial"
              page={page}
              pageSize={filters.pageSize}
              total={total}
              busy={query.isFetching}
              onPageChange={(nextPage) =>
                setFilters((current) => ({ ...current, page: nextPage }))
              }
              onPageSizeChange={(pageSize) => change({ pageSize })}
            />
            {query.isPlaceholderData ? (
              <p role="status">Cargando historial…</p>
            ) : rows.length ? (
              <ol className="admin-history">
                {rows.map((event) => (
                  <li key={event.id}>
                    <div>
                      <h2>{historyDescription(event)}</h2>
                      <p>
                        {event.actor} ·{' '}
                        {entityLabels[event.entity] ?? event.entity} ·{' '}
                        <time dateTime={event.date}>
                          {new Date(event.date).toLocaleString('es-MX')}
                        </time>
                      </p>
                    </div>
                    <details>
                      <summary>Ver cambios</summary>
                      <p>
                        Acción:{' '}
                        {actionLabels[event.action] ??
                          event.action.replaceAll('_', ' ')}
                      </p>
                      <dl>
                        {historyChanges(event).map((change) => (
                          <div key={change.key}>
                            <dt>{change.label}</dt>
                            <dd>
                              {change.before} → {change.after}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      {historyChanges(event).length === 0 && (
                        <p>La descripción resume la acción realizada.</p>
                      )}
                    </details>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                title="Sin movimientos"
                description="Las acciones realizadas aparecerán aquí. Si ya realizaste cambios, revisa los filtros."
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}
