import { useEffect, useRef, useState } from 'react';
import { filePolicy } from '@/config/files';
import { validateFile } from '@/models/documents';
import { documentService } from '@/services/documents/mockDocumentService';
import { useRefreshDocuments } from '@/hooks/documents/useDocuments';
import type { DocumentFile, UploadRequest } from '@/types/documents';

export type QueuedFile = {
  id: string;
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
    if (controller.current || result.length) return;
    const additions: QueuedFile[] = [];
    const warnings: string[] = [];
    for (const file of Array.from(incoming)) {
      if (files.length + additions.length >= filePolicy.maxFiles) {
        warnings.push(`La cola admite hasta ${filePolicy.maxFiles} archivos.`);
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
        name: file.name,
        size: file.size,
        title: file.name.replace(/\.[^.]+$/, '').slice(0, 150),
        error: validateFile(file),
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
  async function submit(
    metadata: Omit<UploadRequest, 'files'>,
    simulateFailure: boolean,
  ) {
    if (controller.current) return;
    const requestController = new AbortController();
    controller.current = requestController;
    setBusy(true);
    setProgress(0);
    setError('');
    setResult([]);
    try {
      const created = await documentService.upload(
        { ...metadata, files },
        {
          signal: requestController.signal,
          onProgress: (value) => {
            if (mounted.current) setProgress(value);
          },
          simulateFailure,
        },
      );
      await refresh();
      if (mounted.current) setResult(created);
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error
            ? cause.message
            : 'No se completó la simulación. Intenta de nuevo.',
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
    files,
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
