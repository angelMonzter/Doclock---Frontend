// @vitest-environment jsdom
//code mode control: contratos HTTP y formularios con transporte simulado, sin tocar la BD.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/providers/AuthProvider';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { RolesPage } from '@/pages/RolesPage';
import { AppearancePage } from '@/pages/AppearancePage';
import { FileSettingsPage } from '@/pages/FileSettingsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { controlService, controlPayload } from './controlService';
import { historyService } from './historyService';
import { historyChanges } from '@/models/history';
import { defaultValues } from '@/config/administrationDefaults';
import { setToken } from '@/services/auth/session';
import type { ReactNode } from 'react';

const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
let records: Record<string, unknown>[];
let permission: number;
let failWrite: boolean;
let requests: { path: string; method: string; body: Record<string, unknown> }[];
const clients: QueryClient[] = [];
beforeEach(() => {
  records = [];
  permission = 1;
  failWrite = false;
  requests = [];
  setToken('control-test');
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 0),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input, 'http://localhost');
      const path = url.pathname.replace('/api', '');
      const method = init?.method ?? 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      requests.push({ path, method, body });
      expect(new Headers(init?.headers).get('Authorization')).toBe(
        'Bearer control-test',
      );
      if (path === '/auth/me')
        return reply({
          id_usuario: 'USER000001',
          nombre: 'Admin',
          correo: 'admin@example.com',
          sid_rol: 'ROLE000001',
          rol: 'Admin',
          puede_gestionar_categorias: permission,
          puede_gestionar_usuarios: permission,
          puede_ver_historial: permission,
          puede_gestionar_configuracion: permission,
        });
      if (method !== 'GET') {
        if (failWrite) return reply({ msg: 'Nombre duplicado' }, 409);
        records = [
          {
            ...body,
            id_categoria: 'CATEG00001',
            id_rol: 'ROLE000002',
            id_configuracion: 'CONFIG0001',
          },
        ];
        return reply({ msg: 'Guardado' });
      }
      if (path.startsWith('/configuracion/')) {
        return records.length
          ? reply(records[0])
          : reply({ msg: 'La configuración global aún no existe' }, 404);
      }
      const offset = Number(url.searchParams.get('offset') ?? 0);
      if (path === '/historial' && url.searchParams.get('paginated') === '1') {
        const limit = Number(url.searchParams.get('limit'));
        const filtered = records.filter(
          (row) =>
            (!url.searchParams.get('accion') ||
              row.accion === url.searchParams.get('accion')) &&
            (!url.searchParams.get('entidad') ||
              row.entidad === url.searchParams.get('entidad')) &&
            (!url.searchParams.get('search') ||
              String(row.descripcion).includes(
                url.searchParams.get('search')!,
              )),
        );
        return reply({
          items: filtered.slice(offset, offset + limit),
          total: filtered.length,
          offset,
          limit,
          entities: [...new Set(records.map((row) => row.entidad))],
          actions: [...new Set(records.map((row) => row.accion))],
        });
      }
      if (url.searchParams.get('paginated') === '1') {
        const limit = Number(url.searchParams.get('limit'));
        const filtered = records.filter((row) => {
          const search = url.searchParams.get('search')?.toLowerCase() ?? '';
          const status = url.searchParams.get('status');
          return (
            `${row.nombre} ${row.descripcion}`.toLowerCase().includes(search) &&
            (status === 'all' ||
              Number(row.activo) === (status === 'active' ? 1 : 0))
          );
        });
        return reply({
          items: filtered.slice(offset, offset + limit),
          total: filtered.length,
          offset,
          limit,
        });
      }
      return reply(records.slice(offset, offset + 100));
    }),
  );
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  setToken(null);
  vi.unstubAllGlobals();
});
function mount(page: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>{page}</AuthProvider>
    </QueryClientProvider>,
  );
}

it('crea y edita categorías, recupera datos del servidor y devuelve el foco', async () => {
  const user = userEvent.setup();
  mount(<CategoriesPage />);
  const create = await screen.findByRole('button', { name: 'Crear categoría' });
  await waitFor(() => expect(create.hasAttribute('disabled')).toBe(false));
  await user.click(create);
  await user.type(screen.getByLabelText('Nombre *'), 'Legal real');
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await screen.findByText('Cambios guardados correctamente.');
  expect(
    requests.find((request) => request.method === 'POST')?.body,
  ).toMatchObject({ nombre: 'Legal real', activo: 1, descripcion: null });
  await user.click(screen.getByRole('button', { name: 'Editar Legal real' }));
  await user.click(screen.getByLabelText('Activo'));
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await screen.findByText('Inactivo');
  expect(requests.find((request) => request.method === 'PATCH')?.path).toBe(
    '/categorias/CATEG00001',
  );
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Editar Legal real' }),
    ),
  );
});

it('muestra error de API, conserva el formulario y permite reintentar', async () => {
  failWrite = true;
  const user = userEvent.setup();
  mount(<CategoriesPage />);
  const create = await screen.findByRole('button', { name: 'Crear categoría' });
  await waitFor(() => expect(create.hasAttribute('disabled')).toBe(false));
  await user.click(create);
  await user.type(screen.getByLabelText('Nombre *'), 'Duplicada');
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await screen.findByText('Nombre duplicado');
  expect((screen.getByLabelText('Nombre *') as HTMLInputElement).value).toBe(
    'Duplicada',
  );
  failWrite = false;
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await screen.findByText('Cambios guardados correctamente.');
});

it('guarda permisos y bloquea la edición del rol de la sesión', async () => {
  records = [
    { ...defaultValues('roles'), id_rol: 'ROLE000001', nombre: 'Rol actual' },
  ];
  const user = userEvent.setup();
  mount(<RolesPage />);
  expect(
    (
      await screen.findByRole('button', { name: 'Editar Rol actual' })
    ).hasAttribute('disabled'),
  ).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Crear rol' }));
  await user.type(screen.getByLabelText('Nombre *'), 'Consulta');
  await user.click(screen.getByLabelText('Ver archivos'));
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await screen.findByText('Cambios guardados correctamente.');
  expect(
    requests.find((request) => request.method === 'POST')?.body,
  ).toMatchObject({
    puede_ver_archivos: 1,
    puede_gestionar_usuarios: 0,
    activo: 1,
  });
});

it.each([
  ['appearance', <AppearancePage />, '/configuracion/apariencia'],
  ['fileSettings', <FileSettingsPage />, '/configuracion/archivos'],
] as const)(
  'inicializa y vuelve a leer %s desde la API',
  async (module, page, path) => {
    const user = userEvent.setup();
    mount(page);
    await user.click(
      await screen.findByRole('button', { name: 'Editar configuración' }),
    );
    if (module === 'appearance') {
      await user.clear(screen.getByLabelText('Nombre de la empresa *'));
      await user.type(
        screen.getByLabelText('Nombre de la empresa *'),
        'Empresa real',
      );
    }
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await screen.findByText('Cambios guardados correctamente.');
    expect(requests.find((request) => request.method === 'PUT')?.path).toBe(
      path,
    );
    expect(
      requests.filter(
        (request) => request.path === path && request.method === 'GET',
      ).length,
    ).toBeGreaterThan(1);
  },
);

it('no consulta catálogos ni historial cuando faltan permisos', async () => {
  permission = 0;
  const view = mount(<CategoriesPage />);
  await screen.findByText('No tienes permiso para consultar este módulo.');
  await waitFor(() =>
    expect(requests.some((request) => request.path === '/auth/me')).toBe(true),
  );
  expect(requests.some((request) => request.path === '/categorias')).toBe(
    false,
  );
  view.unmount();
  mount(<HistoryPage />);
  await screen.findByText('No tienes permiso para consultar el historial.');
  expect(requests.some((request) => request.path === '/historial')).toBe(false);
});

it('recorre más de una página sin perder registros y normaliza booleanos', async () => {
  records = Array.from({ length: 101 }, (_, index) => ({
    id_categoria: String(index),
    nombre: 'Cat ' + index,
    activo: index % 2 ? '1' : 0,
  }));
  const result = await controlService.list('categories');
  expect(result).toHaveLength(101);
  expect(result[0].values.activo).toBe(false);
  expect(result[1].values.activo).toBe(true);
});

it('convierte límites a enteros, conserva cero y envía null para capacidad vacía', () => {
  const values = {
    ...defaultValues('fileSettings'),
    dias_papelera: '0',
    almacenamiento_maximo_bytes: '',
  };
  expect(controlPayload('fileSettings', values)).toMatchObject({
    dias_papelera: 0,
    almacenamiento_maximo_bytes: null,
    permitir_descargas: 1,
  });
  expect(() =>
    controlPayload('fileSettings', {
      ...values,
      archivos_maximos_por_carga: 1.5,
    }),
  ).toThrow('entero');
  expect(() =>
    controlPayload('fileSettings', {
      ...values,
      almacenamiento_maximo_bytes: 1,
    }),
  ).toThrow('capacidad');
});

it('no sustituye errores del servidor por datos de demostración', async () => {
  vi.mocked(fetch).mockResolvedValue(
    reply({ msg: 'Error de almacenamiento' }, 500),
  );
  await expect(controlService.list('appearance')).rejects.toThrow(
    'Error de almacenamiento',
  );
});

it('muestra historial SQL con JSON parcial, entidades desconocidas y registros eliminados', async () => {
  records = [
    {
      id_historial: 'HISTORY001',
      usuario: 'Admin real',
      entidad: 'categorias',
      accion: 'actualizar',
      sid_entidad: 'CATEG00001',
      descripcion: 'Categoría modificada',
      fecha_evento: '2026-10-06 12:00:00',
      datos_anteriores: JSON.stringify({
        nombre: 'Anterior',
        activo: 1,
        password_hash: 'oculto',
      }),
      datos_nuevos: JSON.stringify({ nombre: 'Nuevo' }),
    },
    {
      id_historial: 'HISTORY002',
      usuario: 'Admin real',
      entidad: 'otra_entidad',
      accion: 'eliminar',
      sid_entidad: null,
      descripcion: 'Registro eliminado',
      fecha_evento: '2026-10-06T12:00:00Z',
      datos_anteriores: { nombre: 'Borrado' },
      datos_nuevos: null,
    },
  ];
  const events = await historyService.list();
  expect(historyChanges(events[0])).toEqual([
    { key: 'nombre', label: 'Nombre', before: 'Anterior', after: 'Nuevo' },
  ]);
  expect(events[0].actor).toBe('Admin real');
  expect(events[0].date).toBe('2026-10-06T12:00:00Z');
  mount(<HistoryPage />);
  await screen.findByText('Categoría modificada');
  expect(screen.getByText('Registro eliminado')).toBeTruthy();
  expect(screen.queryByText('oculto')).toBeNull();
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('Acción'), 'eliminar');
  await waitFor(() =>
    expect(screen.queryByText('Categoría modificada')).toBeNull(),
  );
});

it('consulta una página de historial y reinicia la página al filtrar', async () => {
  records = Array.from({ length: 26 }, (_, index) => ({
    id_historial: String(index).padStart(10, '0'),
    usuario: 'Admin',
    entidad: 'archivos',
    accion: 'subir',
    descripcion: `Movimiento ${index + 1}`,
    fecha_evento: '2026-10-11 12:00:00',
    sid_entidad: null,
    datos_anteriores: null,
    datos_nuevos: null,
  }));
  mount(<HistoryPage />);
  await screen.findByText('Movimiento 1');
  expect(screen.queryByText('Movimiento 26')).toBeNull();
  expect(
    requests.filter((request) => request.path === '/historial'),
  ).toHaveLength(1);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
  await screen.findByText('Movimiento 26');
  expect(screen.queryByText('Movimiento 1')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Siguiente' }).hasAttribute('disabled'),
  ).toBe(true);
  await user.type(
    screen.getByLabelText('Buscar por descripción o usuario'),
    'Movimiento 1',
  );
  await screen.findByText('Movimiento 1');
  await waitFor(() => expect(screen.getByText(/Página 1 de 1/)).toBeTruthy());
});

it('mantiene disabled durante la carga y permite cancelar con Escape por teclado', async () => {
  const original = vi.mocked(fetch).getMockImplementation()!;
  let release: ((response: Response) => void) | undefined;
  vi.mocked(fetch).mockImplementation((input, init) =>
    String(input).includes('/categorias')
      ? new Promise<Response>((resolve) => {
          release = resolve;
        })
      : original(input, init),
  );
  const user = userEvent.setup();
  mount(<CategoriesPage />);
  const create = await screen.findByRole('button', { name: 'Crear categoría' });
  expect(create.hasAttribute('disabled')).toBe(true);
  expect(screen.getByText('Cargando categorías…')).toBeTruthy();
  await waitFor(() => expect(release).toBeDefined());
  release!(reply({ items: [], total: 0, limit: 25, offset: 0 }));
  await waitFor(() => expect(create.hasAttribute('disabled')).toBe(false));
  create.focus();
  await user.keyboard('{Enter}');
  await screen.findByRole('heading', { name: 'Crear categoría' });
  await user.keyboard('{Escape}');
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Crear categoría' }),
    ),
  );
});

it('deshabilita edición de configuración sin permiso de administración', async () => {
  permission = 0;
  mount(<FileSettingsPage />);
  const edit = await screen.findByRole('button', {
    name: 'Editar configuración',
  });
  expect(edit.hasAttribute('disabled')).toBe(true);
  expect(
    requests.some((request) => request.path === '/configuracion/archivos'),
  ).toBe(true);
});
