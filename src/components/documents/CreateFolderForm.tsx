import { useAuth } from '@/providers/AuthProvider';
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/TextField';
import { Notice } from '@/components/ui/Notice';
import { repositoryService } from '@/services/documents/repositoryService';
import { useRefreshDocuments } from '@/hooks/documents/useDocuments';

export function CreateFolderForm({
  parentId,
  onClose,
  onCreated,
}: {
  parentId: string | null;
  onClose: () => void;
  onCreated: (name: string) => void;
}) {
  const { user } = useAuth();
  const canManage = Boolean(user?.permissions.puede_gestionar_carpetas);
  const [name, setName] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const refresh = useRefreshDocuments();
  const mutation = useMutation({
    mutationFn: () => repositoryService.createFolder(name, parentId),
    onSuccess: async (folder) => {
      await refresh();
      onCreated(folder.name);
    },
  });
  useEffect(() => {
    if (mutation.isError) input.current?.focus();
  }, [mutation.isError, mutation.error]);
  return (
    <form
      className="folder-form panel"
      onSubmit={(event) => {
        event.preventDefault();
        if (canManage) mutation.mutate();
      }}
      noValidate
    >
      <h2>Nueva carpeta</h2>
      <p>Se creará en el destino que estás explorando.</p>
      <TextField
        label="Nombre de la carpeta"
        autoFocus
        ref={input}
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={150}
        disabled={mutation.isPending || !canManage}
        error={mutation.error?.message}
        placeholder="Por ejemplo: Proyectos del trimestre"
      />
      <div className="form-actions">
        <Button type="submit" disabled={mutation.isPending || !canManage}>
          {mutation.isPending ? 'Creando…' : 'Crear carpeta'}
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
      </div>
      <Notice>
        La carpeta se guardará en el sistema y estará disponible al volver.
      </Notice>
    </form>
  );
}
