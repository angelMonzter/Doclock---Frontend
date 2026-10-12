// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { documentActionsService } from './documentActionsService';
import { getToken, setToken } from '@/services/auth/session';

//code mode S3: pruebas de transporte sin escribir en AWS ni MySQL.
let xhr: FakeXHR;
class FakeXHR {
  status = 201;
  responseText = JSON.stringify({ ids: ['ARCHIVO001', 'ARCHIVO002'] });
  upload: {
    onprogress?: (event: {
      lengthComputable: boolean;
      loaded: number;
      total: number;
    }) => void;
  } = {};
  onload?: () => void;
  onloadend?: () => void;
  onabort?: () => void;
  onerror?: () => void;
  headers: Record<string, string> = {};
  body?: FormData;
  url = '';
  constructor() {
    xhr = this;
  }
  open(method: string, url: string) {
    expect(method).toBe('POST');
    this.url = url;
  }
  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }
  send(body: FormData) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
    this.onloadend?.();
  }
}
const request = () => ({
  files: [
    { file: new File(['%PDF'], 'uno.pdf'), title: 'Uno' },
    { file: new File(['%PDF'], 'dos.pdf'), title: 'Dos' },
  ],
  folderId: 'CARPETA001',
  categoryId: 'CATEGORIA1',
  description: 'Lote',
});
beforeEach(() => {
  setToken('s3-test');
  vi.stubGlobal('XMLHttpRequest', FakeXHR);
});
afterEach(() => {
  setToken(null);
  vi.unstubAllGlobals();
});

it('envía archivos binarios y títulos individuales en una petición autenticada', async () => {
  const progress = vi.fn();
  const result = documentActionsService.upload(
    request(),
    new AbortController().signal,
    progress,
  );
  expect(xhr.url).toBe('/api/archivos/lote');
  expect(xhr.headers).toEqual({ Authorization: 'Bearer s3-test' });
  expect(xhr.body?.getAll('archivos')).toHaveLength(2);
  expect(xhr.body?.get('titulos')).toBe('["Uno","Dos"]');
  xhr.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 });
  expect(progress).toHaveBeenLastCalledWith(99);
  xhr.onload?.();
  xhr.onloadend?.();
  await expect(result).resolves.toEqual(['ARCHIVO001', 'ARCHIVO002']);
  expect(progress).toHaveBeenLastCalledWith(100);
});

it('cancelar advierte que debe verificarse el resultado antes de reintentar', async () => {
  const controller = new AbortController();
  const result = documentActionsService.upload(
    request(),
    controller.signal,
    vi.fn(),
  );
  controller.abort();
  await expect(result).rejects.toThrow('Revisa Documentos');
});

it('rechaza respuesta fallida y limpia sesión vencida', async () => {
  const result = documentActionsService.upload(
    request(),
    new AbortController().signal,
    vi.fn(),
  );
  xhr.status = 401;
  xhr.responseText = JSON.stringify({ msg: 'Token vencido' });
  xhr.onload?.();
  xhr.onloadend?.();
  await expect(result).rejects.toThrow('Token vencido');
  expect(getToken()).toBeNull();
});

it('reemplazo usa multipart sin forzar Content-Type JSON', async () => {
  const fetcher = vi.fn(
    async () => new Response(JSON.stringify({ msg: 'Guardado' })),
  );
  vi.stubGlobal('fetch', fetcher);
  await documentActionsService.replace(
    'ARCHIVO001',
    new File(['%PDF'], 'revision.pdf'),
    'Corrección',
  );
  const init = (fetcher.mock.calls[0] as unknown as [string, RequestInit])[1];
  expect(init.body).toBeInstanceOf(FormData);
  expect(new Headers(init.headers).has('Content-Type')).toBe(false);
});
