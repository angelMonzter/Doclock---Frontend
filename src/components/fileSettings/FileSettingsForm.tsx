//code mode control: formulario existente conectado a su endpoint real.
import { TextField } from '@/components/ui/TextField';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { AdministrationFormFrame } from '@/components/administration/AdministrationFormFrame';
import { useControlForm } from '@/hooks/administration/useControlForm';
import type { AdminRecord } from '@/types/administration';

export type FileSettingsFormProps = {
  record?: AdminRecord;
  onClose: () => void;
  onSaved: () => void;
};

export function FileSettingsForm({
  record,
  onClose,
  onSaved,
}: FileSettingsFormProps) {
  const { values, setValue, mutation } = useControlForm(
    'fileSettings',
    record,
    onSaved,
  );

  return (
    <AdministrationFormFrame
      title={(record ? 'Editar' : 'Crear') + ' configuración'}
      legend="Datos de configuración"
      busy={mutation.isPending}
      error={mutation.error?.message}
      onSubmit={() => mutation.mutate()}
      onClose={onClose}
    >
      <TextField
        id="admin-fileSettings-tamano_maximo_bytes"
        label="Tamaño máximo por archivo (bytes) *"
        type="number"
        value={String(values.tamano_maximo_bytes ?? '')}
        onChange={(event) =>
          setValue('tamano_maximo_bytes', event.target.value)
        }
        required
        min={1}
        max={9007199254740991}
        step={1}
        hint="10 MiB = 10 485 760 bytes."
      />
      <TextField
        id="admin-fileSettings-archivos_maximos_por_carga"
        label="Archivos por carga *"
        type="number"
        value={String(values.archivos_maximos_por_carga ?? '')}
        onChange={(event) =>
          setValue('archivos_maximos_por_carga', event.target.value)
        }
        required
        min={1}
        max={65535}
        step={1}
      />
      <TextField
        id="admin-fileSettings-almacenamiento_maximo_bytes"
        label="Almacenamiento máximo (bytes)"
        type="number"
        value={String(values.almacenamiento_maximo_bytes ?? '')}
        onChange={(event) =>
          setValue('almacenamiento_maximo_bytes', event.target.value)
        }
        min={1}
        max={9007199254740991}
        step={1}
        hint="Vacío significa sin límite configurado."
      />
      <TextField
        id="admin-fileSettings-dias_papelera"
        label="Días en papelera *"
        type="number"
        value={String(values.dias_papelera ?? '')}
        onChange={(event) => setValue('dias_papelera', event.target.value)}
        required
        min={0}
        max={65535}
        step={1}
      />
      <CheckboxField
        id="admin-fileSettings-permitir_descargas"
        label="Permitir descargas"
        containerClassName="admin-checkbox"
        checked={Boolean(values.permitir_descargas)}
        onChange={(event) =>
          setValue('permitir_descargas', event.target.checked)
        }
      />
      <CheckboxField
        id="admin-fileSettings-permitir_reemplazar_archivos"
        label="Permitir reemplazo de archivos"
        containerClassName="admin-checkbox"
        checked={Boolean(values.permitir_reemplazar_archivos)}
        onChange={(event) =>
          setValue('permitir_reemplazar_archivos', event.target.checked)
        }
      />
    </AdministrationFormFrame>
  );
}
