// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDocuments } from './useDocuments';
import { useControlForm } from '@/hooks/administration/useControlForm';
import { repositoryService } from '@/services/documents/repositoryService';
import { controlService } from '@/services/administration/controlService';
import type { RepositorySnapshot } from '@/types/repository';

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'USUARIO001', permissions: { puede_ver_archivos: true } },
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it.each(['categories', 'fileSettings'] as const)(
  'guardar %s actualiza el repositorio que ya está montado',
  async (module) => {
    const data: RepositorySnapshot = {
      folders: [],
      documents: [],
      activity: [],
      categories: [],
      storageBytes: 900,
      policy: {
        extensions: ['pdf'],
        maxBytes: 100,
        maxFiles: 1,
        capacityBytes: 1000,
      },
    };
    vi.spyOn(repositoryService, 'getSnapshot').mockImplementation(async () =>
      structuredClone(data),
    );
    vi.spyOn(controlService, 'save').mockImplementation(async () => {
      data.categories = [{ id: 'CATEGORIA1', name: 'Nueva categoría' }];
      data.policy.maxFiles = 4;
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const onSaved = vi.fn();
    const hook = renderHook(
      () => ({
        repository: useDocuments(),
        form: useControlForm(module, undefined, onSaved),
      }),
      { wrapper },
    );
    await waitFor(() =>
      expect(hook.result.current.repository.isSuccess).toBe(true),
    );
    await act(async () => {
      await hook.result.current.form.mutation.mutateAsync();
    });
    await waitFor(() =>
      expect(hook.result.current.repository.data?.categories[0]?.name).toBe(
        'Nueva categoría',
      ),
    );
    expect(hook.result.current.repository.data?.policy.maxFiles).toBe(4);
    expect(onSaved).toHaveBeenCalledOnce();
    hook.unmount();
    client.clear();
  },
);
