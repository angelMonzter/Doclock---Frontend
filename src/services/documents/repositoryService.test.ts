// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { repositoryService } from './repositoryService';
import { createMockDocumentService } from './mockDocumentService';
import { validateFile } from '@/models/documents';
import { setToken } from '@/services/auth/session';

const permissions = {
  puede_ver_archivos: true,
  puede_subir_archivos: true,
  puede_gestionar_carpetas: true,
};
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
let capacity: number | null;
let fail: boolean;
let folders: {
  id_carpeta: string;
  nombre: string;
  sid_carpeta_padre: string | null;
}[];
let paths: string[];

beforeEach(() => {
  setToken('repository-test');
  capacity = 1000;
  fail = false;
  paths = [];
  folders = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get('Authorization')).toBe(
        'Bearer repository-test',
      );
      const url = new URL(input, 'http://localhost');
      const path = url.pathname.replace('/api', '');
      paths.push(path);
      if (fail) return reply({ msg: 'Servicio no disponible' }, 503);
      if (path === '/configuracion/archivos/uso')
        return reply({
          bytes_utilizados: '900',
          almacenamiento_maximo_bytes: capacity,
          tamano_maximo_efectivo_bytes: 200,
          archivos_maximos_efectivos: 2,
        });
      if (path === '/carpetas' && init?.method === 'POST') {
        const body = JSON.parse(String(init.body));
        expect(body).toEqual({ nombre: 'Contratos', sid_carpeta_padre: null });
        folders.push({ id_carpeta: 'CARPETA001', ...body });
        return reply({ id_carpeta: 'CARPETA001' }, 201);
      }
      if (path === '/carpetas') return reply(folders);
      if (path === '/categorias') {
        const offset = Number(url.searchParams.get('offset'));
        return reply(
          offset === 0
            ? Array.from({ length: 100 }, (_, i) => ({
                id_categoria: String(i),
                nombre: `Categoría ${i}`,
                activo: 1,
              }))
            : [
                { id_categoria: 'inactive', nombre: 'Inactiva', activo: 0 },
                { id_categoria: 'last', nombre: 'Última', activo: 1 },
              ],
        );
      }
      if (path === '/tipos-archivo')
        return reply([
          { extensiones: '["pdf"]', activo: 1 },
          { extensiones: ['jpg'], activo: 0 },
        ]);
      if (path === '/archivos') return reply([]);
      if (path === '/archivos/resumen')
        return reply({
          total: 0,
          categories: 0,
          today: 0,
          folders: [],
          extensions: [],
        });
      throw new Error('Ruta inesperada: ' + path);
    }),
  );
});

afterEach(() => {
  setToken(null);
  vi.unstubAllGlobals();
});

it('lee todas las categorías activas y usa la cuota real aunque el listado esté vacío', async () => {
  const data = await repositoryService.getSnapshot(permissions);
  expect(data.categories).toHaveLength(101);
  expect(data.categories.at(-1)?.id).toBe('last');
  expect(data.storageBytes).toBe(900);
  expect(data.documents).toEqual([]);
  expect(data.policy).toEqual({
    extensions: ['pdf'],
    maxBytes: 200,
    maxFiles: 2,
    capacityBytes: 1000,
  });
  expect(validateFile({ name: 'a.pdf', size: 201 }, data.policy)).toContain(
    'Supera',
  );
  expect(validateFile({ name: 'a.jpg', size: 100 }, data.policy)).toBe(
    'Formato no permitido.',
  );
});

it('guarda la carpeta y vuelve a consultarla desde la API', async () => {
  expect(await repositoryService.createFolder(' Contratos ', null)).toEqual({
    id: 'CARPETA001',
    name: 'Contratos',
    parentId: null,
  });
  expect(
    (await repositoryService.getSnapshot(permissions)).folders[0].name,
  ).toBe('Contratos');
});

it('conserva capacidad sin límite y no consulta catálogos ni documentos sin permiso', async () => {
  capacity = null;
  const data = await repositoryService.getSnapshot({});
  expect(data.policy.capacityBytes).toBeNull();
  expect(paths).toEqual(['/configuracion/archivos/uso']);
});

it('propaga errores sin sustituir la información por datos de demo', async () => {
  fail = true;
  await expect(repositoryService.getSnapshot(permissions)).rejects.toThrow(
    'Servicio no disponible',
  );
});

it('la simulación aplica la capacidad real sin mutar el repositorio ni escribir en HTTP', async () => {
  const data = await repositoryService.getSnapshot(permissions);
  const count = paths.length;
  const simulation = createMockDocumentService(
    data,
    data.policy,
    data.storageBytes,
  );
  await expect(
    simulation.upload({
      files: [{ name: 'a.pdf', title: 'Prueba', size: 150 }],
      folderId: null,
      categoryId: 'last',
      description: '',
      author: 'Usuario',
    }),
  ).rejects.toThrow('No hay capacidad');
  expect(data.documents).toEqual([]);
  expect(paths).toHaveLength(count);
});
