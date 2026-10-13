import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/TextField';
import { TextareaField } from '@/components/ui/TextareaField';
import { SelectField } from '@/components/ui/SelectField';
import { Notice } from '@/components/ui/Notice';
import { useAuth } from '@/providers/AuthProvider';
import { useDocumentAction } from '@/hooks/documents/useDocumentAction';
import { documentActionsService } from '@/services/documents/documentActionsService';
import type { DocumentFile } from '@/types/documents';
import type { RepositorySnapshot } from '@/types/repository';
import { DocumentVersions } from './DocumentVersions';

//code mode S3: componente documental; conserva los controles y estilos compartidos.
export function DocumentActions({
  document,
  data,
}: {
  document: DocumentFile;
  data: RepositorySnapshot;
}) {
  const { user } = useAuth();
  const canEdit = Boolean(user?.permissions.puede_editar_archivos);
  const canDelete = Boolean(user?.permissions.puede_eliminar_archivos);
  const [draft, setDraft] = useState(document);
  const [confirm, setConfirm] = useState(false);
  const notice = useRef<HTMLDivElement>(null);
  const action = useDocumentAction(
    async (operation: 'save' | 'download' | 'delete') => {
      if (
        (operation === 'save' && !canEdit) ||
        (operation === 'delete' && !canDelete) ||
        (operation === 'download' &&
          (!user?.permissions.puede_ver_archivos ||
            !data.policy.allowDownloads))
      )
        return;
      if (operation === 'save') await documentActionsService.update(draft);
      if (operation === 'delete')
        await documentActionsService.remove('archivos', document.id);
      if (operation === 'download') {
        const url = await documentActionsService.download(document.id);
        window.location.assign(url);
      }
    },
  );
  useEffect(() => {
    if (action.isError) notice.current?.focus();
  }, [action.isError]);
  return (
    <div className="document-actions">
      <div ref={notice} tabIndex={-1}>
        {action.error && <Notice tone="error">{action.error.message}</Notice>}
        {action.isSuccess && (
          <Notice tone="success">Operación completada.</Notice>
        )}
      </div>
      <Button
        disabled={
          action.isPending ||
          !data.policy.allowDownloads ||
          !user?.permissions.puede_ver_archivos
        }
        onClick={() => action.mutate('download')}
      >
        Descargar
      </Button>
      {!data.policy.allowDownloads && (
        <p className="muted-text">
          Las descargas están desactivadas en la configuración del sistema.
        </p>
      )}
      <details>
        <summary>Editar y mover documento</summary>
        {!canEdit && (
          <p className="muted-text">
            Tu rol no permite editar ni mover documentos.
          </p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            action.mutate('save');
          }}
        >
          <fieldset
            disabled={action.isPending || !canEdit}
            className="metadata-fields"
          >
            <TextField
              label="Título"
              value={draft.title}
              maxLength={150}
              required
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
            />
            <TextareaField
              label="Descripción"
              value={draft.description}
              maxLength={500}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
            <SelectField
              label="Categoría"
              value={draft.categoryId}
              required
              onChange={(event) =>
                setDraft({ ...draft, categoryId: event.target.value })
              }
            >
              {!data.categories.some(
                (item) => item.id === draft.categoryId,
              ) && (
                <option value={draft.categoryId}>
                  Categoría no activa: selecciona otra
                </option>
              )}
              {data.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Carpeta"
              value={draft.folderId ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, folderId: event.target.value || null })
              }
            >
              <option value="">Raíz</option>
              {data.folders.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectField>
            <Button type="submit">
              {action.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </fieldset>
        </form>
      </details>
      <DocumentVersions documentId={document.id} data={data} />
      <div>
        {!canDelete && (
          <p className="muted-text">
            Tu rol no permite enviar documentos a papelera.
          </p>
        )}
        {confirm ? (
          <Notice>
            El documento conservará sus versiones y seguirá ocupando espacio.
            <div className="form-actions">
              <Button
                disabled={action.isPending || !canDelete}
                onClick={() => action.mutate('delete')}
              >
                Confirmar envío a papelera
              </Button>
              <Button
                variant="ghost"
                disabled={action.isPending}
                onClick={() => setConfirm(false)}
              >
                Cancelar
              </Button>
            </div>
          </Notice>
        ) : (
          <Button
            variant="ghost"
            disabled={action.isPending || !canDelete}
            onClick={() => setConfirm(true)}
          >
            Enviar a papelera
          </Button>
        )}
      </div>
    </div>
  );
}
