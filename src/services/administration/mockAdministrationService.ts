import { adminModules, permissionLabels } from '@/config/administration';
import { createSeed } from '@/services/documents/seed';
import type { AdminRecord, AdministrationService, AdministrationSnapshot, ModuleId } from '@/types/administration';

export function defaultValues(module: ModuleId): AdminRecord['values'] {
  return Object.fromEntries(adminModules[module].fields.map(field => [field.key, field.defaultValue ?? (field.type === 'checkbox' ? false : '')]));
}
function seed(): AdministrationSnapshot {
  const date = new Date().toISOString();
  const row = (module: ModuleId, id: string, values: AdminRecord['values']): AdminRecord => ({ id, values: { ...defaultValues(module), ...values }, createdAt: date, updatedAt: date });
  return { history: [], records: {
    categories: createSeed().categories.map(category => row('categories', category.id, { nombre: category.name })),
    users: [row('users', 'USERDEMO01', { nombre: 'Mariana Vega', correo: 'mariana@example.com', sid_rol: 'ROLADMIN01' })],
    roles: ['administrador', 'editor', 'lector'].map((nombre, index) => row('roles', ['ROLADMIN01', 'ROLEDITOR1', 'ROLLECTOR1'][index], { nombre, descripcion: ['Acceso completo', 'Administra archivos, carpetas y categorías', 'Consulta archivos'][index], ...Object.fromEntries(Object.keys(permissionLabels).map((key, i) => [key, index === 0 || (index === 1 && i < 6) || (index === 2 && i === 0)])) })),
    appearance: [row('appearance', 'GLOBAL0001', {})], fileSettings: [row('fileSettings', 'GLOBAL0001', {})],
    fileTypes: [ ['application/pdf', 'PDF'], ['image/jpeg', 'Imagen JPEG'], ['image/png', 'Imagen PNG'], ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Word DOCX'], ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel XLSX'] ].map(([tipo_mime, descripcion], index) => row('fileTypes', `TIPODEMO0${index}`, { tipo_mime, descripcion })),
    messages: [],
  } };
}
export function createMockAdministrationService(): AdministrationService {
  let data = seed();
  return {
    async getSnapshot() { return structuredClone(data); },
    async save(module, input, actor, id) {
      const definition = adminModules[module];
      const values = { ...defaultValues(module), ...input };
      for (const field of definition.fields) {
        let value = values[field.key];
        if (typeof value === 'string') value = value.trim();
        if (field.required && value === '') throw new Error(`${field.label}: completa este campo.`);
        if (field.type === 'checkbox' && typeof value !== 'boolean') throw new Error(`${field.label}: valor inválido.`);
        if (field.type === 'number' && value !== '') {
          value = Number(value);
          if (!Number.isSafeInteger(value) || value < (field.min ?? 0) || value > (field.max ?? Number.MAX_SAFE_INTEGER)) throw new Error(`${field.label}: escribe un entero entre ${field.min ?? 0} y ${field.max ?? Number.MAX_SAFE_INTEGER}.`);
        }
        if (field.maxLength && String(value).length > field.maxLength) throw new Error(`${field.label}: máximo ${field.maxLength} caracteres.`);
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) throw new Error('Escribe un correo válido.');
        if (field.type === 'color' && value !== '' && !/^#[0-9a-f]{6}$/i.test(String(value))) throw new Error(`${field.label}: usa un color hexadecimal válido.`);
        if (field.options && !field.options.includes(String(value))) throw new Error(`${field.label}: selecciona una opción válida.`);
        values[field.key] = value;
      }
      if (module === 'fileTypes' && !/^[\w.+-]+\/[\w.+-]+$/.test(String(values.tipo_mime))) throw new Error('Escribe un MIME válido, por ejemplo application/pdf.');
      const records = data.records[module];
      const before = records.find(row => row.id === id);
      if (id && !before) throw new Error('El registro ya no existe. Recarga la página.');
      if (definition.singleton && !before) throw new Error('Edita la configuración existente.');
      if (definition.unique && records.some(row => row.id !== id && String(row.values[definition.unique!]).toLocaleLowerCase('es') === String(values[definition.unique!]).toLocaleLowerCase('es'))) throw new Error('Ya existe un registro con ese nombre, correo o código.');
      if (module === 'users' && !data.records.roles.some(role => role.id === values.sid_rol && (role.values.activo || (!values.activo && before?.values.sid_rol === role.id)))) throw new Error('Selecciona un rol activo.');
      if (module === 'roles' && !values.activo && data.records.users.some(user => user.values.sid_rol === id && user.values.activo)) throw new Error('Reasigna o desactiva los usuarios activos antes de desactivar su rol.');
      if (module === 'fileSettings' && values.almacenamiento_maximo_bytes !== '' && Number(values.almacenamiento_maximo_bytes) < Number(values.tamano_maximo_bytes)) throw new Error('La capacidad total debe ser al menos igual al tamaño máximo de un archivo.');
      const date = new Date().toISOString();
      const record: AdminRecord = { id: id ?? crypto.randomUUID().replaceAll('-', '').slice(0, 10), values, createdAt: before?.createdAt ?? date, updatedAt: date };
      if (before) records[records.indexOf(before)] = record; else records.push(record);
      data.history.unshift({ id: crypto.randomUUID(), actor, action: before ? 'actualizar' : 'crear', entity: module, recordId: record.id, description: `${before ? 'Actualización' : 'Creación'} de ${definition.singular}: ${values.nombre ?? values.titulo ?? values.tipo_mime ?? values.nombre_empresa ?? record.id}`, before: before ? structuredClone(before) : null, after: structuredClone(record), date });
      return structuredClone(record);
    },
    reset() { data = seed(); },
  };
}
export const administrationService = createMockAdministrationService();

