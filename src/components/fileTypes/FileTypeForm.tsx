import { TextField } from '@/components/ui/TextField';
import { TextareaField } from '@/components/ui/TextareaField';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { AdministrationFormFrame } from '@/components/administration/AdministrationFormFrame';
import { useAdministrationForm } from '@/hooks/administration/useAdministrationForm';
import type { AdminRecord } from '@/types/administration';

export type FileTypeFormProps = {
  record?: AdminRecord;
  onClose: () => void;
  onSaved: () => void;
};

export function FileTypeForm({
  record,
  onClose,
  onSaved,
}: FileTypeFormProps) {
  const { values, setValue, mutation } = useAdministrationForm(
    'fileTypes',
    record,
    onSaved,
  );

  return (
    <AdministrationFormFrame
      title={(record ? 'Editar' : 'Crear') + ' tipo de archivo'}
      legend="Datos de tipo de archivo"
      busy={mutation.isPending}
      error={mutation.error?.message}
      onSubmit={() => mutation.mutate()}
      onClose={onClose}
    >
      <TextField
        id="admin-fileTypes-tipo_mime"
        label="Tipo MIME *"
        type="text"
        value={String(values.tipo_mime ?? '')}
        onChange={(event) => setValue('tipo_mime', event.target.value)}
        required
        maxLength={150}
        hint="Por ejemplo: application/pdf."
      />
      <TextareaField
        id="admin-fileTypes-descripcion"
        label="Descripción"
        containerClassName="admin-wide"
        value={String(values.descripcion ?? '')}
        onChange={(event) => setValue('descripcion', event.target.value)}
        maxLength={150}
      />
      <CheckboxField
        id="admin-fileTypes-activo"
        label="Activo"
        containerClassName="admin-checkbox"
        checked={Boolean(values.activo)}
        onChange={(event) => setValue('activo', event.target.checked)}
      />
    </AdministrationFormFrame>
  );
}
