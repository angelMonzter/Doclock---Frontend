import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FilePolicy } from '@/types/repository';
import { formatBytes } from '@/lib/format';
export function UploadDropzone({
  disabled,
  policy,
  onFiles,
}: {
  disabled: boolean;
  policy: FilePolicy;
  onFiles: (files: FileList) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  return (
    <div
      className={`upload-dropzone ${dragging ? 'is-dragging' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current++;
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => {
        dragDepth.current--;
        if (dragDepth.current <= 0) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        if (!disabled) onFiles(event.dataTransfer.files);
      }}
    >
      <Upload size={30} strokeWidth={1.5} aria-hidden="true" />
      <h3>Arrastra tus archivos hasta aquí</h3>
      <p>O selecciónalos desde tu equipo.</p>
      <input
        ref={input}
        className="sr-only"
        tabIndex={-1}
        type="file"
        multiple
        disabled={disabled}
        accept={policy.extensions.map((ext) => `.${ext}`).join(',')}
        aria-label="Seleccionar archivos desde tu equipo"
        onChange={(event) => {
          if (event.target.files) onFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <Button
        variant="secondary"
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        Seleccionar archivos
      </Button>
      <span>
        {policy.extensions.join(', ').toUpperCase()} · Hasta{' '}
        {formatBytes(policy.maxBytes)} por archivo
      </span>
    </div>
  );
}
