import { ArrowUpRight } from 'lucide-react';
import { FileIcon } from '@/components/documents/FileIcon';
import { formatBytes, formatDate } from '@/lib/format';
import type { Category, DocumentFile } from '@/types/documents';
export function DocumentCollection({
  documents,
  categories,
  view = 'list',
  selectedId,
  onSelect,
}: {
  documents: DocumentFile[];
  categories: Category[];
  view?: 'list' | 'grid';
  selectedId?: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul
      className={`document-collection document-${view}`}
      aria-label="Archivos"
    >
      {documents.map((doc) => (
        <li key={doc.id}>
          <button
            type="button"
            className={`document-item ${selectedId === doc.id ? 'is-selected' : ''}`}
            aria-pressed={selectedId === doc.id}
            aria-label={`Ver detalles de ${doc.title}`}
            onClick={() => onSelect(doc.id)}
          >
            <FileIcon extension={doc.extension} />
            <span className="document-name">
              <strong title={doc.title}>{doc.title}</strong>
              <span>
                {
                  categories.find((category) => category.id === doc.categoryId)
                    ?.name
                }{' '}
                · {doc.extension.toUpperCase()} · {formatBytes(doc.bytes)}
              </span>
            </span>
            <span className="document-date">{formatDate(doc.createdAt)}</span>
            <ArrowUpRight
              size={17}
              className="document-open"
              aria-hidden="true"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
