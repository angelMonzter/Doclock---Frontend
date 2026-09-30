import { filePolicy } from '@/config/files';
import { formatBytes } from '@/lib/format';
import type { DocumentFile, DocumentSnapshot, Folder, UploadItem } from './types';

export function extensionOf(name: string) { return name.split('.').pop()?.toLowerCase() ?? ''; }
export function validateFile(file: Pick<UploadItem, 'name' | 'size'>): string | null {
  if (!(filePolicy.extensions as readonly string[]).includes(extensionOf(file.name))) return 'Formato no permitido.';
  if (file.size <= 0) return 'El archivo está vacío.';
  if (file.size > filePolicy.maxBytes) return `Supera el límite de ${formatBytes(filePolicy.maxBytes)}.`;
  return null;
}
export function getSummary(data: DocumentSnapshot) {
  const today = new Date().toDateString();
  return { total: data.documents.length, categories: new Set(data.documents.map(doc => doc.categoryId)).size,
    bytes: data.documents.reduce((sum, doc) => sum + doc.bytes, 0),
    today: data.documents.filter(doc => new Date(doc.createdAt).toDateString() === today).length };
}
export function folderTrail(folders: Folder[], id: string | null): Folder[] {
  const trail: Folder[] = []; const visited = new Set<string>();
  while (id && !visited.has(id)) {
    visited.add(id); const folder = folders.find(item => item.id === id);
    if (!folder) break; trail.unshift(folder); id = folder.parentId;
  }
  return trail;
}
export function filterDocuments(documents: DocumentFile[], filters: { folder: string | null; query: string; category: string; type: string; sort: string }) {
  const query = filters.query.trim().toLocaleLowerCase('es');
  return documents.filter(doc => (!filters.folder || doc.folderId === filters.folder)
    && (!query || `${doc.title} ${doc.originalName}`.toLocaleLowerCase('es').includes(query))
    && (!filters.category || doc.categoryId === filters.category)
    && (!filters.type || doc.extension === filters.type))
    .sort((a, b) => filters.sort === 'name' ? a.title.localeCompare(b.title, 'es') : b.createdAt.localeCompare(a.createdAt));
}
