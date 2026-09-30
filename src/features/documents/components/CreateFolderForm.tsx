import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/TextField';
import { Notice } from '@/components/ui/Notice';
import { documentService } from '../services/mockDocumentService';
import { useRefreshDocuments } from '../hooks/useDocuments';

export function CreateFolderForm({ parentId, onClose, onCreated }: { parentId: string | null; onClose: () => void; onCreated: (name: string) => void }) {
  const [name, setName] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const refresh = useRefreshDocuments();
  const mutation = useMutation({ mutationFn: () => documentService.createFolder(name, parentId), onSuccess: async folder => { await refresh(); onCreated(folder.name); } });
  useEffect(() => { if (mutation.isError) input.current?.focus(); }, [mutation.isError, mutation.error]);
  return <form className="folder-form panel" onSubmit={event => { event.preventDefault(); mutation.mutate(); }} noValidate>
    <h2>Nueva carpeta</h2><p>Se creará en el destino que estás explorando.</p>
    <TextField label="Nombre de la carpeta" autoFocus ref={input} value={name} onChange={event => setName(event.target.value)} maxLength={150} disabled={mutation.isPending} error={mutation.error?.message} placeholder="Por ejemplo: Proyectos del trimestre" />
    <div className="form-actions"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Creando…' : 'Crear carpeta'}</Button><Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button></div>
    <Notice>La carpeta estará disponible hasta que recargues o cierres sesión.</Notice>
  </form>;
}
