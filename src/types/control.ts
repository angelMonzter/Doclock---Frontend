import type { AdminRecord } from './administration';
import type { PageRequest, PageResult } from './pagination';

//code mode control: contratos de los módulos conectados y de la bitácora real.
export type ControlModule =
  'categories' | 'roles' | 'appearance' | 'fileSettings';

export interface ControlService {
  page(
    module: ControlModule,
    request: PageRequest,
    signal?: AbortSignal,
  ): Promise<PageResult<AdminRecord>>;
  list(module: ControlModule, signal?: AbortSignal): Promise<AdminRecord[]>;
  save(
    module: ControlModule,
    values: AdminRecord['values'],
    id?: string,
  ): Promise<void>;
}

export type HistoryEvent = {
  id: string;
  actor: string;
  entity: string;
  action: string;
  recordId: string | null;
  description: string;
  date: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export interface HistoryService {
  list(signal?: AbortSignal): Promise<HistoryEvent[]>;
  page(
    filters: HistoryFilters,
    signal?: AbortSignal,
  ): Promise<HistoryPageResult>;
}

export type HistoryFilters = {
  page: number;
  pageSize: number;
  search: string;
  entity: string;
  action: string;
  from: string;
  to: string;
};

export type HistoryPageResult = {
  items: HistoryEvent[];
  total: number;
  limit: number;
  offset: number;
  entities: string[];
  actions: string[];
};
