//code mode control: formulario existente conectado a su endpoint real.
import { TextField } from '@/components/ui/TextField';
import { SelectField } from '@/components/ui/SelectField';
import { AdministrationFormFrame } from '@/components/administration/AdministrationFormFrame';
import { useControlForm } from '@/hooks/administration/useControlForm';
import type { AdminRecord } from '@/types/administration';

export type AppearanceFormProps = {
  record?: AdminRecord;
  onClose: () => void;
  onSaved: () => void;
};

export function AppearanceForm({
  record,
  onClose,
  onSaved,
}: AppearanceFormProps) {
  const { values, setValue, mutation } = useControlForm(
    'appearance',
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
      preview={
        <section
          className="admin-preview"
          aria-label="Vista previa del menú"
          style={{
            background: String(values.color_menu),
            color: String(values.color_menu_texto),
          }}
        >
          <strong>{String(values.nombre_empresa) || 'Mi empresa'}</strong>
          <p>Vista previa de colores del menú</p>
          <span style={{ background: String(values.color_menu_activo) }}>
            Documentos · opción activa
          </span>
          <small>
            Tema elegido: {String(values.tema)}. La aplicación conserva su tema
            actual.
          </small>
        </section>
      }
    >
      <TextField
        id="admin-appearance-nombre_empresa"
        label="Nombre de la empresa *"
        type="text"
        value={String(values.nombre_empresa ?? '')}
        onChange={(event) => setValue('nombre_empresa', event.target.value)}
        required
        maxLength={150}
      />
      <SelectField
        id="admin-appearance-tema"
        label="Tema *"
        value={String(values.tema ?? '')}
        onChange={(event) => setValue('tema', event.target.value)}
        required
      >
        <option value="">Selecciona una opción</option>
        <option value="claro">claro</option>
        <option value="oscuro">oscuro</option>
        <option value="sistema">sistema</option>
      </SelectField>
      <TextField
        id="admin-appearance-imagen_empresa_s3"
        label="Ruta del logotipo en S3"
        type="text"
        value={String(values.imagen_empresa_s3 ?? '')}
        onChange={(event) => setValue('imagen_empresa_s3', event.target.value)}
        maxLength={1024}
        hint="Referencia al logotipo almacenado en S3; este campo guarda su ruta."
      />
      <TextField
        id="admin-appearance-color_menu"
        label="Fondo del menú *"
        type="color"
        value={String(values.color_menu ?? '')}
        onChange={(event) => setValue('color_menu', event.target.value)}
        required
      />
      <TextField
        id="admin-appearance-color_menu_texto"
        label="Texto del menú *"
        type="color"
        value={String(values.color_menu_texto ?? '')}
        onChange={(event) => setValue('color_menu_texto', event.target.value)}
        required
      />
      <TextField
        id="admin-appearance-color_menu_activo"
        label="Opción activa *"
        type="color"
        value={String(values.color_menu_activo ?? '')}
        onChange={(event) => setValue('color_menu_activo', event.target.value)}
        required
      />
    </AdministrationFormFrame>
  );
}
