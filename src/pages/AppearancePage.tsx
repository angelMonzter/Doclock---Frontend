//code mode control: consulta y guardado reales manteniendo la composición visual.
import { adminModules } from '@/config/administration';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/Notice';
import { AppearanceForm } from '@/components/appearance/AppearanceForm';
import { useControlPage } from '@/hooks/administration/useControlPage';

export function AppearancePage() {
  const definition = adminModules.appearance;
  const {
    query,
    canRead,
    canWrite,
    records,
    editing,
    saved,
    open,
    close,
    finishSaving,
  } = useControlPage('appearance');

  if (!canRead)
    return (
      <Notice tone="error">
        No tienes permiso para consultar este módulo.
      </Notice>
    );

  return (
    <div className="admin-module">
      <PageHeader
        title={definition.title}
        description={definition.description}
      />
      <p className="demo-disclosure">
        Los cambios se guardan en el sistema y se registran en el historial.
      </p>
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
        (editing ? (
          <AppearanceForm
            record={editing === 'new' ? undefined : editing}
            onClose={close}
            onSaved={finishSaving}
          />
        ) : (
          <section className="panel admin-settings">
            <h2>Configuración guardada</h2>
            <dl>
              {definition.fields.map((field) => (
                <div key={field.key}>
                  <dt>{field.label}</dt>
                  <dd>
                    {typeof records[0]?.values[field.key] === 'boolean'
                      ? records[0].values[field.key]
                        ? 'Sí'
                        : 'No'
                      : String(records[0]?.values[field.key] ?? '') ||
                        'Sin configurar'}
                  </dd>
                </div>
              ))}
            </dl>
            <Button
              id="admin-settings-edit"
              disabled={!canWrite}
              onClick={(event) =>
                open(records[0] ?? 'new', event.currentTarget.id)
              }
            >
              Editar configuración
            </Button>
          </section>
        ))}
    </div>
  );
}
