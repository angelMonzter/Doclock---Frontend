import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/TextField';
import { Notice } from '@/components/ui/Notice';
import { useAuth } from '@/providers/AuthProvider';
import { useDocumentAction } from '@/hooks/documents/useDocumentAction';
import { documentActionsService } from '@/services/documents/documentActionsService';
import { validateFile } from '@/models/documents';
import { formatBytes } from '@/lib/format';
import type { RepositorySnapshot } from '@/types/repository';

//code mode S3
export function DocumentVersions({
  documentId,
  data,
}: {
  documentId: string;
  data: RepositorySnapshot;
}) {
  const { user } = useAuth();
  const pagination = usePagination();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const canEdit = Boolean(
    user?.permissions.puede_editar_archivos && data.policy.allowReplacement,
  );
  const query = useQuery({
    queryKey: ['documentVersions', user?.id, documentId, pagination.request],
    queryFn: ({ signal }) =>
      documentActionsService.versionsPage(
        documentId,
        pagination.request,
        signal,
      ),
    placeholderData: keepPreviousData,
    enabled: open && Boolean(user?.permissions.puede_ver_archivos),
  });
  const action = useDocumentAction(
    async (operation: {
      type: 'replace' | 'restore' | 'download';
      id?: string;
    }) => {
      if (operation.type !== 'download' && !canEdit) return;
      if (
        operation.type === 'download' &&
        (!user?.permissions.puede_ver_archivos || !data.policy.allowDownloads)
      )
        return;
      if (operation.type === 'replace') {
        if (!file) throw new Error('Selecciona un archivo.');
        const error = validateFile(file, data.policy);
        if (error) throw new Error(error);
        await documentActionsService.replace(documentId, file, comment);
      } else if (operation.type === 'restore') {
        await documentActionsService.restoreVersion(documentId, operation.id!);
        setConfirmation(null);
      } else
        window.location.assign(
          await documentActionsService.download(documentId, operation.id),
        );
    },
  );
  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>Versiones del documento</summary>
      {!canEdit && (
        <p className="muted-text">
          {!user?.permissions.puede_editar_archivos
            ? 'Tu rol no permite subir ni restaurar versiones.'
            : 'El reemplazo de archivos está desactivado en la configuración del sistema.'}
        </p>
      )}
      {query.isFetching && <p role="status">Consultando versiones…</p>}
      {query.error && (
        <Notice tone="error">
          {query.error.message}
          <Button variant="ghost" onClick={() => query.refetch()}>
            Reintentar
          </Button>
        </Notice>
      )}
      {action.error && <Notice tone="error">{action.error.message}</Notice>}
      {action.isSuccess && (
        <Notice tone="success">Operación completada.</Notice>
      )}
      {query.data && (
        <Pagination
          label="Paginación de versiones"
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
      <ul className="activity-list">
        {!query.isPlaceholderData &&
          !query.isError &&
          query.data?.items.map((version) => (
            <li key={version.id_version}>
              <div>
                <strong>Versión {version.numero_version}</strong>
                <p>
                  {version.nombre_original} ·{' '}
                  {formatBytes(Number(version.tamano_bytes))}
                </p>
                <div className="form-actions">
                  <Button
                    variant="secondary"
                    disabled={action.isPending || !data.policy.allowDownloads}
                    onClick={() =>
                      action.mutate({
                        type: 'download',
                        id: version.id_version,
                      })
                    }
                  >
                    Descargar versión {version.numero_version}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={action.isPending || !canEdit}
                    onClick={() => setConfirmation(version.id_version)}
                  >
                    Restaurar versión {version.numero_version}
                  </Button>
                </div>
              </div>
            </li>
          ))}
      </ul>
      {confirmation && (
        <Notice>
          Esta versión pasará a ser la vigente; las demás se conservarán.
          <div className="form-actions">
            <Button
              disabled={action.isPending || !canEdit}
              onClick={() =>
                action.mutate({ type: 'restore', id: confirmation })
              }
            >
              Confirmar restauración
            </Button>
            <Button variant="ghost" onClick={() => setConfirmation(null)}>
              Cancelar
            </Button>
          </div>
        </Notice>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          action.mutate({ type: 'replace' });
        }}
      >
        <fieldset
          disabled={action.isPending || !canEdit}
          className="metadata-fields"
        >
          <TextField
            label="Nueva versión"
            type="file"
            required
            accept={data.policy.extensions.map((ext) => '.' + ext).join(',')}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <TextField
            label="Comentario"
            maxLength={500}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <Button type="submit">
            {action.isPending ? 'Guardando versión…' : 'Subir nueva versión'}
          </Button>
        </fieldset>
      </form>
    </details>
  );
}
