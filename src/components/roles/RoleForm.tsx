//code mode control: formulario existente conectado a su endpoint real.
import { TextField } from '@/components/ui/TextField';
import { TextareaField } from '@/components/ui/TextareaField';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { AdministrationFormFrame } from '@/components/administration/AdministrationFormFrame';
import { useControlForm } from '@/hooks/administration/useControlForm';
import type { AdminRecord } from '@/types/administration';

export type RoleFormProps = {
  record?: AdminRecord;
  onClose: () => void;
  onSaved: () => void;
};

export function RoleForm({ record, onClose, onSaved }: RoleFormProps) {
  const { values, setValue, mutation } = useControlForm(
    'roles',
    record,
    onSaved,
  );

  return (
    <AdministrationFormFrame
      title={(record ? 'Editar' : 'Crear') + ' rol'}
      legend="Datos de rol"
      busy={mutation.isPending}
      error={mutation.error?.message}
      onSubmit={() => mutation.mutate()}
      onClose={onClose}
    >
      <TextField
        id="admin-roles-nombre"
        label="Nombre *"
        type="text"
        value={String(values.nombre ?? '')}
        onChange={(event) => setValue('nombre', event.target.value)}
        required
        maxLength={50}
      />
      <TextareaField
        id="admin-roles-descripcion"
        label="Descripción"
        containerClassName="admin-wide"
        value={String(values.descripcion ?? '')}
        onChange={(event) => setValue('descripcion', event.target.value)}
        maxLength={255}
      />
      <CheckboxField
        id="admin-roles-puede_ver_archivos"
        label="Ver archivos"
        containerClassName="admin-checkbox"
        checked={Boolean(values.puede_ver_archivos)}
        onChange={(event) =>
          setValue('puede_ver_archivos', event.target.checked)
        }
      />
      <CheckboxField
        id="admin-roles-puede_subir_archivos"
        label="Subir archivos"
        containerClassName="admin-checkbox"
        checked={Boolean(values.puede_subir_archivos)}
        onChange={(event) =>
          setValue('puede_subir_archivos', event.target.checked)
        }
      />
      <CheckboxField
        id="admin-roles-puede_editar_archivos"
        label="Editar archivos"
        containerClassName="admin-checkbox"
        checked={Boolean(values.puede_editar_archivos)}
        onChange={(event) =>
          setValue('puede_editar_archivos', event.target.checked)
        }
      />
      <CheckboxField
        id="admin-roles-puede_eliminar_archivos"
        label="Eliminar archivos"
        containerClassName="admin-checkbox"
        checked={Boolean(values.puede_eliminar_archivos)}
        onChange={(event) =>
          setValue('puede_eliminar_archivos', event.target.checked)
        }
      />
      <CheckboxField
        id="admin-roles-puede_gestionar_carpetas"
        label="Gestionar carpetas"
        containerClassName="admin-checkbox"
        checked={Boolean(values.puede_gestionar_carpetas)}
        onChange={(event) =>
          setValue('puede_gestionar_carpetas', event.target.checked)
        }
      />
      <CheckboxField
        id="admin-roles-puede_gestionar_categorias"
        label="Gestionar categorías"
        containerClassName="admin-checkbox"
        checked={Boolean(values.puede_gestionar_categorias)}
        onChange={(event) =>
          setValue('puede_gestionar_categorias', event.target.checked)
        }
      />
      <CheckboxField
        id="admin-roles-puede_gestionar_usuarios"
        label="Gestionar usuarios"
        containerClassName="admin-checkbox"
        checked={Boolean(values.puede_gestionar_usuarios)}
        onChange={(event) =>
          setValue('puede_gestionar_usuarios', event.target.checked)
        }
      />
      <CheckboxField
        id="admin-roles-puede_ver_historial"
        label="Ver historial"
        containerClassName="admin-checkbox"
        checked={Boolean(values.puede_ver_historial)}
        onChange={(event) =>
          setValue('puede_ver_historial', event.target.checked)
        }
      />
      <CheckboxField
        id="admin-roles-puede_vaciar_papelera"
        label="Vaciar papelera (eliminación definitiva)"
        containerClassName="admin-checkbox"
        checked={Boolean(values.puede_vaciar_papelera)}
        onChange={(event) =>
          setValue('puede_vaciar_papelera', event.target.checked)
        }
      />
      <p className="muted-text admin-wide">
        Para vaciar la papelera también se necesita el permiso Ver archivos.
        Esta acción no se puede deshacer.
      </p>
      {/* El permiso de configuración se conserva en values, pero no se edita aquí. */}
      <CheckboxField
        id="admin-roles-activo"
        label="Activo"
        containerClassName="admin-checkbox"
        checked={Boolean(values.activo)}
        onChange={(event) => setValue('activo', event.target.checked)}
      />
    </AdministrationFormFrame>
  );
}
