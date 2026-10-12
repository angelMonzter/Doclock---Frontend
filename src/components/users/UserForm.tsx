import { TextField } from '@/components/ui/TextField';
import { SelectField } from '@/components/ui/SelectField';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { Notice } from '@/components/ui/Notice';
import { AdministrationFormFrame } from '@/components/administration/AdministrationFormFrame';
//code mode usuarios: conserva los controles y conecta el formulario al servicio real.
import { useUsersForm } from '@/hooks/users/useUsersForm';
import { useAuth } from '@/providers/AuthProvider';
import type { AdminRecord } from '@/types/administration';

export type UserFormProps = {
  record?: AdminRecord;
  roles: AdminRecord[];
  onClose: () => void;
  onSaved: () => void;
};

export function UserForm({ record, roles, onClose, onSaved }: UserFormProps) {
  const { user } = useAuth();
  const ownAccount = record?.id === user?.id;
  const { values, setValue, mutation } = useUsersForm(record, onSaved);

  return (
    <AdministrationFormFrame
      title={(record ? 'Editar' : 'Crear') + ' usuario'}
      legend="Datos de usuario"
      busy={mutation.isPending}
      error={mutation.error?.message}
      onSubmit={() => mutation.mutate()}
      onClose={onClose}
      note={
        <Notice>
          {record
            ? 'Deja la contraseña vacía para conservar la actual.'
            : 'La contraseña debe tener al menos 8 caracteres y hasta 72 bytes.'}
        </Notice>
      }
    >
      <TextField
        id="admin-users-nombre"
        label="Nombre *"
        type="text"
        value={String(values.nombre ?? '')}
        onChange={(event) => setValue('nombre', event.target.value)}
        required
        maxLength={150}
      />
      <TextField
        id="admin-users-correo"
        label="Correo electrónico *"
        type="email"
        value={String(values.correo ?? '')}
        onChange={(event) => setValue('correo', event.target.value)}
        required
        maxLength={255}
      />
      <SelectField
        id="admin-users-sid_rol"
        label="Rol *"
        value={String(values.sid_rol ?? '')}
        onChange={(event) => setValue('sid_rol', event.target.value)}
        required
        disabled={ownAccount}
      >
        <option value="">Selecciona una opción</option>

        {roles
          .filter((role) => role.values.activo || role.id === values.sid_rol)
          .map((role) => (
            <option key={role.id} value={role.id}>
              {String(role.values.nombre)}
              {!role.values.activo ? ' (inactivo)' : ''}
            </option>
          ))}
      </SelectField>
      <TextField
        id="admin-users-password"
        label={record ? 'Nueva contraseña' : 'Contraseña *'}
        type="password"
        autoComplete="new-password"
        value={String(values.password ?? '')}
        onChange={(event) => setValue('password', event.target.value)}
        required={!record}
        minLength={8}
        maxLength={72}
      />
      <CheckboxField
        id="admin-users-activo"
        label="Activo"
        containerClassName="admin-checkbox"
        checked={Boolean(values.activo)}
        disabled={ownAccount}
        onChange={(event) => setValue('activo', event.target.checked)}
      />
    </AdministrationFormFrame>
  );
}
