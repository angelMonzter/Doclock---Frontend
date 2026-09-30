import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockDocumentService } from './mockDocumentService';
import { filterDocuments, folderTrail, getSummary, validateFile } from '../model';
import { filePolicy } from '@/config/files';
import type { DocumentService, UploadRequest } from '../types';

let service: DocumentService;
const request: UploadRequest = { files: [{ name: 'Prueba.pdf', size: 1024, title: 'Informe de prueba' }], folderId: 'finance', categoryId: 'report', description: 'Descripción de prueba', author: 'Usuario de prueba' };
beforeEach(() => { vi.useFakeTimers(); service = createMockDocumentService(); });
afterEach(() => vi.useRealTimers());
async function finish<T>(promise: Promise<T>): Promise<T> { await vi.runAllTimersAsync(); return promise; }
describe('repositorio simulado compartido', () => {
  it('incorpora una sola vez y actualiza resumen, actividad y filtros desde la misma fuente', async () => {
    const before = await finish(service.getSnapshot());
    const created = await finish(service.upload(request));
    const after = await finish(service.getSnapshot());
    expect(after.documents.length).toBe(before.documents.length + 1);
    expect(getSummary(after).bytes).toBe(getSummary(before).bytes + 1024);
    expect(after.activity[0].documentId).toBe(created[0].id);
    expect(filterDocuments(after.documents, { folder: 'finance', query: 'informe de prueba', category: 'report', type: 'pdf', sort: 'recent' })).toEqual(created);
    expect(created[0]).not.toHaveProperty('content');
  });
  it('no confirma registros en un fallo parcial y permite reintentar', async () => {
    const before = await finish(service.getSnapshot());
    const rejected = expect(service.upload(request, { simulateFailure: true })).rejects.toThrow('Fallo de prueba');
    await vi.runAllTimersAsync(); await rejected;
    expect((await finish(service.getSnapshot())).documents).toEqual(before.documents);
    await finish(service.upload(request));
    expect((await finish(service.getSnapshot())).documents.length).toBe(before.documents.length + 1);
  });
  it('cancela sin incorporar archivos', async () => {
    const before = await finish(service.getSnapshot()); const controller = new AbortController();
    const rejected = expect(service.upload(request, { signal: controller.signal })).rejects.toThrow('cancelada');
    controller.abort(); await vi.runAllTimersAsync(); await rejected;
    expect((await finish(service.getSnapshot())).documents).toEqual(before.documents);
  });
  it('valida formatos, tamaños y metadatos en el servicio', async () => {
    expect(validateFile({ name: 'archivo.exe', size: 10 })).toBeTruthy();
    expect(validateFile({ name: 'archivo.PDF', size: filePolicy.maxBytes })).toBeNull();
    expect(validateFile({ name: 'archivo.pdf', size: filePolicy.maxBytes + 1 })).toBeTruthy();
    expect(validateFile({ name: 'archivo.pdf', size: 0 })).toBeTruthy();
    await expect(service.upload({ ...request, files: [] })).rejects.toThrow();
    await expect(service.upload({ ...request, categoryId: '' })).rejects.toThrow();
    await expect(service.upload({ ...request, folderId: 'inexistente' })).rejects.toThrow();
    await expect(service.upload({ ...request, files: [{ ...request.files[0], title: ' ' }] })).rejects.toThrow();
  });
  it('crea subcarpetas, rechaza duplicados y permite mismo nombre en otro destino', async () => {
    const folder = await finish(service.createFolder(' Reportes nuevos ', 'finance'));
    const rejected = expect(service.createFolder('REPORTES NUEVOS', 'finance')).rejects.toThrow('Ya existe');
    await vi.runAllTimersAsync(); await rejected;
    await finish(service.createFolder('Reportes nuevos', 'legal'));
    const data = await finish(service.getSnapshot());
    expect(folderTrail(data.folders, folder.id).map(item => item.name)).toEqual(['Finanzas', 'Reportes nuevos']);
  });
  it('entrega snapshots independientes y reset descarta cambios', async () => {
    const data = await finish(service.getSnapshot()); data.documents.length = 0;
    expect((await finish(service.getSnapshot())).documents.length).toBe(8);
    await finish(service.upload(request)); service.reset();
    expect((await finish(service.getSnapshot())).documents.length).toBe(8);
  });
});
