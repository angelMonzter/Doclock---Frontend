import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/Notice';
import { useAuth } from '@/providers/AuthProvider';
import { useDocumentAction } from '@/hooks/documents/useDocumentAction';
import { documentActionsService } from '@/services/documents/documentActionsService';
import type { EmptyTrashResult } from '@/types/documentActions';

type EmptyTrashActionsProps = {
  total: number;
  pending: number;
  busy?: boolean;
  onBusyChange: (busy: boolean) => void;
};

export function EmptyTrashActions({
  total,
  pending,
  busy = false,
  onBusyChange,
}: EmptyTrashActionsProps) {
  const { user } = useAuth();
  const allowed = Boolean(user?.permissions.puede_vaciar_papelera);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<EmptyTrashResult | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const notice = useRef<HTMLDivElement>(null);
  const action = useDocumentAction(async (pendingOnly: boolean) => {
    if (!allowed) return;
    setResult(null);
    const response = await documentActionsService.emptyTrash(pendingOnly);
    setResult(response);
    setConfirm(false);
  });
  useEffect(() => {
    onBusyChange(action.isPending);
  }, [action.isPending, onBusyChange]);
  useEffect(() => {
    if (confirm) confirmation.current?.focus();
  }, [confirm]);
  useEffect(() => {
    if (action.isError || action.isSuccess) notice.current?.focus();
  }, [action.isError, action.isSuccess]);
  function cancel() {
    setConfirm(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }
  return (
    <div>
      <div ref={notice} tabIndex={-1} aria-live="polite">
        {action.error && (
          <Notice tone="error">
            No se pudo confirmar la limpieza. Actualiza la papelera para
            consultar su estado y vuelve a intentarlo.
          </Notice>
        )}
        {result && (
          <Notice tone={result.pendientes ? undefined : 'success'}>
            {result.msg}
          </Notice>
        )}
      </div>
      {!allowed && (
        <p className="muted-text">Tu rol no permite vaciar la papelera.</p>
      )}
      {confirm ? (
        <div
          ref={confirmation}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !action.isPending) {
              event.stopPropagation();
              cancel();
            }
          }}
        >
          <Notice>
            Se eliminarán todos los elementos de la papelera, no solo los de
            esta página, junto con sus versiones. No podrás recuperarlos.
            <div className="form-actions">
              <Button
                disabled={!allowed || busy || action.isPending}
                onClick={() => action.mutate(false)}
              >
                {action.isPending ? 'Vaciando…' : 'Sí, vaciar papelera'}
              </Button>
              <Button
                variant="secondary"
                disabled={action.isPending}
                onClick={cancel}
              >
                Cancelar
              </Button>
            </div>
          </Notice>
        </div>
      ) : (
        <Button
          ref={trigger}
          variant="secondary"
          disabled={!allowed || busy || action.isPending || total === 0}
          onClick={() => setConfirm(true)}
        >
          Vaciar papelera
        </Button>
      )}
      {allowed && pending > 0 && (
        <Notice>
          Hay {pending} elementos retirados del sistema cuya limpieza sigue
          pendiente. Su espacio se liberará cuando termine.
          <Button
            variant="ghost"
            disabled={busy || action.isPending}
            onClick={() => action.mutate(true)}
          >
            {action.isPending ? 'Limpiando…' : 'Reintentar limpieza'}
          </Button>
        </Notice>
      )}
    </div>
  );
}
