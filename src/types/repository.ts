import type { DocumentSnapshot, Folder } from './documents';

export type FilePolicy = {
  extensions: readonly string[];
  maxBytes: number;
  maxFiles: number;
  capacityBytes: number | null;
  allowDownloads?: boolean;
  allowReplacement?: boolean;
};

export type RepositorySnapshot = DocumentSnapshot & {
  policy: FilePolicy;
  storageBytes: number;
  summary?: {
    total: number;
    categories: number;
    today: number;
    folders: { id: string | null; total: number }[];
    extensions: string[];
  };
};

export interface RepositoryService {
  getSnapshot(
    permissions: Record<string, boolean>,
    signal?: AbortSignal,
  ): Promise<RepositorySnapshot>;
  createFolder(name: string, parentId: string | null): Promise<Folder>;
  updateFolder(folder: Folder): Promise<void>;
}
