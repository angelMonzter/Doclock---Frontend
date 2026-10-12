import { SelectField } from '@/components/ui/SelectField';
import { TextareaField } from '@/components/ui/TextareaField';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Notice } from '@/components/ui/Notice';
import { useAuth } from '@/providers/AuthProvider';
import { useDocuments } from '@/hooks/documents/useDocuments';
import { useUploadQueue } from '@/hooks/documents/useUploadQueue';
import { RepositoryState } from '@/components/documents/RepositoryState';
import { UploadDropzone } from '@/components/documents/UploadDropzone';
import { UploadQueue } from '@/components/documents/UploadQueue';
import { folderTrail } from '@/models/documents';

export function UploadPage() {
  const query = useDocuments();
  const queue = useUploadQueue();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [destination, setDestination] = useState(params.get('carpeta') ?? '');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [validate, setValidate] = useState(false);
  const errorHeading = useRef<HTMLDivElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (queue.error) errorHeading.current?.focus();
  }, [queue.error]);
  useEffect(() => {
    if (queue.result.length) successHeading.current?.focus();
  }, [queue.result.length]);
  if (!query.data)
    return (
      <RepositoryState
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const data = query.data;
  const policy = data.policy;
  const disabled =
    queue.busy || query.isError || !user?.permissions.puede_subir_archivos;
  const validDestination =
    !destination || data.folders.some((folder) => folder.id === destination);
  const returnPath = `/documentos${destination && validDestination ? `?carpeta=${destination}` : ''}`;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    setValidate(true);
    const invalidTitle = queue.files.find(
      (file) => !file.error && !file.title.trim(),
    );
    if (!queue.files.length || queue.files.some((file) => file.error)) {
      errorHeading.current?.focus();
      return;
    }
    if (invalidTitle) {
      document.getElementById(`title-${invalidTitle.id}`)?.focus();
      return;
    }
    if (!validDestination) {
      document.getElementById('upload-destination')?.focus();
      return;
    }
    if (!data.categories.some((item) => item.id === category)) {
      document.getElementById('upload-category')?.focus();
      return;
    }
    await queue.submit({
      folderId: destination || null,
      categoryId: category,
      description,
      author: user!.name,
    });
  }
  return (
    <>
      <Link to={returnPath} className="back-link">
        <ArrowLeft size={16} /> Volver a documentos
      </Link>
      <PageHeader
        title="Un nuevo lugar para tus archivos"
        description="Selecciona tus documentos, organízalos y confirma su incorporación."
      />
      <ol className="upload-steps" aria-label="Etapas de la carga">
        <li className="step-active">
          <span>{queue.result.length ? <Check size={16} /> : '1'}</span>
          Seleccionar archivos
        </li>
        <li className={queue.files.length ? 'step-active' : ''}>
          <span>{queue.result.length ? <Check size={16} /> : '2'}</span>
          Organizar
        </li>
        <li className={queue.result.length ? 'step-active' : ''}>
          <span>{queue.result.length ? <Check size={16} /> : '3'}</span>
          Confirmar
        </li>
      </ol>
      {queue.result.length ? (
        <section className="panel upload-success">
          <CircleCheck size={44} strokeWidth={1.5} aria-hidden="true" />
          <h2 ref={successHeading} tabIndex={-1}>
            {queue.result.length}{' '}
            {queue.result.length === 1
              ? 'archivo incorporado'
              : 'archivos incorporados'}
          </h2>
          <p>Los archivos se guardaron en el repositorio.</p>
          <Notice tone="success">
            Carga confirmada. Los documentos están disponibles en el sistema.
          </Notice>
          <ul>
            {queue.result.map((file) => (
              <li key={file.id}>{file.title}</li>
            ))}
          </ul>
          <div className="form-actions">
            <Button asChild>
              <Link to={returnPath}>
                Ver documentos <ArrowRight size={17} />
              </Link>
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                queue.reset();
                setValidate(false);
              }}
            >
              Subir más archivos
            </Button>
          </div>
        </section>
      ) : (
        <form
          onSubmit={submit}
          noValidate
          aria-busy={queue.busy}
          className="upload-form"
        >
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Selecciona tus documentos</h2>
                <p>Hasta {policy.maxFiles} archivos por operación.</p>
              </div>
              <span className="count-label">Carga de archivos</span>
            </div>
            <UploadDropzone
              policy={policy}
              disabled={disabled || !policy.extensions.length}
              onFiles={queue.addFiles}
            />
            {query.isError && (
              <Notice tone="error">{query.error.message}</Notice>
            )}
            {!user?.permissions.puede_subir_archivos && (
              <Notice>No tienes permiso para subir archivos.</Notice>
            )}
            {!policy.extensions.length && (
              <Notice>No hay tipos de archivo activos permitidos.</Notice>
            )}
            {queue.feedback && <Notice>{queue.feedback}</Notice>}
            <div
              ref={errorHeading}
              tabIndex={-1}
              className="upload-error-focus"
            >
              {validate && !queue.files.length && (
                <Notice tone="error">
                  Selecciona al menos un archivo para continuar.
                </Notice>
              )}
              {validate && queue.files.some((file) => file.error) && (
                <Notice tone="error">
                  Retira los archivos inválidos de la cola para continuar.
                </Notice>
              )}
              {queue.error && <Notice tone="error">{queue.error}</Notice>}
            </div>
            {!!queue.files.length && (
              <UploadQueue
                files={queue.files}
                busy={queue.busy}
                progress={queue.progress}
                validationVisible={validate}
                onRemove={queue.remove}
                onTitle={queue.updateTitle}
              />
            )}
          </section>
          <section className="panel metadata-panel">
            <div className="section-heading">
              <div>
                <h2>Organiza la selección</h2>
                <p>
                  Este destino y categoría se aplican a todos los archivos de la
                  cola.
                </p>
              </div>
            </div>
            <fieldset disabled={disabled} className="metadata-fields">
              <SelectField
                label="Carpeta de destino"
                id="upload-destination"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                error={
                  !validDestination
                    ? 'Selecciona otra carpeta: este destino ya no existe.'
                    : undefined
                }
              >
                <option value="">Raíz del repositorio</option>
                {!validDestination && (
                  <option value={destination}>Carpeta no disponible</option>
                )}
                {data.folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folderTrail(data.folders, folder.id)
                      .map((item) => item.name)
                      .join(' / ')}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label={
                  <>
                    Categoría{' '}
                    <span className="required-label">(obligatoria)</span>
                  </>
                }
                id="upload-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                error={
                  validate &&
                  !data.categories.some((item) => item.id === category)
                    ? 'Selecciona una categoría.'
                    : undefined
                }
              >
                <option value="">Selecciona una categoría</option>
                {data.categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </SelectField>
              <TextareaField
                label={
                  <>
                    Descripción{' '}
                    <span className="required-label">(opcional)</span>
                  </>
                }
                id="upload-description"
                rows={3}
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Agrega contexto para encontrar estos documentos después."
                containerClassName="description-field"
                hint={<>{description.length}/500 caracteres</>}
              />
            </fieldset>
            <p className="demo-disclosure">
              Los archivos se confirman juntos. Si se pierde la conexión, revisa
              Documentos antes de repetir el envío.
            </p>
            <div className="upload-submit-row">
              <p role="status">
                {queue.busy
                  ? queue.progress >= 99
                    ? 'Confirmando almacenamiento…'
                    : `Enviando archivos: ${queue.progress}%`
                  : `Archivos pendientes de confirmar: ${queue.files.length}`}
              </p>
              <div className="form-actions">
                {queue.busy && (
                  <Button variant="secondary" onClick={queue.cancel}>
                    Cancelar carga
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={disabled || !policy.extensions.length}
                >
                  <Upload size={17} />
                  {queue.busy
                    ? 'Incorporando…'
                    : `Subir ${queue.files.length || ''} ${queue.files.length === 1 ? 'archivo' : 'archivos'}`}
                </Button>
              </div>
            </div>
          </section>
        </form>
      )}
    </>
  );
}
