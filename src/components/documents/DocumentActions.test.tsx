// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocumentActions } from './DocumentActions';
import { documentActionsService } from '@/services/documents/documentActionsService';
import type { DocumentFile } from '@/types/documents';
import type { RepositorySnapshot } from '@/types/repository';

const auth = vi.hoisted(() => ({
  permissions: {
    puede_editar_archivos: true,
    puede_ver_archivos: true,
    puede_eliminar_archivos: true,
  },
}));
vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'USUARIO001', permissions: auth.permissions },
  }),
}));
const clients: QueryClient[] = [];
const document: DocumentFile = {
  id: 'ARCHIVO001',
  title: 'Original',
  originalName: 'original.pdf',
  extension: 'pdf',
  bytes: 100,
  folderId: null,
  categoryId: 'CATEGORIA1',
  description: '',
  author: 'Autor',
  createdAt: new Date().toISOString(),
};
const data: RepositorySnapshot = {
  documents: [document],
  folders: [{ id: 'CARPETA001', name: 'Proyecciones', parentId: null }],
  categories: [{ id: 'CATEGORIA1', name: 'Informes' }],
  activity: [],
  storageBytes: 100,
  policy: {
    maxFiles: 10,
    maxBytes: 2000,
    capacityBytes: 10000,
    extensions: ['pdf'],
    allowDownloads: true,
    allowReplacement: true,
  },
};
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <DocumentActions document={document} data={data} />
    </QueryClientProvider>,
  );
}
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.restoreAllMocks();
  auth.permissions.puede_editar_archivos = true;
});

it('edita título y carpeta usando los controles existentes y confirma respuesta', async () => {
  const save = vi.spyOn(documentActionsService, 'update').mockResolvedValue();
  mount();
  const user = userEvent.setup();
  await user.click(screen.getByText('Editar y mover documento'));
  await user.clear(screen.getByLabelText('Título'));
  await user.type(screen.getByLabelText('Título'), 'Cotización');
  await user.selectOptions(screen.getByLabelText('Carpeta'), 'CARPETA001');
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Cotización', folderId: 'CARPETA001' }),
    ),
  );
  await screen.findByText('Operación completada.');
});

it('muestra error del backend y enfoca el aviso', async () => {
  vi.spyOn(documentActionsService, 'update').mockRejectedValue(
    new Error('Almacenamiento no disponible'),
  );
  mount();
  const user = userEvent.setup();
  await user.click(screen.getByText('Editar y mover documento'));
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  const notice = await screen.findByText('Almacenamiento no disponible');
  expect(notice.closest('[tabindex="-1"]')).toBe(window.document.activeElement);
});

it('un lector no recibe controles de edición', () => {
  auth.permissions.puede_editar_archivos = false;
  mount();
  expect(screen.queryByText('Editar y mover documento')).toBeNull();
});
