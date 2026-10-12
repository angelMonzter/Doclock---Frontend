import type { AdminRecord } from './administration';
import type { PageRequest, PageResult } from './pagination';

//code mode usuarios: contrato específico; los demás catálogos mantienen su transporte.
export type UsersSnapshot = {
  records: { users: AdminRecord[]; roles: AdminRecord[] };
};
export interface UsersService {
  page(
    request: PageRequest,
    signal?: AbortSignal,
  ): Promise<UsersSnapshot & Omit<PageResult<AdminRecord>, 'items'>>;
  getSnapshot(signal?: AbortSignal): Promise<UsersSnapshot>;
  save(values: AdminRecord['values'], original?: AdminRecord): Promise<void>;
  deactivate(id: string): Promise<void>;
}
