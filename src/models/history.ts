import { adminModules } from '@/config/administration';
import type { HistoryEvent } from '@/types/control';

//code mode control: nombres SQL y eventos con datos parciales o nulos.
export const entityLabels: Record<string, string> = {
  usuarios: 'Usuarios',
  roles: 'Roles y permisos',
  categorias: 'Categorías',
  archivos: 'Archivos',
  carpetas: 'Carpetas',
  archivos_versiones: 'Versiones de archivos',
  configuracion_apariencia: 'Apariencia',
  configuracion_archivos: 'Configuración de archivos',
  tipos_archivo: 'Tipos de archivo',
  mensajes: 'Mensajes',
};
const labels = Object.fromEntries(
  Object.values(adminModules).flatMap((module) =>
    module.fields.map((field) => [field.key, field.label]),
  ),
);
function display(value: unknown) {
  if (value == null || value === '') return 'Vacío';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
export function historyChanges(event: HistoryEvent) {
  //code mode control: un PATCH omite campos sin eliminarlos; nunca mostramos secretos.
  return Object.keys(event.after ?? event.before ?? {})
    .filter((key) => !/password|contrasena|contraseña|token|secret/i.test(key))
    .filter(
      (key) =>
        !event.before ||
        !event.after ||
        JSON.stringify(event.before[key]) !== JSON.stringify(event.after[key]),
    )
    .map((key) => ({
      key,
      label: labels[key] ?? key,
      before: event.before ? display(event.before[key]) : 'Sin registro',
      after: event.after ? display(event.after[key]) : 'Sin registro',
    }));
}
