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
import { UserForm } from '@/components/users/UserForm';
//code mode usuarios: CRUD real manteniendo la tabla, filtros y formulario actuales.
import { useUsersPage } from '@/hooks/users/useUsersPage';

export function UsersPage() {
  const definition = adminModules.users;
  const {
    query,
    canManage,
    deactivate,
    currentUserId,
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
  } = useUsersPage();

  if (!canManage) {
    return (
      <Notice tone="error">No tienes permiso para gestionar usuarios.</Notice>
    );
  }

  const columns: DataTableColumn<AdminRecord>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      cell: (record) => display(record, 'nombre'),
    },
    {
      id: 'correo',
      header: 'Correo electrónico',
      cell: (record) => display(record, 'correo'),
    },
    {
      id: 'sid_rol',
      header: 'Rol',
      cell: (record) => display(record, 'sid_rol'),
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
        <>
          <Button
            id={'admin-edit-' + record.id}
            variant="ghost"
            aria-label={'Editar ' + display(record, 'nombre')}
            onClick={(event) => open(record, event.currentTarget.id)}
            disabled={deactivate.isPending}
          >
            Editar
          </Button>
          {record.values.activo && (
            <Button
              variant="ghost"
              aria-label={'Desactivar ' + display(record, 'nombre')}
              disabled={deactivate.isPending || record.id === currentUserId}
              onClick={() => {
                if (
                  window.confirm(
                    '¿Desactivar a ' + display(record, 'nombre') + '?',
                  )
                ) {
                  deactivate.mutate(record.id);
                }
              }}
            >
              Desactivar
            </Button>
          )}
        </>
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
              disabled={!query.data || deactivate.isPending}
              onClick={(event) => open('new', event.currentTarget.id)}
            >
              <Plus size={18} />
              Crear {definition.singular}
            </Button>
          )
        }
      />
      <p className="demo-disclosure">
        Administra las cuentas y sus roles. Los cambios se guardan en el
        sistema.
      </p>
      {saved && (
        <Notice tone="success">Cambios guardados correctamente.</Notice>
      )}
      {deactivate.isError && (
        <Notice tone="error">{deactivate.error.message}</Notice>
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
        (editing ? (
          <UserForm
            record={editing === 'new' ? undefined : editing}
            roles={query.data.records.roles}
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
                        : 'Usa Crear usuario para comenzar.'
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
