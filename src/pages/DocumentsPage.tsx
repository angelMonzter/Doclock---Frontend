import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  ChevronRight,
  FolderClosed,
  FolderPlus,
  Grid2X2,
  List,
  Plus,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/TextField';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Notice } from '@/components/ui/Notice';
import { useDocuments } from '@/hooks/documents/useDocuments';
import { filterDocuments, folderTrail } from '@/models/documents';
import { RepositoryState } from '@/components/documents/RepositoryState';
import { DocumentCollection } from '@/components/documents/DocumentCollection';
import { DocumentDetails } from '@/components/documents/DocumentDetails';
import { CreateFolderForm } from '@/components/documents/CreateFolderForm';
import { filePolicy } from '@/config/files';

export function DocumentsPage() {
  const query = useDocuments();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const trigger = useRef<HTMLElement | null>(null);
  const newFolderButton = useRef<HTMLButtonElement>(null);
  const folderId = params.get('carpeta');
  const selectedId = params.get('documento');
  useEffect(() => {
    setCreating(false);
    setMessage('');
  }, [folderId]);
  function change(key: string, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        value ? next.set(key, value) : next.delete(key);
        return next;
      },
      { replace: true },
    );
  }
  function select(id: string) {
    trigger.current = document.activeElement as HTMLElement;
    change('documento', id);
  }
  function closeDetails() {
    change('documento', '');
    requestAnimationFrame(() =>
      trigger.current?.isConnected
        ? trigger.current.focus()
        : document.querySelector<HTMLElement>('[data-page-heading]')?.focus(),
    );
  }
  function closeCreation() {
    setCreating(false);
    requestAnimationFrame(() => newFolderButton.current?.focus());
  }
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
  const folder = data.folders.find((item) => item.id === folderId);
  const invalidFolder = !!folderId && !folder;
  const trail = folderTrail(data.folders, folderId);
  const search = params.get('q') ?? '';
  const category = params.get('categoria') ?? '';
  const type = params.get('tipo') ?? '';
  const sort = params.get('orden') ?? 'recent';
  const view = params.get('vista') === 'grid' ? 'grid' : 'list';
  const documents = invalidFolder
    ? []
    : filterDocuments(data.documents, {
        folder: folderId,
        query: search,
        category,
        type,
        sort,
      });
  const folders = data.folders.filter(
    (item) =>
      item.parentId === folderId &&
      item.name
        .toLocaleLowerCase('es')
        .includes(search.trim().toLocaleLowerCase('es')),
  );
  const selected = data.documents.find((item) => item.id === selectedId);
  return (
    <>
      <PageHeader
        title="Documentos"
        description="Cada archivo en su lugar. Encuentra lo que necesitas."
        action={
          <Button asChild>
            <Link to={`/subir${folder ? `?carpeta=${folder.id}` : ''}`}>
              <Plus size={18} /> Subir archivos
            </Link>
          </Button>
        }
      />
      <nav className="breadcrumbs" aria-label="Ruta de carpetas">
        <Link to="/documentos">Todos los documentos</Link>
        {trail.map((item, index) => (
          <span key={item.id}>
            <ChevronRight size={14} aria-hidden="true" />
            {index === trail.length - 1 ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <Link to={`/documentos?carpeta=${item.id}`}>{item.name}</Link>
            )}
          </span>
        ))}
      </nav>
      {invalidFolder && (
        <Notice tone="error">
          Esta carpeta no existe o se reinició al recargar.{' '}
          <Link to="/documentos">Volver al repositorio.</Link>
        </Notice>
      )}
      {selectedId && !selected && (
        <Notice>
          El documento ya no está disponible. Los registros de prueba se
          reinician al recargar.{' '}
          <button type="button" className="text-link" onClick={closeDetails}>
            Cerrar aviso
          </button>
        </Notice>
      )}
      {message && <Notice tone="success">{message}</Notice>}
      <div className={`explorer-layout ${selected ? 'with-details' : ''}`}>
        <div className="explorer-main">
          <section
            className="panel explorer-controls"
            aria-label="Buscar y filtrar documentos"
          >
            <TextField
              label="Buscar documentos o carpetas"
              type="search"
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(event) => change('q', event.target.value)}
              leadingIcon={<Search size={18} />}
            />
            <div className="filter-row">
              <label>
                Categoría
                <select
                  value={category}
                  onChange={(event) => change('categoria', event.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {data.categories.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Formato
                <select
                  value={type}
                  onChange={(event) => change('tipo', event.target.value)}
                >
                  <option value="">Todos los formatos</option>
                  {filePolicy.extensions.map((ext) => (
                    <option value={ext} key={ext}>
                      {ext.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Orden
                <select
                  value={sort}
                  onChange={(event) => change('orden', event.target.value)}
                >
                  <option value="recent">Más recientes</option>
                  <option value="name">Nombre A–Z</option>
                </select>
              </label>
              <div
                className="view-switch"
                role="group"
                aria-label="Vista de documentos"
              >
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Vista de lista"
                  aria-pressed={view === 'list'}
                  onClick={() => change('vista', 'list')}
                >
                  <List size={19} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Vista de cuadrícula"
                  aria-pressed={view === 'grid'}
                  onClick={() => change('vista', 'grid')}
                >
                  <Grid2X2 size={19} />
                </button>
              </div>
            </div>
          </section>
          {!invalidFolder && (
            <section className="folders-section">
              <div className="section-heading">
                <h2>
                  {folder ? `Carpetas en ${folder.name}` : 'Tus carpetas'}
                </h2>
                <Button
                  variant="secondary"
                  ref={newFolderButton}
                  onClick={() => {
                    setCreating(!creating);
                    setMessage('');
                  }}
                  aria-expanded={creating}
                >
                  <FolderPlus size={17} /> Nueva carpeta
                </Button>
              </div>
              {creating && (
                <CreateFolderForm
                  parentId={folderId}
                  onClose={closeCreation}
                  onCreated={(name) => {
                    setMessage(`Carpeta «${name}» creada.`);
                    closeCreation();
                  }}
                />
              )}
              <div className="folder-grid">
                {folders.map((item) => (
                  <Link
                    className="folder-tile"
                    key={item.id}
                    to={`/documentos?carpeta=${item.id}`}
                  >
                    <FolderClosed size={26} strokeWidth={1.5} />
                    <strong>{item.name}</strong>
                    <span>
                      Archivos directos:{' '}
                      {
                        data.documents.filter((doc) => doc.folderId === item.id)
                          .length
                      }
                    </span>
                    <ChevronRight className="folder-chevron" size={16} />
                  </Link>
                ))}
              </div>
              {!folders.length && (
                <p className="muted-text">
                  {search
                    ? 'No hay carpetas con ese nombre en este destino.'
                    : 'Este destino todavía no contiene subcarpetas.'}
                </p>
              )}
            </section>
          )}
          <section className="panel files-panel">
            <div className="section-heading">
              <h2>
                {folder ? `Archivos en ${folder.name}` : 'Todos los archivos'}
              </h2>
              <span className="count-label" aria-live="polite">
                {documents.length}{' '}
                {documents.length === 1 ? 'resultado' : 'resultados'}
              </span>
            </div>
            {documents.length ? (
              <DocumentCollection
                documents={documents}
                categories={data.categories}
                view={view}
                selectedId={selectedId}
                onSelect={select}
              />
            ) : (
              <EmptyState
                title={
                  search || category || type
                    ? 'No encontramos coincidencias'
                    : 'Un espacio por llenar'
                }
                description={
                  search || category || type
                    ? 'Prueba otro nombre o elimina los filtros.'
                    : 'Sube el primer documento a esta carpeta.'
                }
                action={
                  search || category || type ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setParams(folderId ? { carpeta: folderId } : {})
                      }
                    >
                      Limpiar filtros
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link
                        to={`/subir${folder ? `?carpeta=${folder.id}` : ''}`}
                      >
                        Subir archivos
                      </Link>
                    </Button>
                  )
                }
              />
            )}
          </section>
        </div>
        {selected && (
          <DocumentDetails
            document={selected}
            data={data}
            onClose={closeDetails}
          />
        )}
      </div>
    </>
  );
}
