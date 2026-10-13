import type { DocumentFile } from './documents';
import type { PageRequest, PageResult } from './pagination';

//code mode S3
export type RealUpload = {
  files: { file: File; title: string }[];
  folderId: string | null;
  categoryId: string;
  description: string;
};
export type Version = {
  id_version: string;
  numero_version: number;
  nombre_original: string;
  tamano_bytes: number;
  comentario: string | null;
};
export type TrashItem = {
  id: string;
  name: string;
  kind: 'archivos' | 'carpetas';
};
export type TrashPage = PageResult<TrashItem> & { pendientes?: number };
export type EmptyTrashResult = {
  eliminados: number;
  pendientes: number;
  msg: string;
};
export interface DocumentActionsService {
  emptyTrash(pendingOnly?: boolean): Promise<EmptyTrashResult>;
  versionsPage(
    id: string,
    request: PageRequest,
    signal?: AbortSignal,
  ): Promise<PageResult<Version>>;
  trashPage(request: PageRequest, signal?: AbortSignal): Promise<TrashPage>;
  upload(
    request: RealUpload,
    signal: AbortSignal,
    progress: (value: number) => void,
  ): Promise<string[]>;
  update(document: DocumentFile): Promise<void>;
  download(id: string, versionId?: string): Promise<string>;
  versions(id: string): Promise<Version[]>;
  replace(id: string, file: File, comment: string): Promise<void>;
  restoreVersion(id: string, versionId: string): Promise<void>;
  trash(): Promise<TrashItem[]>;
  remove(kind: TrashItem['kind'], id: string): Promise<void>;
  restore(kind: TrashItem['kind'], id: string): Promise<void>;
}
