import { Pagination } from '@/components/ui/Pagination';
//code mode control: consulta y guardado reales manteniendo la composición visual.
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
import { CategoryForm } from '@/components/categories/CategoryForm';
import { useControlPage } from '@/hooks/administration/useControlPage';

export function CategoriesPage() {
  const definition = adminModules.categories;
  const {
    query,
    canRead,
    canWrite,
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
  } = useControlPage('categories');

  if (!canRead)
    return (
      <Notice tone="error">
        No tienes permiso para consultar este módulo.
      </Notice>
    );

  const columns: DataTableColumn<AdminRecord>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      cell: (record) => display(record, 'nombre'),
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
          disabled={!canWrite}
          variant="ghost"
          aria-label={'Editar ' + display(record, 'nombre')}
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
              disabled={!query.data || !canWrite}
              onClick={(event) => open('new', event.currentTarget.id)}
            >
              <Plus size={18} />
              Crear {definition.singular}
            </Button>
          )
        }
      />
      <p className="demo-disclosure">
        Los cambios se guardan en el sistema y se registran en el historial.
      </p>
      {!canWrite && (
        <p className="muted-text">
          Tu rol permite consultar categorías, pero no crearlas ni modificarlas.
        </p>
      )}
      {saved && (
        <Notice tone="success">Cambios guardados correctamente.</Notice>
      )}
      {query.isPending && (
        <p role="status">
          Cargando {definition.title.toLocaleLowerCase('es')}…
        </p>
      )}
      {query.isError && (
        <Notice tone="error">
          {query.error.message}{' '}
          <Button variant="secondary" onClick={() => query.refetch()}>
            Reintentar
          </Button>
        </Notice>
      )}
      {query.data &&
        (editing && canWrite ? (
          <CategoryForm
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
              {pagination.total} registros
            </p>
            <Pagination
              label={'Paginación de ' + definition.title}
              {...pagination}
            />
            {query.isPlaceholderData ? (
              <p role="status">Cargando registros…</p>
            ) : (
              <DataTable
                caption={definition.title}
                rows={filtered}
                columns={columns}
                getRowId={(record) => record.id}
                emptyState={
                  <EmptyState
                    title={
                      search.trim() || status !== 'all' || records.length
                        ? 'Sin coincidencias'
                        : 'Aún no hay registros'
                    }
                    description={
                      search.trim() || status !== 'all' || records.length
                        ? 'Prueba otro texto o selecciona todos los estados.'
                        : 'Usa Crear categoría para comenzar.'
                    }
                  />
                }
              />
            )}
          </section>
        ))}
    </div>
  );
}
