import { TextField } from '@/components/ui/TextField';
import { TextareaField } from '@/components/ui/TextareaField';
import { SelectField } from '@/components/ui/SelectField';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { AdministrationFormFrame } from '@/components/administration/AdministrationFormFrame';
import { useAdministrationForm } from '@/hooks/administration/useAdministrationForm';
import type { AdminRecord } from '@/types/administration';

export type MessageFormProps = {
  record?: AdminRecord;
  onClose: () => void;
  onSaved: () => void;
};

export function MessageForm({
  record,
  onClose,
  onSaved,
}: MessageFormProps) {
  const { values, setValue, mutation } = useAdministrationForm(
    'messages',
    record,
    onSaved,
  );

  return (
    <AdministrationFormFrame
      title={(record ? 'Editar' : 'Crear') + ' mensaje'}
      legend="Datos de mensaje"
      busy={mutation.isPending}
      error={mutation.error?.message}
      onSubmit={() => mutation.mutate()}
      onClose={onClose}
      preview={
        <section
          className="admin-message-preview"
          aria-label="Vista previa del mensaje"
        >
          <p className="muted-text">Vista previa · {String(values.tipo)}</p>
          <h3>{String(values.titulo) || 'Título del aviso'}</h3>
          <p>{String(values.contenido) || 'Contenido del mensaje'}</p>
          <div className="form-actions">
            <span>{String(values.texto_boton_principal)}</span>
            {values.texto_boton_secundario && (
              <span>{String(values.texto_boton_secundario)}</span>
            )}
          </div>
        </section>
      }
    >
      <TextField
        id="admin-messages-codigo"
        label="Código único *"
        type="text"
        value={String(values.codigo ?? '')}
        onChange={(event) => setValue('codigo', event.target.value)}
        required
        maxLength={100}
      />
      <TextField
        id="admin-messages-contexto"
        label="Contexto *"
        type="text"
        value={String(values.contexto ?? '')}
        onChange={(event) => setValue('contexto', event.target.value)}
        required
        maxLength={50}
      />
      <TextField
        id="admin-messages-titulo"
        label="Título *"
        type="text"
        value={String(values.titulo ?? '')}
        onChange={(event) => setValue('titulo', event.target.value)}
        required
        maxLength={150}
      />
      <TextareaField
        id="admin-messages-contenido"
        label="Contenido *"
        containerClassName="admin-wide"
        value={String(values.contenido ?? '')}
        onChange={(event) => setValue('contenido', event.target.value)}
        required
        maxLength={16000}
      />
      <SelectField
        id="admin-messages-tipo"
        label="Tipo *"
        value={String(values.tipo ?? '')}
        onChange={(event) => setValue('tipo', event.target.value)}
        required
      >
        <option value="">Selecciona una opción</option>
        <option value="informacion">informacion</option>
        <option value="exito">exito</option>
        <option value="advertencia">advertencia</option>
        <option value="error">error</option>
        <option value="confirmacion">confirmacion</option>
      </SelectField>
      <TextField
        id="admin-messages-texto_boton_principal"
        label="Botón principal *"
        type="text"
        value={String(values.texto_boton_principal ?? '')}
        onChange={(event) =>
          setValue('texto_boton_principal', event.target.value)
        }
        required
        maxLength={80}
      />
      <TextField
        id="admin-messages-texto_boton_secundario"
        label="Botón secundario"
        type="text"
        value={String(values.texto_boton_secundario ?? '')}
        onChange={(event) =>
          setValue('texto_boton_secundario', event.target.value)
        }
        maxLength={80}
      />
      <CheckboxField
        id="admin-messages-permite_cerrar"
        label="Permitir cerrar"
        containerClassName="admin-checkbox"
        checked={Boolean(values.permite_cerrar)}
        onChange={(event) => setValue('permite_cerrar', event.target.checked)}
      />
      <CheckboxField
        id="admin-messages-activo"
        label="Activo"
        containerClassName="admin-checkbox"
        checked={Boolean(values.activo)}
        onChange={(event) => setValue('activo', event.target.checked)}
      />
    </AdministrationFormFrame>
  );
}
