import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/Notice';

export type AdministrationFormFrameProps = {
  title: string;
  legend: string;
  busy: boolean;
  error?: string;
  note?: ReactNode;
  preview?: ReactNode;
  children: ReactNode;
  onSubmit: () => void;
  onClose: () => void;
};

export function AdministrationFormFrame({
  title,
  legend,
  busy,
  error,
  note,
  preview,
  children,
  onSubmit,
  onClose,
}: AdministrationFormFrameProps) {
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const errorContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    if (error && !busy) errorContainer.current?.focus();
  }, [error, busy]);

  return (
    <section
      className="panel admin-editor"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) onClose();
      }}
    >
      <h2 id={titleId} ref={heading} tabIndex={-1}>
        {title}
      </h2>
      <p className="muted-text">Los campos marcados con * son obligatorios.</p>
      {note}
      <form
        aria-busy={busy}
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) onSubmit();
        }}
      >
        <fieldset className="admin-fields" disabled={busy}>
          <legend className="sr-only">{legend}</legend>
          {children}
        </fieldset>
        {preview}
        <div ref={errorContainer} tabIndex={-1}>
          {error && <Notice tone="error">{error}</Notice>}
        </div>
        <div className="form-actions">
          <Button type="submit" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  );
}
