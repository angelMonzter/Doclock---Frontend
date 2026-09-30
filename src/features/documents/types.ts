export type Folder = { id: string; name: string; parentId: string | null };
export type Category = { id: string; name: string };
export type DocumentFile = {
  id: string; title: string; originalName: string; extension: string; bytes: number;
  folderId: string | null; categoryId: string; description: string; author: string; createdAt: string;
};
export type Activity = { id: string; text: string; createdAt: string; documentId?: string };
export type DocumentSnapshot = { folders: Folder[]; categories: Category[]; documents: DocumentFile[]; activity: Activity[] };
export type UploadItem = { name: string; size: number; title: string };
export type UploadRequest = {
  files: UploadItem[]; folderId: string | null; categoryId: string; description: string; author: string;
};
export type UploadOptions = { signal?: AbortSignal; onProgress?: (progress: number) => void; simulateFailure?: boolean };
export interface DocumentService {
  getSnapshot(): Promise<DocumentSnapshot>;
  createFolder(name: string, parentId: string | null): Promise<Folder>;
  upload(request: UploadRequest, options?: UploadOptions): Promise<DocumentFile[]>;
  reset(): void;
}
