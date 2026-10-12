import { apiRequest } from '@/services/api';
import { readAllPages } from '@/services/pagination';
import type { RepositoryService, RepositorySnapshot } from '@/types/repository';

type CategoryRow = { id_categoria: string; nombre: string; activo: number };
type FolderRow = {
  id_carpeta: string;
  nombre: string;
  sid_carpeta_padre: string | null;
};
type FileTypeRow = { extensiones: string[] | string; activo: number };
export type DocumentRow = {
  id_archivo: string;
  titulo: string;
  nombre_original: string;
  extension: string;
  tamano_bytes: number | string;
  sid_carpeta: string | null;
  sid_categoria: string;
  descripcion: string | null;
  usuario_subida: string | null;
  fecha_subida: string;
};

export const mapDocument = (row: DocumentRow) => ({
  id: row.id_archivo,
  title: row.titulo,
  originalName: row.nombre_original,
  extension: row.extension,
  bytes: Number(row.tamano_bytes),
  folderId: row.sid_carpeta,
  categoryId: row.sid_categoria,
  description: row.descripcion ?? '',
  author: row.usuario_subida ?? 'Usuario no disponible',
  createdAt: /(?:Z|[+-]\d{2}:\d{2})$/.test(row.fecha_subida)
    ? row.fecha_subida
    : row.fecha_subida.replace(' ', 'T') + 'Z',
});
type StorageRow = {
  permitir_descargas?: number;
  permitir_reemplazar_archivos?: number;
  bytes_utilizados: number | string;
  tamano_maximo_efectivo_bytes: number;
  archivos_maximos_efectivos: number;
  almacenamiento_maximo_bytes: number | string | null;
};

export const repositoryService: RepositoryService = {
  async updateFolder(folder) {
    await apiRequest('/carpetas/' + encodeURIComponent(folder.id), {
      method: 'PATCH',
      body: JSON.stringify({
        nombre: folder.name,
        sid_carpeta_padre: folder.parentId,
      }),
    });
  },
  async getSnapshot(permissions, signal) {
    const allowed = (...keys: string[]) => keys.some((key) => permissions[key]);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const dates = new URLSearchParams({
      from: start.toISOString(),
      to: end.toISOString(),
    });
    const [folders, categories, types, rows, storage, summary] =
      await Promise.all([
        allowed(
          'puede_ver_archivos',
          'puede_subir_archivos',
          'puede_editar_archivos',
          'puede_gestionar_carpetas',
        )
          ? readAllPages<FolderRow>('/carpetas', signal)
          : [],
        allowed(
          'puede_ver_archivos',
          'puede_subir_archivos',
          'puede_editar_archivos',
          'puede_gestionar_categorias',
        )
          ? readAllPages<CategoryRow>('/categorias', signal)
          : [],
        allowed(
          'puede_subir_archivos',
          'puede_editar_archivos',
          'puede_gestionar_configuracion',
        )
          ? readAllPages<FileTypeRow>('/tipos-archivo', signal)
          : [],
        permissions.puede_ver_archivos
          ? apiRequest<DocumentRow[]>('/archivos?limit=5&offset=0', { signal })
          : [],
        apiRequest<StorageRow>('/configuracion/archivos/uso', { signal }),
        permissions.puede_ver_archivos
          ? apiRequest<NonNullable<RepositorySnapshot['summary']>>(
              '/archivos/resumen?' + dates,
              { signal },
            )
          : undefined,
      ]);
    const documents = rows.map(mapDocument);
    return {
      summary,
      folders: folders.map((row) => ({
        id: row.id_carpeta,
        name: row.nombre,
        parentId: row.sid_carpeta_padre,
      })),
      categories: categories
        .filter((row) => Number(row.activo) === 1)
        .map((row) => ({
          id: row.id_categoria,
          name: row.nombre,
        })),
      documents,
      activity: documents.slice(0, 5).map((doc) => ({
        id: doc.id,
        documentId: doc.id,
        text: `${doc.author} incorporó «${doc.title}».`,
        createdAt: doc.createdAt,
      })),
      storageBytes: Number(storage.bytes_utilizados),
      policy: {
        ...(storage.permitir_descargas !== undefined
          ? { allowDownloads: Boolean(storage.permitir_descargas) }
          : {}),
        ...(storage.permitir_reemplazar_archivos !== undefined
          ? { allowReplacement: Boolean(storage.permitir_reemplazar_archivos) }
          : {}),
        extensions: [
          ...new Set(
            types
              .filter((row) => Number(row.activo) === 1)
              .flatMap((row): string[] =>
                typeof row.extensiones === 'string'
                  ? JSON.parse(row.extensiones)
                  : row.extensiones,
              ),
          ),
        ],
        maxBytes: Number(storage.tamano_maximo_efectivo_bytes),
        maxFiles: Number(storage.archivos_maximos_efectivos),
        capacityBytes:
          storage.almacenamiento_maximo_bytes === null
            ? null
            : Number(storage.almacenamiento_maximo_bytes),
      },
    };
  },
  async createFolder(rawName, parentId) {
    const name = rawName.trim();
    if (!name || name.length > 150) {
      throw new Error('Escribe un nombre de entre 1 y 150 caracteres.');
    }
    const result = await apiRequest<{ id_carpeta: string }>('/carpetas', {
      method: 'POST',
      body: JSON.stringify({ nombre: name, sid_carpeta_padre: parentId }),
    });
    return { id: result.id_carpeta, name, parentId };
  },
};
