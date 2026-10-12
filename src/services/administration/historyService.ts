import { readAllPages } from '@/services/pagination';
import { apiRequest } from '@/services/api';
import type {
  HistoryEvent,
  HistoryPageResult,
  HistoryService,
} from '@/types/control';

//code mode control: admite JSON nativo de MySQL y texto JSON de MariaDB.
type ApiEvent = {
  id_historial: string;
  usuario: string;
  entidad: string;
  accion: string;
  sid_entidad: string | null;
  descripcion: string;
  fecha_evento: string;
  datos_anteriores: unknown;
  datos_nuevos: unknown;
};

function object(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed
    : null;
}

function mapEvents(rows: ApiEvent[]): HistoryEvent[] {
  return [
    ...new Map(
      rows.map(
        (row) =>
          [
            row.id_historial,
            {
              id: row.id_historial,
              actor: row.usuario,
              entity: row.entidad,
              action: row.accion,
              recordId: row.sid_entidad,
              description: row.descripcion,
              //code mode control: el backend trabaja en UTC; evita interpretar DATETIME como hora local.
              date: /(?:Z|[+-]\d{2}:\d{2})$/.test(row.fecha_evento)
                ? row.fecha_evento
                : row.fecha_evento.replace(' ', 'T') + 'Z',
              before: object(row.datos_anteriores),
              after: object(row.datos_nuevos),
            },
          ] as const,
      ),
    ).values(),
  ];
}

export const historyService: HistoryService = {
  async list(signal) {
    return mapEvents(await readAllPages<ApiEvent>('/historial', signal));
  },
  async page(filters, signal) {
    const params = new URLSearchParams({
      paginated: '1',
      limit: String(filters.pageSize),
      offset: String((filters.page - 1) * filters.pageSize),
    });
    if (filters.search.trim()) params.set('search', filters.search.trim());
    if (filters.entity !== 'all') params.set('entidad', filters.entity);
    if (filters.action !== 'all') params.set('accion', filters.action);
    // Límites del día local convertidos a UTC; el extremo final es exclusivo.
    if (filters.from)
      params.set('from', new Date(filters.from + 'T00:00:00').toISOString());
    if (filters.to) {
      const end = new Date(filters.to + 'T00:00:00');
      end.setDate(end.getDate() + 1);
      params.set('to', end.toISOString());
    }
    const result = await apiRequest<
      Omit<HistoryPageResult, 'items'> & { items: ApiEvent[] }
    >('/historial?' + params, { signal });
    return { ...result, items: mapEvents(result.items) };
  },
};
