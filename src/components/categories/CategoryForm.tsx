//code mode control: formulario existente conectado a su endpoint real.
import { TextField } from '@/components/ui/TextField';
import { TextareaField } from '@/components/ui/TextareaField';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { AdministrationFormFrame } from '@/components/administration/AdministrationFormFrame';
import { useControlForm } from '@/hooks/administration/useControlForm';
import type { AdminRecord } from '@/types/administration';

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
      <TextField
        id="admin-categories-color"
        label="Color"
        type="color"
        value={String(values.color ?? '')}
        onChange={(event) => setValue('color', event.target.value)}
      />
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
