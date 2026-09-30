export type ModuleId = 'categories' | 'users' | 'roles' | 'appearance' | 'fileSettings' | 'fileTypes' | 'messages';
export type FieldValue = string | number | boolean;
export type AdminRecord = { id: string; values: Record<string, FieldValue>; createdAt: string; updatedAt: string };
export type AuditEvent = { id: string; actor: string; action: string; entity: ModuleId; recordId: string; description: string; before: AdminRecord | null; after: AdminRecord; date: string };
export type AdministrationSnapshot = { records: Record<ModuleId, AdminRecord[]>; history: AuditEvent[] };
export interface AdministrationService {
  getSnapshot(): Promise<AdministrationSnapshot>;
  save(module: ModuleId, values: AdminRecord['values'], actor: string, id?: string): Promise<AdminRecord>;
  reset(): void;
}
export type AdminField = {
  key: string; label: string; type: 'text' | 'email' | 'textarea' | 'color' | 'number' | 'checkbox' | 'select';
  required?: boolean; maxLength?: number; min?: number; max?: number; options?: readonly string[]; defaultValue?: FieldValue; hint?: string;
};
export type ModuleDefinition = { title: string; singular: string; description: string; path: string; singleton?: boolean; unique?: string; columns: string[]; fields: AdminField[] };
