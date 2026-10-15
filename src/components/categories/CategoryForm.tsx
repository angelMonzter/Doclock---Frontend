//code mode control: formulario existente conectado a su endpoint real.
import { TextField } from '@/components/ui/TextField';
import { TextareaField } from '@/components/ui/TextareaField';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { AdministrationFormFrame } from '@/components/administration/AdministrationFormFrame';
import { useControlForm } from '@/hooks/administration/useControlForm';
import type { AdminRecord } from '@/types/administration';
import { CategoryLabel } from './CategoryLabel';

export type CategoryFormProps = {
  record?: AdminRecord;
  onClose: () => void;
  onSaved: () => void;
};

export function CategoryForm({ record, onClose, onSaved }: CategoryFormProps) {
  const { values, setValue, mutation } = useControlForm(
    'categories',
    record,
    onSaved,
  );

  return (
    <AdministrationFormFrame
      title={(record ? 'Editar' : 'Crear') + ' categoría'}
      legend="Datos de categoría"
      busy={mutation.isPending}
      error={mutation.error?.message}
      onSubmit={() => mutation.mutate()}
      onClose={onClose}
      preview={
        <div className="category-preview">
          <p className="muted-text">Vista previa</p>
          {String(values.nombre ?? '').trim() ? (
            <CategoryLabel
              name={String(values.nombre)}
              color={String(values.color ?? '')}
            />
          ) : (
            <p className="muted-text">
              Escribe el nombre para ver la categoría.
            </p>
          )}
        </div>
      }
    >
      <TextField
        id="admin-categories-nombre"
        label="Nombre *"
        type="text"
        value={String(values.nombre ?? '')}
        onChange={(event) => setValue('nombre', event.target.value)}
        required
        maxLength={150}
      />
      <TextareaField
        id="admin-categories-descripcion"
        label="Descripción"
        containerClassName="admin-wide"
        value={String(values.descripcion ?? '')}
        onChange={(event) => setValue('descripcion', event.target.value)}
        maxLength={500}
      />
      <div className="category-color-field">
        <TextField
          id="admin-categories-color"
          label="Color (opcional)"
          type="text"
          value={String(values.color ?? '')}
          onChange={(event) => setValue('color', event.target.value)}
          pattern="#[0-9a-fA-F]{6}"
          maxLength={7}
          hint="Formato hexadecimal de 6 dígitos. Déjalo vacío para no usar color."
        />
        <TextField
          id="admin-categories-color-picker"
          label="Elegir color"
          type="color"
          value={
            /^#[0-9a-f]{6}$/i.test(String(values.color ?? ''))
              ? String(values.color)
              : '#000000'
          }
          onChange={(event) => setValue('color', event.target.value)}
          hint="Solo se asigna al seleccionar un color."
        />
      </div>
      <CheckboxField
        id="admin-categories-activo"
        label="Activo"
        containerClassName="admin-checkbox"
        checked={Boolean(values.activo)}
        onChange={(event) => setValue('activo', event.target.checked)}
      />
    </AdministrationFormFrame>
  );
}
