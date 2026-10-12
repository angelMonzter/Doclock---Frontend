import { apiRequest, ApiError, baseUrl } from '@/services/api';
import {
  getToken,
  setToken,
  sessionExpiredEvent,
} from '@/services/auth/session';
import { readAllPages, readPage } from '@/services/pagination';
import type { DocumentActionsService } from '@/types/documentActions';

//code mode S3: un solo lote HTTP conserva la atomicidad de la API.
export const documentActionsService: DocumentActionsService = {
  versionsPage: (id, request, signal) =>
    readPage(
      '/archivos/' + encodeURIComponent(id) + '/versiones',
      request,
      signal,
    ),
  trashPage: (request, signal) =>
    readPage('/archivos/papelera', request, signal),
  upload(request, signal, progress) {
    const data = new FormData();
    request.files.forEach(({ file }) => data.append('archivos', file));
    data.append(
      'titulos',
      JSON.stringify(request.files.map(({ title }) => title.trim())),
    );
    data.append('sid_categoria', request.categoryId);
    data.append('sid_carpeta', request.folderId ?? '');
    data.append('descripcion', request.description);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = getToken();
      const abort = () => xhr.abort();
      const uncertain =
        'No se recibió confirmación. Revisa Documentos antes de repetir la carga; el servidor podría haberla completado.';
      xhr.open('POST', baseUrl + '/archivos/lote');
      if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable)
          progress(
            Math.min(99, Math.round((event.loaded / event.total) * 100)),
          );
      };
      xhr.onloadend = () => signal.removeEventListener('abort', abort);
      xhr.onerror = () => reject(new ApiError(uncertain, 0));
      xhr.onabort = () =>
        reject(new ApiError('Envío interrumpido. ' + uncertain, 0));
      xhr.onload = () => {
        let result;
        try {
          result = JSON.parse(xhr.responseText);
        } catch {
          reject(new ApiError(uncertain, 502));
          return;
        }
        if (xhr.status === 401 && getToken() === token) {
          setToken(null);
          window.dispatchEvent(new Event(sessionExpiredEvent));
        }
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(
            new ApiError(result.msg || 'No se completó la carga.', xhr.status),
          );
        } else if (!Array.isArray(result.ids)) {
          reject(new ApiError(uncertain, 502));
        } else {
          progress(100);
          resolve(result.ids);
        }
      };
      if (signal.aborted) {
        reject(new ApiError('Carga cancelada antes del envío.', 0));
        return;
      }
      signal.addEventListener('abort', abort, { once: true });
      xhr.send(data);
    });
  },
  async update(doc) {
    await apiRequest('/archivos/' + encodeURIComponent(doc.id), {
      method: 'PATCH',
      body: JSON.stringify({
        titulo: doc.title,
        descripcion: doc.description,
        sid_categoria: doc.categoryId,
        sid_carpeta: doc.folderId,
      }),
    });
  },
  async download(id, versionId) {
    const path =
      '/archivos/' +
      encodeURIComponent(id) +
      (versionId ? '/versiones/' + encodeURIComponent(versionId) : '') +
      '/descarga';
    return (await apiRequest<{ url: string }>(path)).url;
  },
  versions: (id) =>
    readAllPages('/archivos/' + encodeURIComponent(id) + '/versiones'),
  async replace(id, file, comment) {
    const body = new FormData();
    body.append('archivo', file);
    body.append('comentario', comment);
    await apiRequest('/archivos/' + encodeURIComponent(id) + '/versiones', {
      method: 'POST',
      body,
    });
  },
  async restoreVersion(id, versionId) {
    await apiRequest(
      '/archivos/' +
        encodeURIComponent(id) +
        '/versiones/' +
        encodeURIComponent(versionId) +
        '/restaurar',
      { method: 'POST' },
    );
  },
  async trash() {
    const [files, folders] = await Promise.all([
      readAllPages<{ id_archivo: string; titulo: string }>(
        '/archivos?papelera=1',
      ),
      readAllPages<{ id_carpeta: string; nombre: string }>(
        '/carpetas?papelera=1',
      ),
    ]);
    return [
      ...files.map((row) => ({
        id: row.id_archivo,
        name: row.titulo,
        kind: 'archivos' as const,
      })),
      ...folders.map((row) => ({
        id: row.id_carpeta,
        name: row.nombre,
        kind: 'carpetas' as const,
      })),
    ];
  },
  async remove(kind, id) {
    await apiRequest('/' + kind + '/' + encodeURIComponent(id), {
      method: 'DELETE',
    });
  },
  async restore(kind, id) {
    await apiRequest('/' + kind + '/' + encodeURIComponent(id) + '/restaurar', {
      method: 'POST',
    });
  },
};
