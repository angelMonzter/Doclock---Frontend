import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/TextField';
import { SelectField } from '@/components/ui/SelectField';
import { Notice } from '@/components/ui/Notice';
import { useAuth } from '@/providers/AuthProvider';
import { useDocumentAction } from '@/hooks/documents/useDocumentAction';
import { repositoryService } from '@/services/documents/repositoryService';
import { documentActionsService } from '@/services/documents/documentActionsService';
import { folderTrail } from '@/models/documents';
import type { Folder } from '@/types/documents';

//code mode S3
export function FolderActions({
  folder,
  folders,
}: {
  folder: Folder;
  folders: Folder[];
}) {
  const { user } = useAuth();
  const canManage = Boolean(user?.permissions.puede_gestionar_carpetas);
  const [draft, setDraft] = useState(folder);
  const [confirm, setConfirm] = useState(false);
  const action = useDocumentAction(async (operation: 'save' | 'delete') => {
    if (!canManage) return;
    if (operation === 'save') await repositoryService.updateFolder(draft);
    else await documentActionsService.remove('carpetas', folder.id);
  });
  return (
    <details className="panel">
      <summary>Administrar esta carpeta</summary>
      {!canManage && (
        <p className="muted-text">
          Tu rol no permite modificar ni enviar carpetas a papelera.
        </p>
      )}
      {action.error && <Notice tone="error">{action.error.message}</Notice>}
      {action.isSuccess && <Notice tone="success">Carpeta actualizada.</Notice>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          action.mutate('save');
        }}
      >
        <fieldset
          disabled={action.isPending || !canManage}
          className="metadata-fields"
        >
          <TextField
            label="Nombre"
            required
            maxLength={150}
            value={draft.name}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
          />
          <SelectField
            label="Carpeta padre"
            value={draft.parentId ?? ''}
            onChange={(event) =>
              setDraft({ ...draft, parentId: event.target.value || null })
            }
          >
            <option value="">Raíz</option>
            {folders
              .filter(
                (item) =>
                  !folderTrail(folders, item.id).some(
                    (parent) => parent.id === folder.id,
                  ),
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </SelectField>
          <Button type="submit">
            {action.isPending ? 'Guardando…' : 'Guardar carpeta'}
          </Button>
        </fieldset>
      </form>
      {confirm ? (
        <Notice>
          Solo pueden enviarse a papelera carpetas vacías.
          <div className="form-actions">
            <Button
              disabled={action.isPending || !canManage}
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
          disabled={action.isPending || !canManage}
          onClick={() => setConfirm(true)}
        >
          Enviar carpeta a papelera
        </Button>
      )}
    </details>
  );
}
