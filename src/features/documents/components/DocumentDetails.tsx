import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { FileIcon } from './FileIcon';
import { formatBytes, formatDate } from '@/lib/format';
import type { DocumentFile, DocumentSnapshot } from '../types';
export function DocumentDetails({ document, data, onClose }: { document: DocumentFile; data: DocumentSnapshot; onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [document.id]);
  return <aside className="document-details panel" aria-labelledby="details-heading" onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
    <div className="section-heading"><h2 id="details-heading" ref={heading} tabIndex={-1}>Detalles del archivo</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar detalles"><X size={20} /></button></div>
    <div className="detail-preview"><FileIcon extension={document.extension} /><span>{document.extension.toUpperCase()}</span></div>
    <h3 className="detail-title">{document.title}</h3><p className="detail-description">{document.description || 'Sin descripción.'}</p>
    <dl className="detail-properties">
      <div><dt>Nombre original</dt><dd>{document.originalName}</dd></div>
      <div><dt>Carpeta</dt><dd>{data.folders.find(folder => folder.id === document.folderId)?.name ?? 'Raíz del repositorio'}</dd></div>
      <div><dt>Categoría</dt><dd>{data.categories.find(category => category.id === document.categoryId)?.name}</dd></div>
      <div><dt>Tamaño</dt><dd>{formatBytes(document.bytes)}</dd></div>
      <div><dt>Incorporado por</dt><dd>{document.author}</dd></div>
      <div><dt>Fecha</dt><dd>{formatDate(document.createdAt)}</dd></div>
    </dl><p className="demo-disclosure">Registro de demostración. No almacenamos contenido; la descarga y la vista previa del archivo no están disponibles.</p>
  </aside>;
}
