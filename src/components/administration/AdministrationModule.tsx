import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { adminModules } from '@/config/administration';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/TextField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Notice } from '@/components/ui/Notice';
import { useAdministration } from '@/hooks/administration/useAdministration';
import { AdministrationEditor } from './AdministrationEditor';
import type { AdminRecord, ModuleId } from '@/types/administration';

export function AdministrationModule({ module }: { module: ModuleId }) {
  const definition = adminModules[module];
  const query = useAdministration();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [editing, setEditing] = useState<AdminRecord | 'new' | null>(null);
  const [saved, setSaved] = useState(false);
  const trigger = useRef('admin-create');
  const records = query.data?.records[module] ?? [];
  function close() { setEditing(null); requestAnimationFrame(() => (document.getElementById(trigger.current) ?? document.querySelector<HTMLElement>('[data-page-heading]'))?.focus()); }
  function display(record: AdminRecord, key: string) {
    const value = record.values[key];
    if (key === 'sid_rol') return String(query.data?.records.roles.find(role => role.id === value)?.values.nombre ?? 'Sin rol');
    if (typeof value === 'boolean') return value ? 'Activo' : 'Inactivo';
    return String(value ?? '') || '—';
  }
  const filtered = records.filter(record => (status === 'all' || Boolean(record.values.activo) === (status === 'active')) && definition.columns.some(key => display(record, key).toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'))));
  return <div className="admin-module">
    <PageHeader title={definition.title} description={definition.description} action={!definition.singleton && !editing && <Button id="admin-create" disabled={!query.data} onClick={event => { trigger.current = event.currentTarget.id; setSaved(false); setEditing('new'); }}><Plus size={18} />Crear {definition.singular}</Button>} />
    <p className="demo-disclosure">Administración de prueba. Los cambios se conservan durante esta sesión de la página y se reinician al recargar o cerrar sesión. No modifican las pantallas documentales ni sus políticas actuales.</p>
    {saved && <Notice tone="success">Cambios guardados en la demo. Puedes consultar el movimiento en Historial.</Notice>}
    {query.isPending && <p role="status">Cargando {definition.title.toLocaleLowerCase('es')}…</p>}
    {query.isError && <Notice tone="error">No se pudo cargar el módulo. <Button variant="secondary" onClick={() => query.refetch()}>Reintentar</Button></Notice>}
    {query.data && (editing ? <AdministrationEditor module={module} record={editing === 'new' ? undefined : editing} roles={query.data.records.roles} onClose={close} onSaved={() => { setSaved(true); close(); }} /> : definition.singleton ? <section className="panel admin-settings"><h2>Configuración guardada</h2><dl>{definition.fields.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{typeof records[0]?.values[field.key] === 'boolean' ? records[0].values[field.key] ? 'Sí' : 'No' : String(records[0]?.values[field.key] ?? '') || 'Sin configurar'}</dd></div>)}</dl><Button id="admin-settings-edit" onClick={event => { trigger.current = event.currentTarget.id; setSaved(false); setEditing(records[0]); }}>Editar configuración</Button></section> : <section className="panel admin-list">
      <div className="admin-toolbar"><TextField label={`Buscar en ${definition.title.toLocaleLowerCase('es')}`} value={search} onChange={event => setSearch(event.target.value)} /><label>Estado<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></label></div>
      <p className="muted-text" role="status">{filtered.length} de {records.length} registros</p>
      {!filtered.length ? <EmptyState title={records.length ? 'Sin coincidencias' : `Aún no hay registros`} description={records.length ? 'Prueba otro texto o selecciona todos los estados.' : `Usa Crear ${definition.singular} para comenzar.`} /> : <div className="admin-table-scroll" tabIndex={0} role="region" aria-label={`Tabla de ${definition.title}`}><table><caption className="sr-only">{definition.title}</caption><thead><tr>{definition.columns.map(key => <th scope="col" key={key}>{definition.fields.find(field => field.key === key)?.label}</th>)}<th scope="col">Acciones</th></tr></thead><tbody>{filtered.map(record => <tr key={record.id}>{definition.columns.map(key => <td key={key}>{key === 'activo' ? <span className="admin-status">{display(record, key)}</span> : display(record, key)}</td>)}<td><Button id={`admin-edit-${record.id}`} variant="ghost" aria-label={`Editar ${display(record, definition.columns[0])}`} onClick={event => { trigger.current = event.currentTarget.id; setSaved(false); setEditing(record); }}>Editar</Button></td></tr>)}</tbody></table></div>}
    </section>)}
  </div>;
}

