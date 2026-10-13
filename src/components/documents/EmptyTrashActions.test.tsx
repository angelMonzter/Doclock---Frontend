// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmptyTrashActions } from './EmptyTrashActions';
import { documentActionsService } from '@/services/documents/documentActionsService';

const auth = vi.hoisted(() => ({ allowed: true }));
vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { permissions: { puede_vaciar_papelera: auth.allowed } },
  }),
}));
const clients: QueryClient[] = [];
function mount(pending = 0) {
  const client = new QueryClient();
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <EmptyTrashActions total={2} pending={pending} onBusyChange={vi.fn()} />
    </QueryClientProvider>,
  );
}
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.restoreAllMocks();
  auth.allowed = true;
});

it('requiere confirmación y permite cancelar con Escape sin borrar', async () => {
  const empty = vi
    .spyOn(documentActionsService, 'emptyTrash')
    .mockResolvedValue({
      eliminados: 2,
      pendientes: 0,
      msg: 'Papelera vacía.',
    });
  mount();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Vaciar papelera' }));
  expect(empty).not.toHaveBeenCalled();
  await user.keyboard('{Escape}');
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Vaciar papelera' }),
    ),
  );
  await user.click(screen.getByRole('button', { name: 'Vaciar papelera' }));
  await user.click(screen.getByRole('button', { name: 'Sí, vaciar papelera' }));
  await waitFor(() => expect(empty).toHaveBeenCalledWith(false));
  await screen.findByText('Papelera vacía.');
});

it('sin permiso muestra la acción deshabilitada y no envía peticiones', async () => {
  auth.allowed = false;
  const empty = vi.spyOn(documentActionsService, 'emptyTrash');
  mount();
  const button = screen.getByRole('button', {
    name: 'Vaciar papelera',
  }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  await userEvent.click(button);
  expect(empty).not.toHaveBeenCalled();
});

it('reintenta solo pendientes y explica un fallo sin anunciar éxito', async () => {
  const empty = vi
    .spyOn(documentActionsService, 'emptyTrash')
    .mockRejectedValue(new Error('Network error'));
  mount(1);
  await userEvent.click(
    screen.getByRole('button', { name: 'Reintentar limpieza' }),
  );
  await waitFor(() => expect(empty).toHaveBeenCalledWith(true));
  await screen.findByText(/No se pudo confirmar la limpieza/);
});
