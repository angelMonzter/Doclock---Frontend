// @vitest-environment jsdom
//code mode usuarios: pruebas de sesión y CRUD mediante HTTP simulado; no usa datos reales.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider } from '@/providers/AuthProvider';
import { GuestOnly, ProtectedWorkspace } from '@/app/WorkspaceRoutes';
import { LoginPage } from '@/pages/auth/LoginPage';
import { UsersPage } from '@/pages/UsersPage';
import { getToken, setToken } from '@/services/auth/session';
import { usersService } from '@/services/administration/usersService';
import { apiRequest } from '@/services/api';

const admin = {
  id_usuario: 'USUARIO001',
  nombre: 'Administrador',
  correo: 'admin@example.com',
  sid_rol: 'ROLADMIN01',
  rol: 'Administrador',
  activo: 1,
  fecha_creacion: '2026-10-05 10:00:00',
  fecha_actualizacion: '2026-10-05 10:00:00',
};
let records: (typeof admin)[];
let permission: number;
let expired: boolean;
let offline: boolean;
let writeError: boolean;
let requests: {
  path: string;
  method: string;
  body: Record<string, unknown> | null;
}[];
const clients: QueryClient[] = [];
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  setToken(null);
  sessionStorage.clear();
  records = [{ ...admin }];
  permission = 1;
  expired = false;
  offline = false;
  writeError = false;
  requests = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 0),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input), 'http://localhost');
      const path = url.pathname.replace('/api', '');
      const method = init?.method ?? 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      requests.push({ path, method, body });
      if (offline) throw new TypeError('Network error');
      if (path === '/auth/login') {
        if (
          body.correo !== admin.correo ||
          body.password !== 'ClaveCorrecta1!'
        ) {
          return reply({ msg: 'Correo o contraseña incorrectos' }, 401);
        }
        return reply({
          token: 'token-real-simulado',
          perfil: {
            ...admin,
            permisos: { puede_gestionar_usuarios: permission },
          },
        });
      }
      if (expired) return reply({ msg: 'Token vencido' }, 401);
      expect(new Headers(init?.headers).get('Authorization')).toBe(
        'Bearer token-real-simulado',
      );
      if (path === '/auth/me')
        return reply({ ...admin, puede_gestionar_usuarios: permission });
      if (path === '/configuracion/archivos/uso')
        return reply({
          bytes_utilizados: 0,
          almacenamiento_maximo_bytes: null,
          tamano_maximo_efectivo_bytes: 10485760,
          archivos_maximos_efectivos: 10,
        });
      if (!permission) return reply({ msg: 'No tienes permiso' }, 403);
      if (path === '/roles')
        return reply([
          { id_rol: 'ROLADMIN01', nombre: 'Administrador', activo: 1 },
          { id_rol: 'ROLLECTOR1', nombre: 'Lector', activo: 1 },
        ]);
      if (path === '/usuarios' && method === 'GET') {
        const offset = Number(url.searchParams.get('offset') ?? 0);
        if (url.searchParams.get('paginated') === '1') {
          const limit = Number(url.searchParams.get('limit'));
          return reply({
            items: records.slice(offset, offset + limit),
            total: records.length,
            offset,
            limit,
          });
        }
        return reply(records.slice(offset, offset + 100));
      }
      if (writeError) return reply({ msg: 'Ya existe ese correo' }, 409);
      if (path === '/usuarios' && method === 'POST') {
        records.push({
          ...admin,
          ...body,
          id_usuario: 'USUARIO002',
          rol: 'Lector',
        });
        return reply({ id_usuario: 'USUARIO002', msg: 'Usuario creado' }, 201);
      }
      if (path.startsWith('/usuarios/')) {
        const row = records.find(
          (record) => record.id_usuario === path.split('/')[2],
        )!;
        if (method === 'PATCH') Object.assign(row, body);
        if (method === 'DELETE') row.activo = 0;
        return reply({ msg: 'Usuario actualizado' });
      }
      throw new Error('Ruta inesperada: ' + path);
    }),
  );
});

afterEach(() => {
  cleanup();
  for (const client of clients.splice(0)) client.clear();
  setToken(null);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mount(path = '/usuarios') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <LoginPage />
                </GuestOnly>
              }
            />
            <Route element={<ProtectedWorkspace />}>
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/dashboard" element={<UsersPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

async function authenticated() {
  setToken('token-real-simulado');
  mount();
  await screen.findByRole('button', { name: 'Crear usuario' });
  await waitFor(() =>
    expect(
      (
        screen.getByRole('button', {
          name: 'Crear usuario',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
}

describe('login y usuarios reales', () => {
  it('actualiza permisos al recuperar foco y retira el acceso al módulo', async () => {
    await authenticated();
    permission = 0;
    fireEvent.focus(window);
    await screen.findByText('No tienes permiso para gestionar usuarios.');
    expect(screen.queryByRole('link', { name: 'Usuarios' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Crear usuario' })).toBeNull();
    expect(getToken()).toBe('token-real-simulado');
  });

  it('conserva la pantalla y sesión si la actualización de permisos falla por red', async () => {
    await authenticated();
    const previous = requests.filter(
      (request) => request.path === '/auth/me',
    ).length;
    offline = true;
    fireEvent.focus(window);
    await waitFor(() =>
      expect(
        requests.filter((request) => request.path === '/auth/me').length,
      ).toBe(previous + 1),
    );
    expect(screen.getByRole('button', { name: 'Crear usuario' })).toBeTruthy();
    expect(getToken()).toBe('token-real-simulado');
  });

  it('elimina acceso dummy y envía correo/password; muestra los errores del backend', async () => {
    mount('/login');
    const user = userEvent.setup();
    expect(screen.queryByText('Usar datos de prueba')).toBeNull();
    await user.type(screen.getByLabelText('Correo electrónico'), admin.correo);
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta');
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }));
    await screen.findByText('Correo o contraseña incorrectos');
    expect(getToken()).toBeNull();
    await user.clear(screen.getByLabelText('Contraseña'));
    await user.type(screen.getByLabelText('Contraseña'), 'ClaveCorrecta1!');
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }));
    await screen.findByRole('button', { name: 'Crear usuario' });
    expect(getToken()).toBe('token-real-simulado');
    expect(
      requests.find((request) => request.path === '/auth/login')?.body,
    ).toEqual({ correo: admin.correo, password: 'incorrecta' });
    expect(
      requests.every((request) =>
        [
          '/auth/login',
          '/usuarios',
          '/roles',
          '/configuracion/archivos/uso',
        ].includes(request.path),
      ),
    ).toBe(true);
  });

  it('restaura /me al recargar y logout elimina token y caché', async () => {
    await authenticated();
    expect(requests.some((request) => request.path === '/auth/me')).toBe(true);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await screen.findByRole('button', { name: /Iniciar sesión/ });
    expect(getToken()).toBeNull();
    expect(clients[0].getQueryCache().getAll()).toHaveLength(0);
  });

  it('crea, edita sin reenviar contraseña, desactiva y reactiva con el diseño existente', async () => {
    await authenticated();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));
    expect(document.activeElement?.textContent).toBe('Crear usuario');
    await user.type(screen.getByLabelText('Nombre *'), 'Ana Real');
    await user.type(
      screen.getByLabelText('Correo electrónico *'),
      'ana@example.com',
    );
    await user.selectOptions(screen.getByLabelText('Rol *'), 'ROLLECTOR1');
    await user.type(screen.getByLabelText('Contraseña *'), 'ClaveNueva123!');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await screen.findByRole('button', { name: 'Editar Ana Real' });
    expect(requests.find((request) => request.method === 'POST')?.body).toEqual(
      {
        nombre: 'Ana Real',
        correo: 'ana@example.com',
        sid_rol: 'ROLLECTOR1',
        activo: 1,
        password: 'ClaveNueva123!',
      },
    );
    await waitFor(() =>
      expect(document.activeElement?.id).toBe('admin-create'),
    );
    await user.click(screen.getByRole('button', { name: 'Editar Ana Real' }));
    expect(
      (screen.getByLabelText('Nueva contraseña') as HTMLInputElement).value,
    ).toBe('');
    await user.clear(screen.getByLabelText('Nombre *'));
    await user.type(screen.getByLabelText('Nombre *'), 'Ana Editada');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await screen.findByRole('button', { name: 'Editar Ana Editada' });
    const patch = requests.find((request) => request.method === 'PATCH')!;
    expect(patch.body).not.toHaveProperty('password');
    expect(patch.body).not.toHaveProperty('sid_rol');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(
      screen.getByRole('button', { name: 'Desactivar Ana Editada' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Desactivar Ana Editada' }),
      ).toBeNull(),
    );
    expect(requests.some((request) => request.method === 'DELETE')).toBe(true);
    const row = screen
      .getByRole('button', { name: 'Editar Ana Editada' })
      .closest('tr')!;
    expect(within(row).getByText('Inactivo')).toBeTruthy();
    await user.click(
      screen.getByRole('button', { name: 'Editar Ana Editada' }),
    );
    await user.click(screen.getByLabelText('Activo'));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await screen.findByRole('button', { name: 'Desactivar Ana Editada' });
  });

  it('conserva datos y enfoca el error si la API rechaza el guardado', async () => {
    await authenticated();
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: 'Editar Administrador' }),
    );
    expect((screen.getByLabelText('Rol *') as HTMLSelectElement).disabled).toBe(
      true,
    );
    expect((screen.getByLabelText('Activo') as HTMLInputElement).disabled).toBe(
      true,
    );
    writeError = true;
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await screen.findByText('Ya existe ese correo');
    expect(document.activeElement?.textContent).toContain(
      'Ya existe ese correo',
    );
    expect((screen.getByLabelText('Nombre *') as HTMLInputElement).value).toBe(
      'Administrador',
    );
    await user.keyboard('{Escape}');
    await screen.findByRole('button', { name: 'Editar Administrador' });
  });

  it('no consulta usuarios ni roles sin permiso', async () => {
    permission = 0;
    setToken('token-real-simulado');
    mount();
    await screen.findByText('No tienes permiso para gestionar usuarios.');
    expect(requests.map((request) => request.path)).toEqual([
      '/auth/me',
      '/configuracion/archivos/uso',
    ]);
  });

  it('un token vencido vuelve al login sin mostrar datos cacheados', async () => {
    expired = true;
    setToken('token-real-simulado');
    mount();
    await screen.findByRole('button', { name: /Iniciar sesión/ });
    expect(getToken()).toBeNull();
    expect(screen.queryByRole('button', { name: 'Crear usuario' })).toBeNull();
  });

  it('una falla de red al restaurar permite reintentar sin borrar la sesión', async () => {
    offline = true;
    setToken('token-real-simulado');
    mount();
    await screen.findByRole('button', { name: 'Reintentar' });
    expect(getToken()).toBe('token-real-simulado');
    offline = false;
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByRole('button', { name: 'Crear usuario' });
  });

  it('recorre todas las páginas y normaliza activo sin limitar la tabla a 100 filas', async () => {
    setToken('token-real-simulado');
    records = Array.from({ length: 101 }, (_, index) => ({
      ...admin,
      id_usuario: String(index),
      activo: index === 0 ? 0 : 1,
    }));
    const result = await usersService.getSnapshot();
    expect(result.records.users).toHaveLength(101);
    expect(result.records.users[0].values.activo).toBe(false);
    expect(
      requests.filter((request) => request.path === '/usuarios'),
    ).toHaveLength(2);
  });

  it('el transporte no oculta errores de conexión con datos de prueba', async () => {
    offline = true;
    await expect(apiRequest('/usuarios')).rejects.toThrow(
      'No se pudo conectar',
    );
  });
});
