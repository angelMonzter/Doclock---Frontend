import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, Check, CircleCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Notice } from '@/components/ui/Notice';
import { useAuth } from '@/features/auth/AuthProvider';
import { useDocuments } from '../hooks/useDocuments';
import { useUploadQueue } from '../hooks/useUploadQueue';
import { RepositoryState } from '../components/RepositoryState';
import { UploadDropzone } from '../components/UploadDropzone';
import { UploadQueue } from '../components/UploadQueue';
import { folderTrail } from '../model';
import { filePolicy } from '@/config/files';

export function UploadPage() {
  const query = useDocuments(); const queue = useUploadQueue(); const { user } = useAuth();
  const [params] = useSearchParams();
  const [destination, setDestination] = useState(params.get('carpeta') ?? '');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [validate, setValidate] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const errorHeading = useRef<HTMLDivElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (queue.error) errorHeading.current?.focus(); }, [queue.error]);
  useEffect(() => { if (queue.result.length) successHeading.current?.focus(); }, [queue.result.length]);
  if (!query.data) return <RepositoryState error={query.error} retry={() => { void query.refetch(); }} />;
  const data = query.data;
  const validDestination = !destination || data.folders.some(folder => folder.id === destination);
  const returnPath = `/documentos${destination && validDestination ? `?carpeta=${destination}` : ''}`;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setValidate(true);
    const invalidTitle = queue.files.find(file => !file.error && !file.title.trim());
    if (!queue.files.length || queue.files.some(file => file.error)) { errorHeading.current?.focus(); return; }
    if (invalidTitle) { document.getElementById(`title-${invalidTitle.id}`)?.focus(); return; }
    if (!validDestination) { document.getElementById('upload-destination')?.focus(); return; }
    if (!category) { document.getElementById('upload-category')?.focus(); return; }
    await queue.submit({ folderId: destination || null, categoryId: category, description, author: user!.name }, simulateFailure);
  }
  return <>
    <Link to={returnPath} className="back-link"><ArrowLeft size={16} /> Volver a documentos</Link>
    <PageHeader title="Un nuevo lugar para tus archivos" description="Selecciona tus documentos, organízalos y confirma su incorporación." />
    <ol className="upload-steps" aria-label="Etapas de la carga"><li className="step-active"><span>{queue.result.length ? <Check size={16} /> : '1'}</span>Seleccionar archivos</li><li className={queue.files.length ? 'step-active' : ''}><span>{queue.result.length ? <Check size={16} /> : '2'}</span>Organizar</li><li className={queue.result.length ? 'step-active' : ''}><span>{queue.result.length ? <Check size={16} /> : '3'}</span>Confirmar</li></ol>
    {queue.result.length ? <section className="panel upload-success"><CircleCheck size={44} strokeWidth={1.5} aria-hidden="true" /><h2 ref={successHeading} tabIndex={-1}>{queue.result.length} {queue.result.length === 1 ? 'archivo incorporado' : 'archivos incorporados'}</h2><p>Ya puedes ver los registros en Documentos y en el resumen de Inicio.</p><Notice tone="success">Simulación completada. Se guardaron solo metadatos en memoria; ningún archivo se envió a un servidor.</Notice><ul>{queue.result.map(file => <li key={file.id}>{file.title}</li>)}</ul><div className="form-actions"><Button asChild><Link to={returnPath}>Ver documentos <ArrowRight size={17} /></Link></Button><Button variant="secondary" onClick={() => { queue.reset(); setValidate(false); setSimulateFailure(false); }}>Subir más archivos</Button></div></section> : <form onSubmit={submit} noValidate aria-busy={queue.busy} className="upload-form">
      <section className="panel"><div className="section-heading"><div><h2>Selecciona tus documentos</h2><p>Hasta {filePolicy.maxFiles} archivos por operación. No se enviará su contenido.</p></div><span className="count-label">Demo local</span></div>
        <UploadDropzone disabled={queue.busy} onFiles={queue.addFiles} />
        {queue.feedback && <Notice>{queue.feedback}</Notice>}
        <div ref={errorHeading} tabIndex={-1} className="upload-error-focus">
          {validate && !queue.files.length && <Notice tone="error">Selecciona al menos un archivo para continuar.</Notice>}
          {validate && queue.files.some(file => file.error) && <Notice tone="error">Retira los archivos inválidos de la cola para continuar.</Notice>}
          {queue.error && <Notice tone="error">{queue.error}</Notice>}
        </div>
        {!!queue.files.length && <UploadQueue files={queue.files} busy={queue.busy} progress={queue.progress} validationVisible={validate} onRemove={queue.remove} onTitle={queue.updateTitle} />}
      </section>
      <section className="panel metadata-panel"><div className="section-heading"><div><h2>Organiza la selección</h2><p>Este destino y categoría se aplican a todos los archivos de la cola.</p></div></div>
        <fieldset disabled={queue.busy} className="metadata-fields">
          <label htmlFor="upload-destination">Carpeta de destino<select id="upload-destination" value={destination} onChange={event => setDestination(event.target.value)} aria-invalid={!validDestination} aria-describedby={!validDestination ? 'destination-error' : undefined}><option value="">Raíz del repositorio</option>{!validDestination && <option value={destination}>Carpeta no disponible</option>}{data.folders.map(folder => <option key={folder.id} value={folder.id}>{folderTrail(data.folders, folder.id).map(item => item.name).join(' / ')}</option>)}</select>{!validDestination && <span id="destination-error" className="field-error">Selecciona otra carpeta: este destino ya no existe.</span>}</label>
          <label htmlFor="upload-category">Categoría <span className="required-label">(obligatoria)</span><select id="upload-category" value={category} onChange={event => setCategory(event.target.value)} aria-invalid={validate && !category} aria-describedby={validate && !category ? 'category-error' : undefined}><option value="">Selecciona una categoría</option>{data.categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{validate && !category && <span className="field-error" id="category-error">Selecciona una categoría.</span>}</label>
          <label className="description-field" htmlFor="upload-description">Descripción <span className="required-label">(opcional)</span><textarea id="upload-description" rows={3} maxLength={500} value={description} onChange={event => setDescription(event.target.value)} placeholder="Agrega contexto para encontrar estos documentos después." /><span className="field-hint">{description.length}/500 caracteres</span></label>
        </fieldset>
        <details className="demo-tools"><summary>Opciones de prueba</summary><label><input type="checkbox" checked={simulateFailure} disabled={queue.busy} onChange={event => setSimulateFailure(event.target.checked)} /> Simular un fallo para probar la recuperación</label></details>
        <p className="demo-disclosure">Carga simulada. Al salir de esta pantalla se descarta la cola pendiente; los registros confirmados permanecen hasta recargar o cerrar sesión.</p>
        <div className="upload-submit-row"><p role="status">{queue.busy ? `Simulando carga: ${queue.progress}%` : `Archivos pendientes de confirmar: ${queue.files.length}`}</p><div className="form-actions">{queue.busy && <Button variant="secondary" onClick={queue.cancel}>Cancelar carga</Button>}<Button type="submit" disabled={queue.busy}><Upload size={17} />{queue.busy ? 'Incorporando…' : `Subir ${queue.files.length || ''} ${queue.files.length === 1 ? 'archivo' : 'archivos'}`}</Button></div></div>
      </section>
    </form>}
  </>;
}

