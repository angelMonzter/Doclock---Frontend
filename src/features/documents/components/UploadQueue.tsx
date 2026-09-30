import { X, CircleAlert } from 'lucide-react';
import { TextField } from '@/components/ui/TextField';
import { FileIcon } from './FileIcon';
import { extensionOf } from '../model';
import { formatBytes } from '@/lib/format';
import type { QueuedFile } from '../hooks/useUploadQueue';
export function UploadQueue({ files, busy, progress, validationVisible, onRemove, onTitle }: {
  files: QueuedFile[]; busy: boolean; progress: number; validationVisible: boolean;
  onRemove: (id: string) => void; onTitle: (id: string, title: string) => void;
}) {
  return <div className="upload-queue"><div className="section-heading"><h3>Archivos en la cola ({files.length})</h3><span className="muted-text">{formatBytes(files.reduce((sum, file) => sum + file.size, 0))}</span></div>
    <ul>{files.map(file => <li key={file.id} className={file.error ? 'queue-invalid' : ''}>
      <div className="queue-file-heading"><FileIcon extension={extensionOf(file.name)} /><div><strong>{file.name}</strong><span>{formatBytes(file.size)} · {file.error ? 'Requiere atención' : busy ? 'Simulando carga…' : 'Listo para confirmar'}</span></div><button className="icon-button" type="button" disabled={busy} onClick={() => onRemove(file.id)} aria-label={`Retirar ${file.name}`}><X size={18} /></button></div>
      {file.error ? <p className="field-error"><CircleAlert size={15} aria-hidden="true" /> {file.error} Retíralo para continuar.</p> : <TextField id={`title-${file.id}`} label={`Título de ${file.name}`} value={file.title} disabled={busy} maxLength={150} error={validationVisible && !file.title.trim() ? 'Escribe un título para este archivo.' : undefined} onChange={event => onTitle(file.id, event.target.value)} />}
      {busy && <progress max={100} value={progress} aria-label={`Progreso simulado de ${file.name}`} />}
    </li>)}</ul>
  </div>;
}
