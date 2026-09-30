import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminModules } from '@/config/administration';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/Notice';
import { TextField } from '@/components/ui/TextField';
import { administrationKey } from '@/hooks/administration/useAdministration';
import { administrationService, defaultValues } from '@/services/administration/mockAdministrationService';
import { useAuth } from '@/providers/AuthProvider';
import type { AdminRecord, ModuleId } from '@/types/administration';

type Props = { module: ModuleId; record?: AdminRecord; roles: AdminRecord[]; onClose: () => void; onSaved: () => void };
export function AdministrationEditor({ module, record, roles, onClose, onSaved }: Props) {
  const definition = adminModules[module];
  const [values, setValues] = useState(record?.values ?? defaultValues(module));
  const heading = useRef<HTMLHeadingElement>(null);
  const error = useRef<HTMLDivElement>(null);
  const client = useQueryClient();
  const { user } = useAuth();
  const mutation = useMutation({
    mutationFn: () => administrationService.save(module, values, user?.name ?? 'Usuario demo', record?.id),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: administrationKey }); onSaved(); },
    onError: () => requestAnimationFrame(() => error.current?.focus()),
  });
  useEffect(() => { heading.current?.focus(); }, []);
  return <section className="panel admin-editor" aria-labelledby="editor-title" onKeyDown={event => { if (event.key === 'Escape' && !mutation.isPending) onClose(); }}>
    <h2 id="editor-title" ref={heading} tabIndex={-1}>{record ? 'Editar' : 'Crear'} {definition.singular}</h2>
    <p className="muted-text">Los campos marcados con * son obligatorios.</p>
    {module === 'users' && <Notice>Cuenta de demostración. El alta real y la asignación de contraseña requieren el backend; aquí no se guardan credenciales.</Notice>}
    <form onSubmit={event => { event.preventDefault(); mutation.mutate(); }}>
      <fieldset className="admin-fields" disabled={mutation.isPending}>
        <legend className="sr-only">Datos de {definition.singular}</legend>
        {definition.fields.map(field => {
          const id = `admin-${module}-${field.key}`;
          const label = `${field.label}${field.required ? ' *' : ''}`;
          const value = values[field.key] ?? '';
          const set = (next: string | boolean) => setValues(current => ({ ...current, [field.key]: next }));
          if (field.type === 'checkbox') return <label className="admin-checkbox" key={field.key}><input type="checkbox" checked={Boolean(value)} onChange={event => set(event.target.checked)} />{label}</label>;
          if (field.type === 'textarea') return <label key={field.key} className="admin-wide" htmlFor={id}>{label}<textarea id={id} value={String(value)} required={field.required} maxLength={field.maxLength} onChange={event => set(event.target.value)} /></label>;
          if (field.type === 'select') return <label key={field.key} htmlFor={id}>{label}<select id={id} required={field.required} value={String(value)} onChange={event => set(event.target.value)}>
            <option value="">Selecciona una opción</option>
            {field.key === 'sid_rol' ? roles.filter(role => role.values.activo || role.id === value).map(role => <option key={role.id} value={role.id}>{String(role.values.nombre)}{!role.values.activo ? ' (inactivo)' : ''}</option>) : field.options?.map(option => <option key={option} value={option}>{option}</option>)}
          </select></label>;
          return <TextField key={field.key} id={id} label={label} type={field.type} value={String(value)} required={field.required} maxLength={field.maxLength} min={field.min} max={field.max} step={field.type === 'number' ? 1 : undefined} hint={field.hint} onChange={event => set(event.target.value)} />;
        })}
      </fieldset>
      {module === 'appearance' && <section className="admin-preview" aria-label="Vista previa del menú" style={{ background: String(values.color_menu), color: String(values.color_menu_texto) }}><strong>{String(values.nombre_empresa) || 'Mi empresa'}</strong><p>Vista previa de colores del menú</p><span style={{ background: String(values.color_menu_activo) }}>Documentos · opción activa</span><small>Tema elegido: {String(values.tema)}. La aplicación conserva su tema actual.</small></section>}
      {module === 'messages' && <section className="admin-message-preview" aria-label="Vista previa del mensaje"><p className="muted-text">Vista previa · {String(values.tipo)}</p><h3>{String(values.titulo) || 'Título del aviso'}</h3><p>{String(values.contenido) || 'Contenido del mensaje'}</p><div className="form-actions"><span>{String(values.texto_boton_principal)}</span>{values.texto_boton_secundario && <span>{String(values.texto_boton_secundario)}</span>}</div></section>}
      <div ref={error} tabIndex={-1}>{mutation.isError && <Notice tone="error">{mutation.error.message}</Notice>}</div>
      <div className="form-actions"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando…' : 'Guardar cambios'}</Button><Button variant="secondary" disabled={mutation.isPending} onClick={onClose}>Cancelar</Button></div>
    </form>
  </section>;
}
