import type { AdminField, ModuleDefinition, ModuleId } from '@/types/administration';

const name: AdminField = { key: 'nombre', label: 'Nombre', type: 'text', required: true, maxLength: 150 };
const description: AdminField = { key: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 500 };
const active: AdminField = { key: 'activo', label: 'Activo', type: 'checkbox', defaultValue: true };
export const permissionLabels = {
  puede_ver_archivos: 'Ver archivos', puede_subir_archivos: 'Subir archivos', puede_editar_archivos: 'Editar archivos',
  puede_eliminar_archivos: 'Eliminar archivos', puede_gestionar_carpetas: 'Gestionar carpetas',
  puede_gestionar_categorias: 'Gestionar categorías', puede_gestionar_usuarios: 'Gestionar usuarios',
  puede_ver_historial: 'Ver historial', puede_gestionar_configuracion: 'Gestionar configuración',
};
export const adminModules: Record<ModuleId, ModuleDefinition> = {
  categories: { title: 'Categorías', singular: 'categoría', path: '/categorias', description: 'Organiza la clasificación de los documentos.', unique: 'nombre', columns: ['nombre', 'descripcion', 'activo'], fields: [name, description, { key: 'color', label: 'Color', type: 'color', defaultValue: '#194e3e' }, active] },
  users: { title: 'Usuarios', singular: 'usuario', path: '/usuarios', description: 'Administra las cuentas y el rol de cada persona.', unique: 'correo', columns: ['nombre', 'correo', 'sid_rol', 'activo'], fields: [name, { key: 'correo', label: 'Correo electrónico', type: 'email', required: true, maxLength: 255 }, { key: 'sid_rol', label: 'Rol', type: 'select', required: true }, active] },
  roles: { title: 'Roles y permisos', singular: 'rol', path: '/roles', description: 'Define qué operaciones corresponden a cada rol.', unique: 'nombre', columns: ['nombre', 'descripcion', 'activo'], fields: [{ ...name, maxLength: 50 }, { ...description, maxLength: 255 }, ...Object.entries(permissionLabels).map(([key, label]): AdminField => ({ key, label, type: 'checkbox', defaultValue: false })), active] },
  appearance: { title: 'Apariencia', singular: 'configuración', path: '/apariencia', description: 'Prepara la identidad de la empresa y revisa una vista previa local.', singleton: true, columns: ['nombre_empresa', 'tema'], fields: [
    { key: 'nombre_empresa', label: 'Nombre de la empresa', type: 'text', required: true, maxLength: 150, defaultValue: 'Mi empresa' },
    { key: 'tema', label: 'Tema', type: 'select', options: ['claro', 'oscuro', 'sistema'], defaultValue: 'claro', required: true },
    { key: 'imagen_empresa_s3', label: 'Ruta del logotipo en S3', type: 'text', maxLength: 1024, hint: 'Referencia de almacenamiento; esta demo no sube ni descarga imágenes.' },
    { key: 'color_menu', label: 'Fondo del menú', type: 'color', defaultValue: '#1D4ED8', required: true },
    { key: 'color_menu_texto', label: 'Texto del menú', type: 'color', defaultValue: '#FFFFFF', required: true },
    { key: 'color_menu_activo', label: 'Opción activa', type: 'color', defaultValue: '#1E40AF', required: true },
  ] },
  fileSettings: { title: 'Configuración de archivos', singular: 'configuración', path: '/configuracion-archivos', description: 'Define límites y políticas de almacenamiento para la integración futura.', singleton: true, columns: [], fields: [
    { key: 'tamano_maximo_bytes', label: 'Tamaño máximo por archivo (bytes)', type: 'number', min: 1, max: Number.MAX_SAFE_INTEGER, required: true, defaultValue: 10485760, hint: '10 MiB = 10 485 760 bytes.' },
    { key: 'archivos_maximos_por_carga', label: 'Archivos por carga', type: 'number', min: 1, max: 65535, required: true, defaultValue: 10 },
    { key: 'almacenamiento_maximo_bytes', label: 'Almacenamiento máximo (bytes)', type: 'number', min: 1, max: Number.MAX_SAFE_INTEGER, hint: 'Vacío significa sin límite configurado.' },
    { key: 'dias_papelera', label: 'Días en papelera', type: 'number', min: 0, max: 65535, required: true, defaultValue: 30 },
    { key: 'permitir_descargas', label: 'Permitir descargas', type: 'checkbox', defaultValue: true },
    { key: 'permitir_reemplazar_archivos', label: 'Permitir reemplazo de archivos', type: 'checkbox', defaultValue: false },
  ] },
  fileTypes: { title: 'Tipos de archivo', singular: 'tipo de archivo', path: '/tipos-archivo', description: 'Mantén el catálogo de formatos MIME permitidos.', unique: 'tipo_mime', columns: ['tipo_mime', 'descripcion', 'activo'], fields: [
    { key: 'tipo_mime', label: 'Tipo MIME', type: 'text', required: true, maxLength: 150, hint: 'Por ejemplo: application/pdf.' }, { ...description, maxLength: 150 }, active,
  ] },
  messages: { title: 'Mensajes del sistema', singular: 'mensaje', path: '/mensajes', description: 'Prepara los textos y acciones de los avisos de la aplicación.', unique: 'codigo', columns: ['titulo', 'codigo', 'contexto', 'tipo', 'activo'], fields: [
    { key: 'codigo', label: 'Código único', type: 'text', required: true, maxLength: 100 },
    { key: 'contexto', label: 'Contexto', type: 'text', required: true, maxLength: 50 },
    { key: 'titulo', label: 'Título', type: 'text', required: true, maxLength: 150 },
    { key: 'contenido', label: 'Contenido', type: 'textarea', required: true, maxLength: 16000 },
    { key: 'tipo', label: 'Tipo', type: 'select', options: ['informacion', 'exito', 'advertencia', 'error', 'confirmacion'], defaultValue: 'informacion', required: true },
    { key: 'texto_boton_principal', label: 'Botón principal', type: 'text', required: true, maxLength: 80, defaultValue: 'Aceptar' },
    { key: 'texto_boton_secundario', label: 'Botón secundario', type: 'text', maxLength: 80 },
    { key: 'permite_cerrar', label: 'Permitir cerrar', type: 'checkbox', defaultValue: true }, active,
  ] },
};
