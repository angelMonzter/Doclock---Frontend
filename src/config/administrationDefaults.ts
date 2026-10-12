import { adminModules } from './administration';
import type { AdminRecord, ModuleId } from '@/types/administration';

//code mode control: valores de formularios independientes de cualquier transporte dummy.
export function defaultValues(module: ModuleId): AdminRecord['values'] {
  return Object.fromEntries(
    adminModules[module].fields.map((field) => [
      field.key,
      field.defaultValue ?? (field.type === 'checkbox' ? false : ''),
    ]),
  );
}
