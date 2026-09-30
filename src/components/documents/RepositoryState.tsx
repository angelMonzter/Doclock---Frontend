import { Notice } from '@/components/ui/Notice';
import { Button } from '@/components/ui/button';
export function RepositoryState({
  error,
  retry,
}: {
  error?: Error | null;
  retry: () => void;
}) {
  if (error)
    return (
      <div className="panel">
        <Notice tone="error">
          No pudimos cargar el repositorio. {error.message}
        </Notice>
        <Button onClick={retry}>Reintentar</Button>
      </div>
    );
  return (
    <div className="repository-loading" role="status" aria-busy="true">
      <p>Cargando tu espacio de trabajo…</p>
      <div />
      <div />
      <div />
    </div>
  );
}
