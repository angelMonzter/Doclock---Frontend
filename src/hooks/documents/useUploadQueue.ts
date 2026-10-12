import { useEffect, useRef, useState } from 'react';
import { validateFile } from '@/models/documents';
//code mode S3
import { documentActionsService } from '@/services/documents/documentActionsService';
import { extensionOf } from '@/models/documents';
import { useRefreshDocuments } from '@/hooks/documents/useDocuments';
import { useDocuments } from '@/hooks/documents/useDocuments';
import type { DocumentFile, UploadRequest } from '@/types/documents';

export type QueuedFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  title: string;
  error: string | null;
};
export function useUploadQueue() {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DocumentFile[]>([]);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const query = useDocuments();
  const refresh = useRefreshDocuments();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!files.length || result.length) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [files.length, result.length]);
  function addFiles(incoming: FileList | File[]) {
    if (controller.current || result.length || !query.data || query.isError)
      return;
    const policy = query.data.policy;
    const additions: QueuedFile[] = [];
    const warnings: string[] = [];
    for (const file of Array.from(incoming)) {
      if (files.length + additions.length >= policy.maxFiles) {
        warnings.push(`La cola admite hasta ${policy.maxFiles} archivos.`);
        break;
      }
      if (
        [...files, ...additions].some(
          (item) => item.name === file.name && item.size === file.size,
        )
      ) {
        warnings.push(`«${file.name}» ya está en la cola.`);
        continue;
      }
      additions.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        title: file.name.replace(/\.[^.]+$/, '').slice(0, 150),
        error: validateFile(file, policy),
      });
    }
    setFiles((previous) => [...previous, ...additions]);
    setFeedback(warnings.join(' '));
    setError('');
  }
  function remove(id: string) {
    if (!controller.current) {
      setFiles((previous) => previous.filter((file) => file.id !== id));
      setError('');
    }
  }
  function updateTitle(id: string, title: string) {
    setFiles((previous) =>
      previous.map((file) => (file.id === id ? { ...file, title } : file)),
    );
  }
  async function submit(metadata: Omit<UploadRequest, 'files'>) {
    if (controller.current) return;
    const requestController = new AbortController();
    controller.current = requestController;
    setBusy(true);
    setProgress(0);
    setError('');
    setResult([]);
    try {
      const latest = await query.refetch();
      if (latest.error) throw latest.error;
      if (!latest.data)
        throw new Error('No se pudo consultar la configuración.');
      const data = latest.data;
      if (files.length > data.policy.maxFiles)
        throw new Error('La cola supera el límite actual de archivos.');
      const invalid = files
        .map((item) => validateFile(item.file, data.policy))
        .find(Boolean);
      if (invalid) throw new Error(invalid);
      if (!data.categories.some((item) => item.id === metadata.categoryId))
        throw new Error('Selecciona una categoría activa.');
      if (
        data.policy.capacityBytes !== null &&
        data.storageBytes +
          files.reduce((total, item) => total + item.size, 0) >
          data.policy.capacityBytes
      )
        throw new Error('No hay capacidad suficiente.');
      const ids = await documentActionsService.upload(
        {
          ...metadata,
          files: files.map((item) => ({ file: item.file, title: item.title })),
        },
        requestController.signal,
        (value) => {
          if (mounted.current) setProgress(value);
        },
      );
      const created = files.map((item, index) => ({
        id: ids[index],
        title: item.title.trim(),
        originalName: item.name,
        extension: extensionOf(item.name),
        bytes: item.size,
        folderId: metadata.folderId,
        categoryId: metadata.categoryId,
        description: metadata.description,
        author: metadata.author,
        createdAt: new Date().toISOString(),
      }));
      void refresh();
      if (mounted.current) setResult(created);
    } catch (cause) {
      void refresh();
      if (mounted.current)
        setError(
          cause instanceof Error
            ? cause.message
            : 'No se completó la carga. Revisa Documentos antes de reintentar.',
        );
    } finally {
      controller.current = null;
      if (mounted.current) setBusy(false);
    }
  }
  function reset() {
    setFiles([]);
    setResult([]);
    setError('');
    setFeedback('');
    setProgress(0);
  }
  return {
    files: files.map((file) => ({
      ...file,
      error: query.data ? validateFile(file, query.data.policy) : file.error,
    })),
    feedback,
    error,
    busy,
    progress,
    result,
    addFiles,
    remove,
    updateTitle,
    submit,
    reset,
    cancel: () => controller.current?.abort(),
  };
}
