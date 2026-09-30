import { filePolicy } from '@/config/files';
import { extensionOf, validateFile } from '../model';
import type { DocumentService } from '../types';
import { createSeed } from './seed';

function pause(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
export function createMockDocumentService(): DocumentService {
  let data = createSeed();
  return {
    async getSnapshot() { await pause(180); return structuredClone(data); },
    async createFolder(rawName, parentId) {
      await pause(250);
      const name = rawName.trim();
      if (!name || name.length > 150) throw new Error('Escribe un nombre de entre 1 y 150 caracteres.');
      if (parentId && !data.folders.some(folder => folder.id === parentId)) throw new Error('La carpeta de destino ya no existe.');
      if (data.folders.some(folder => folder.parentId === parentId && folder.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))) throw new Error('Ya existe una carpeta con ese nombre en este destino.');
      const folder = { id: crypto.randomUUID(), name, parentId };
      data.folders.push(folder);
      data.activity.unshift({ id: crypto.randomUUID(), text: `Se creó la carpeta «${name}».`, createdAt: new Date().toISOString() });
      return structuredClone(folder);
    },
    async upload(request, options = {}) {
      if (!request.files.length || request.files.length > filePolicy.maxFiles) throw new Error(`Selecciona entre 1 y ${filePolicy.maxFiles} archivos.`);
      if (request.folderId && !data.folders.some(folder => folder.id === request.folderId)) throw new Error('Selecciona una carpeta válida.');
      if (!data.categories.some(category => category.id === request.categoryId)) throw new Error('Selecciona una categoría.');
      if (request.description.length > 500) throw new Error('La descripción no puede superar 500 caracteres.');
      for (const file of request.files) {
        const error = validateFile(file);
        if (error) throw new Error(`${file.name}: ${error}`);
        if (!file.title.trim() || file.title.trim().length > 150) throw new Error('Cada archivo necesita un título de entre 1 y 150 caracteres.');
      }
      for (let progress = 0; progress <= 100; progress += 20) {
        if (options.signal?.aborted) throw new Error('Carga cancelada. No se guardaron documentos.');
        if (progress > 0) await pause(220);
        if (options.signal?.aborted) throw new Error('Carga cancelada. No se guardaron documentos.');
        if (progress === 60 && options.simulateFailure) throw new Error('Fallo de prueba. Tus archivos siguen en la cola; desactiva la simulación y vuelve a intentarlo.');
        options.onProgress?.(progress);
      }
      const bytes = data.documents.reduce((sum, doc) => sum + doc.bytes, 0) + request.files.reduce((sum, file) => sum + file.size, 0);
      if (bytes > filePolicy.capacityBytes) throw new Error('No hay capacidad suficiente en el repositorio simulado.');
      const createdAt = new Date().toISOString();
      const documents = request.files.map(file => ({ id: crypto.randomUUID(), title: file.title.trim(), originalName: file.name,
        extension: extensionOf(file.name), bytes: file.size, folderId: request.folderId, categoryId: request.categoryId,
        description: request.description.trim(), author: request.author, createdAt }));
      // Commit atómico: abortos y errores no incorporan una parte de la cola.
      data.documents.unshift(...documents);
      data.activity.unshift(...documents.map(doc => ({ id: crypto.randomUUID(), text: `${doc.author} incorporó «${doc.title}».`, createdAt, documentId: doc.id })));
      return structuredClone(documents);
    },
    reset() { data = createSeed(); },
  };
}
export const documentService: DocumentService = createMockDocumentService();
