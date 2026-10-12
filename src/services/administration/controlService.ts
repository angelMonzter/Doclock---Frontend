import { adminModules } from '@/config/administration';
import { apiRequest, ApiError } from '@/services/api';
import { readAllPages, readPage } from '@/services/pagination';
import type { AdminRecord, FieldValue } from '@/types/administration';
import type { ControlModule, ControlService } from '@/types/control';

//code mode control: solo estos módulos usan sus endpoints reales; no hay fallback a datos dummy.
const endpoints: Record<ControlModule, string> = {
  categories: '/categorias',
  roles: '/roles',
  appearance: '/configuracion/apariencia',
  fileSettings: '/configuracion/archivos',
};
const identifiers: Record<ControlModule, string> = {
  categories: 'id_categoria',
  roles: 'id_rol',
  appearance: 'id_configuracion',
  fileSettings: 'id_configuracion',
};
type ApiRow = Record<string, string | number | boolean | null>;

function fromApi(module: ControlModule, row: ApiRow): AdminRecord {
  const values: Record<string, FieldValue> = {};
  for (const field of adminModules[module].fields) {
    const value = row[field.key];
    values[field.key] =
      field.type === 'checkbox'
        ? value === true || value === 1 || value === '1'
        : value == null
          ? ''
          : value;
  }
  return {
    id: String(row[identifiers[module]]),
    values,
    createdAt: String(row.fecha_creacion),
    updatedAt: String(row.fecha_actualizacion),
  };
}

export function controlPayload(
  module: ControlModule,
  values: AdminRecord['values'],
) {
  const data: Record<string, FieldValue | null> = {};
  for (const field of adminModules[module].fields) {
    const value =
      typeof values[field.key] === 'string'
        ? String(values[field.key]).trim()
        : values[field.key];
    if (field.type === 'checkbox') {
      if (typeof value !== 'boolean')
        throw new Error(field.label + ': valor inválido.');
      data[field.key] = value ? 1 : 0;
    } else if (value === '' || value === undefined) {
      if (field.required)
        throw new Error(field.label + ': completa este campo.');
      data[field.key] = null;
    } else if (field.type === 'number') {
      const number = Number(value);
      if (
        !Number.isSafeInteger(number) ||
        number < (field.min ?? 0) ||
        number > (field.max ?? Number.MAX_SAFE_INTEGER)
      ) {
        throw new Error(
          field.label + ': escribe un entero dentro del rango permitido.',
        );
      }
      data[field.key] = number;
    } else {
      data[field.key] = value;
    }
  }
  if (
    module === 'fileSettings' &&
    data.almacenamiento_maximo_bytes !== null &&
    Number(data.almacenamiento_maximo_bytes) < Number(data.tamano_maximo_bytes)
  ) {
    throw new Error(
      'La capacidad total debe ser al menos igual al tamaño máximo de un archivo.',
    );
  }
  return data;
}

export const controlService: ControlService = {
  async page(module, request, signal) {
    if (adminModules[module].singleton) {
      const items = await controlService.list(module, signal);
      return { items, total: items.length, offset: 0, limit: request.pageSize };
    }
    const result = await readPage<ApiRow>(endpoints[module], request, signal);
    return {
      ...result,
      items: result.items.map((row) => fromApi(module, row)),
    };
  },
  async list(module, signal) {
    if (adminModules[module].singleton) {
      try {
        const row = await apiRequest<ApiRow>(endpoints[module], { signal });
        return [fromApi(module, row)];
      } catch (error) {
        //code mode control: una configuración aún no creada se presenta vacía, nunca como datos guardados ficticios.
        if (
          error instanceof ApiError &&
          error.status === 404 &&
          error.message === 'La configuración global aún no existe'
        )
          return [];
        throw error;
      }
    }
    const rows = await readAllPages<ApiRow>(endpoints[module], signal);
    return [
      ...new Map(
        rows.map((row) => {
          const record = fromApi(module, row);
          return [record.id, record] as const;
        }),
      ).values(),
    ];
  },
  async save(module, values, id) {
    const singleton = adminModules[module].singleton;
    const path =
      endpoints[module] +
      (!singleton && id ? '/' + encodeURIComponent(id) : '');
    await apiRequest(path, {
      method: singleton ? 'PUT' : id ? 'PATCH' : 'POST',
      body: JSON.stringify(controlPayload(module, values)),
    });
  },
};
