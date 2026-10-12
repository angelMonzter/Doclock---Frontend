import { Pagination } from '@/components/ui/Pagination';
import { Plus } from 'lucide-react';
import { adminModules } from '@/config/administration';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/Notice';
import { TextField } from '@/components/ui/TextField';
import { SelectField } from '@/components/ui/SelectField';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import type { AdminRecord } from '@/types/administration';
import { FileTypeForm } from '@/components/fileTypes/FileTypeForm';
import { useAdministrationPage } from '@/hooks/administration/useAdministrationPage';

export function FileTypesPage() {
  const definition = adminModules.fileTypes;
  const {
    query,
    records,
    filtered,
    pagination,
    search,
    setSearch,
    status,
    setStatus,
    display,
    editing,
    saved,
    open,
    close,
    finishSaving,
  } = useAdministrationPage('fileTypes');

  const columns: DataTableColumn<AdminRecord>[] = [
    {
      id: 'tipo_mime',
      header: 'Tipo MIME',
      cell: (record) => display(record, 'tipo_mime'),
    },
    {
      id: 'descripcion',
      header: 'Descripción',
      cell: (record) => display(record, 'descripcion'),
    },
    {
      id: 'activo',
      header: 'Activo',
      cell: (record) => (
        <span className="admin-status">{display(record, 'activo')}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: (record) => (
        <Button
          id={'admin-edit-' + record.id}
          variant="ghost"
          aria-label={'Editar ' + display(record, 'tipo_mime')}
          onClick={(event) => open(record, event.currentTarget.id)}
        >
          Editar
        </Button>
      ),
    },
  ];

  return (
    <div className="admin-module">
      <PageHeader
        title={definition.title}
        description={definition.description}
        action={
          !editing && (
            <Button
              id="admin-create"
              disabled={!query.data}
              onClick={(event) => open('new', event.currentTarget.id)}
            >
              <Plus size={18} />
              Crear {definition.singular}
            </Button>
          )
        }
      />
      <p className="demo-disclosure">
        Administración de prueba. Los cambios se conservan durante esta sesión
        de la página y se reinician al recargar o cerrar sesión. No modifican
        las pantallas documentales ni sus políticas actuales.
      </p>
      {saved && (
        <Notice tone="success">
          Cambios guardados en la demo. Puedes consultar el movimiento en
          Historial.
        </Notice>
      )}
      {query.isPending && (
        <p role="status">
          Cargando {definition.title.toLocaleLowerCase('es')}…
        </p>
      )}
      {query.isError && (
        <Notice tone="error">
          No se pudo cargar el módulo.{' '}
          <Button variant="secondary" onClick={() => query.refetch()}>
            Reintentar
          </Button>
        </Notice>
      )}
      {query.data &&
        (editing ? (
          <FileTypeForm
            record={editing === 'new' ? undefined : editing}
            onClose={close}
            onSaved={finishSaving}
          />
        ) : (
          <section className="panel admin-list">
            <div className="admin-toolbar">
              <TextField
                label={'Buscar en ' + definition.title.toLocaleLowerCase('es')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <SelectField
                label="Estado"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </SelectField>
            </div>
            <p className="muted-text" role="status">
              {pagination.total} de {records.length} registros
            </p>
            <Pagination
              label={'Paginación de ' + definition.title}
              {...pagination}
            />
            <DataTable
              caption={definition.title}
              rows={filtered}
              columns={columns}
              getRowId={(record) => record.id}
              emptyState={
                <EmptyState
                  title={
                    records.length
                      ? 'Sin coincidencias'
                      : 'Aún no hay registros'
                  }
                  description={
                    records.length
                      ? 'Prueba otro texto o selecciona todos los estados.'
                      : 'Usa Crear tipo de archivo para comenzar.'
                  }
                />
              }
            />
          </section>
        ))}
    </div>
  );
}
