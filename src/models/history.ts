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
  tipos_archivo_permitidos: 'Tipos de archivo',
  mensajes_sistema: 'Mensajes',
  mensajes: 'Mensajes',
};
export const actionLabels: Record<string, string> = {
  crear: 'Creación',
  actualizar: 'Modificación',
  subir: 'Carga de archivo',
  eliminar: 'Envío a papelera',
  restaurar: 'Recuperación de papelera',
  reemplazar: 'Nueva versión',
  restaurar_version: 'Recuperación de versión',
  solicitar_descarga: 'Solicitud de descarga',
  iniciar_sesion: 'Inicio de sesión',
  eliminar_definitivamente: 'Eliminación de papelera',
  liberar_espacio: 'Limpieza completada',
};

export function historyDescription(event: HistoryEvent) {
  const actor = event.actor || 'El sistema';
  if (event.description.startsWith(actor + ' ')) return event.description;
  const name =
    event.after?.titulo ??
    event.before?.titulo ??
    event.after?.nombre ??
    event.before?.nombre;
  const entities: Record<string, string> = {
    archivos: 'el archivo',
    carpetas: 'la carpeta',
    usuarios: 'el usuario',
    roles: 'el rol',
    categorias: 'la categoría',
    configuracion_archivos: 'la configuración de archivos',
    configuracion_apariencia: 'la apariencia',
  };
  if (!entities[event.entity]) return `${actor}: ${event.description}`;
  const target = entities[event.entity] + (name ? ` «${name}»` : '');
  const descriptions: Record<string, string> = {
    crear: `creó ${target}`,
    actualizar: `actualizó ${target}`,
    subir: `subió ${target}`,
    eliminar: `envió ${target} a la papelera`,
    restaurar: `recuperó ${target} de la papelera`,
    reemplazar: `subió una nueva versión de ${target}`,
    restaurar_version: `restauró una versión anterior de ${target}`,
    solicitar_descarga: `solicitó descargar ${target}`,
    iniciar_sesion: 'inició sesión',
  };
  return descriptions[event.action]
    ? `${actor} ${descriptions[event.action]}.`
    : `${actor}: ${event.description}`;
}
const labels = Object.fromEntries(
  Object.values(adminModules).flatMap((module) =>
    module.fields.map((field) => [field.key, field.label]),
  ),
);
Object.assign(labels, {
  titulo: 'Nombre del archivo',
  nombre_original: 'Nombre original',
  extension: 'Formato',
  tipo_mime: 'Tipo de archivo',
  tamano_bytes: 'Tamaño en bytes',
  comentario: 'Comentario',
  fecha_eliminacion: 'Fecha de envío a papelera',
  en_purga: 'Eliminación definitiva solicitada',
});
function display(value: unknown, key: string) {
  if (value == null || value === '') return 'Vacío';
  if (
    key.startsWith('puede_') ||
    key.startsWith('permitir_') ||
    key === 'activo' ||
    key === 'en_purga'
  )
    return value ? 'Sí' : 'No';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
export function historyChanges(event: HistoryEvent) {
  //code mode control: un PATCH omite campos sin eliminarlos; nunca mostramos secretos.
  return Object.keys(event.after ?? event.before ?? {})
    .filter((key) => !/password|contrasena|contraseña|token|secret/i.test(key))
    .filter((key) => Boolean(labels[key]) && !/^(id_|sid_)|s3/.test(key))
    .filter(
      (key) =>
        !event.before ||
        !event.after ||
        JSON.stringify(event.before[key]) !== JSON.stringify(event.after[key]),
    )
    .map((key) => ({
      key,
      label: labels[key] ?? key,
      before: event.before ? display(event.before[key], key) : 'Sin registro',
      after: event.after ? display(event.after[key], key) : 'Sin registro',
    }));
}
