// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppShell } from './AppShell';

afterEach(cleanup);

it.each([
  [{}, ['Inicio']],
  [{ puede_ver_archivos: true }, ['Inicio', 'Documentos', 'Categorías']],
  [{ puede_subir_archivos: true }, ['Inicio', 'Subir archivos', 'Categorías']],
  [{ puede_gestionar_carpetas: true }, ['Inicio', 'Documentos']],
  [{ puede_editar_archivos: true }, ['Inicio', 'Categorías']],
  [{ puede_gestionar_categorias: true }, ['Inicio', 'Categorías']],
  [
    { puede_gestionar_usuarios: true },
    ['Inicio', 'Usuarios', 'Roles y permisos'],
  ],
  [{ puede_ver_historial: true }, ['Inicio', 'Historial']],
  [{ puede_gestionar_configuracion: true }, ['Inicio']],
])('limita el menú a los permisos %j', (permissions, labels) => {
  render(
    <MemoryRouter>
      <AppShell userName="Prueba" permissions={permissions} onSignOut={vi.fn()}>
        Contenido
      </AppShell>
    </MemoryRouter>,
  );
  const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
  expect(
    within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent),
  ).toEqual(labels);
});

it('conserva el foco del menú móvil y permite cerrarlo con Escape', async () => {
  render(
    <MemoryRouter>
      <AppShell userName="Prueba" permissions={{}} onSignOut={vi.fn()}>
        Contenido
      </AppShell>
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
  expect(document.activeElement).toBe(
    screen.getByRole('link', { name: 'Inicio' }),
  );
  await user.keyboard('{Escape}');
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Abrir menú' }),
  );
});
