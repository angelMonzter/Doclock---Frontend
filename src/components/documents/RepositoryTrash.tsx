import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/Notice';
import { useAuth } from '@/providers/AuthProvider';
import { useDocumentAction } from '@/hooks/documents/useDocumentAction';
import { documentActionsService } from '@/services/documents/documentActionsService';
import type { TrashItem } from '@/types/documentActions';

//code mode S3: papelera lógica; no ofrece purga física.
export function RepositoryTrash() {
  const { user } = useAuth();
  const pagination = usePagination();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ['documentTrash', user?.id, pagination.request],
    queryFn: ({ signal }) =>
      documentActionsService.trashPage(pagination.request, signal),
    placeholderData: keepPreviousData,
    enabled: open && Boolean(user?.permissions.puede_ver_archivos),
  });
  const action = useDocumentAction(async (item: TrashItem) => {
    await documentActionsService.restore(item.kind, item.id);
  });
  if (!user?.permissions.puede_ver_archivos) return null;
  return (
    <details
      className="panel"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Papelera</summary>
      <p>
        Los elementos conservan su espacio hasta la eliminación definitiva.
        Restaura primero la carpeta de destino.
      </p>
      {query.isFetching && <p role="status">Consultando papelera…</p>}
      {query.error && (
        <Notice tone="error">
          {query.error.message}
          <Button onClick={() => query.refetch()}>Reintentar</Button>
        </Notice>
      )}
      {action.error && <Notice tone="error">{action.error.message}</Notice>}
      {action.isSuccess && <Notice tone="success">Elemento restaurado.</Notice>}
      {query.data && (
        <Pagination
          label="Paginación de papelera"
          page={
            query.isPlaceholderData
              ? pagination.request.page
              : Math.floor(query.data.offset / query.data.limit) + 1
          }
          pageSize={pagination.request.pageSize}
          total={query.data.total}
          busy={query.isFetching || action.isPending}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      )}
      {query.data?.total === 0 && <p>La papelera está vacía.</p>}
      <ul className="activity-list">
        {!query.isPlaceholderData &&
          !query.isError &&
          query.data?.items.map((item) => (
            <li key={item.kind + item.id}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.kind === 'carpetas' ? 'Carpeta' : 'Documento'}</p>
                <Button
                  variant="secondary"
                  disabled={
                    action.isPending ||
                    !user?.permissions[
                      item.kind === 'carpetas'
                        ? 'puede_gestionar_carpetas'
                        : 'puede_eliminar_archivos'
                    ]
                  }
                  onClick={() => action.mutate(item)}
                >
                  Restaurar {item.name}
                </Button>
              </div>
            </li>
          ))}
      </ul>
    </details>
  );
}
