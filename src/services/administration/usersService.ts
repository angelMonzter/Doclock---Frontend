import { apiRequest } from '@/services/api';
import type { AdminRecord } from '@/types/administration';
import type { UsersService } from '@/types/users';
import { readPage } from '@/services/pagination';

//code mode usuarios: consulta roles únicamente como opciones del formulario de usuarios.
type ApiRecord = {
  id_usuario?: string;
  id_rol?: string;
  nombre: string;
  correo?: string;
  sid_rol?: string;
  activo: number | boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

function toRecord(row: ApiRecord): AdminRecord {
  return {
    id: (row.id_usuario ?? row.id_rol)!,
    values: {
      nombre: row.nombre,
      ...(row.correo !== undefined ? { correo: row.correo } : {}),
      ...(row.sid_rol !== undefined ? { sid_rol: row.sid_rol } : {}),
      activo: row.activo === 1 || row.activo === true,
    },
    createdAt: row.fecha_creacion,
    updatedAt: row.fecha_actualizacion,
  };
}

async function allRecords(path: string, signal?: AbortSignal) {
  const rows: ApiRecord[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await apiRequest<ApiRecord[]>(
      `${path}?limit=100&offset=${offset}`,
      { signal },
    );
    rows.push(...page);
    if (page.length < 100) return rows.map(toRecord);
  }
}

export const usersService: UsersService = {
  async page(request, signal) {
    const [result, roles] = await Promise.all([
      readPage<ApiRecord>('/usuarios', request, signal),
      allRecords('/roles', signal),
    ]);
    return {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      records: { users: result.items.map(toRecord), roles },
    };
  },
  async getSnapshot(signal) {
    const [users, roles] = await Promise.all([
      allRecords('/usuarios', signal),
      allRecords('/roles', signal),
    ]);
    return { records: { users, roles } };
  },
  async save(values, original) {
    const password = String(values.password ?? '');
    if (
      (!original || password) &&
      (password.length < 8 || new TextEncoder().encode(password).length > 72)
    ) {
      throw new Error(
        'La contraseña debe tener al menos 8 caracteres y hasta 72 bytes.',
      );
    }
    const data = {
      nombre: String(values.nombre).trim(),
      correo: String(values.correo).trim(),
      //code mode usuarios: no reasigna un rol inactivo cuando solo se editan otros datos.
      ...(!original || values.sid_rol !== original.values.sid_rol
        ? { sid_rol: values.sid_rol }
        : {}),
      activo: values.activo ? 1 : 0,
      ...(!original || password ? { password } : {}),
    };
    await apiRequest(
      original ? `/usuarios/${encodeURIComponent(original.id)}` : '/usuarios',
      {
        method: original ? 'PATCH' : 'POST',
        body: JSON.stringify(data),
      },
    );
  },
  async deactivate(id) {
    await apiRequest(`/usuarios/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
