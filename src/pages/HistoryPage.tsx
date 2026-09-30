import { useState } from 'react';
import { adminModules } from '@/config/administration';
import { useAdministration } from '@/hooks/administration/useAdministration';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextField } from '@/components/ui/TextField';
import { Notice } from '@/components/ui/Notice';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';

export function HistoryPage() {
  const query = useAdministration();
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('all');
  const [action, setAction] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const invalidDates = !!from && !!to && from > to;
  const rows = query.data?.history.filter(event => {
    const d = new Date(event.date);
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return !invalidDates && (entity === 'all' || event.entity === entity) && (action === 'all' || event.action === action) && (!from || localDate >= from) && (!to || localDate <= to) && `${event.description} ${event.actor}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'));
  }) ?? [];
  return <div className="admin-module"><PageHeader title="Historial" description="Consulta los cambios realizados en los módulos de administración." /><p className="demo-disclosure">Bitácora local de demostración, de solo lectura. Los movimientos de las pantallas documentales permanecen en la actividad de Inicio. No se registra una IP real.</p>
    <section className="panel"><div className="admin-toolbar"><TextField label="Buscar por descripción o usuario" value={search} onChange={event => setSearch(event.target.value)} /><label>Módulo<select value={entity} onChange={event => setEntity(event.target.value)}><option value="all">Todos</option>{Object.entries(adminModules).map(([id, module]) => <option key={id} value={id}>{module.title}</option>)}</select></label><label>Acción<select value={action} onChange={event => setAction(event.target.value)}><option value="all">Todas</option><option value="crear">Crear</option><option value="actualizar">Actualizar</option></select></label><TextField label="Desde" type="date" value={from} onChange={event => setFrom(event.target.value)} /><TextField label="Hasta" type="date" min={from} value={to} onChange={event => setTo(event.target.value)} /></div>
    {invalidDates && <Notice tone="error">La fecha final debe ser igual o posterior a la inicial.</Notice>}
    {query.isPending ? <p role="status">Cargando historial…</p> : query.isError ? <Notice tone="error">No se pudo cargar el historial. <Button onClick={() => query.refetch()}>Reintentar</Button></Notice> : <><p className="muted-text" role="status">{rows.length} movimientos</p>{rows.length ? <ol className="admin-history">{rows.map(event => <li key={event.id}><div><h2>{event.description}</h2><p>{event.actor} · {adminModules[event.entity].title} · <time dateTime={event.date}>{new Date(event.date).toLocaleString('es-MX')}</time></p></div><details><summary>Ver cambios</summary><p>Registro: {event.recordId} · Acción: {event.action}</p><dl>{adminModules[event.entity].fields.filter(field => !event.before || event.before.values[field.key] !== event.after.values[field.key]).map(field => <div key={field.key}><dt>{field.label}</dt><dd>{event.before ? String(event.before.values[field.key] ?? 'Vacío') : 'Sin registro'} → {String(event.after.values[field.key]) || 'Vacío'}</dd></div>)}</dl></details></li>)}</ol> : <EmptyState title="Sin movimientos" description="Los cambios de administración aparecerán aquí. Si ya realizaste cambios, revisa los filtros." />}</>}
    </section></div>;
}
