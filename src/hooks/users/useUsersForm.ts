import { historyKey } from '@/hooks/administration/controlKeys';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/administration/usersService';
import { useAuth } from '@/providers/AuthProvider';
import { usersKey } from './useUsersPage';
import type { AdminRecord, FieldValue } from '@/types/administration';

//code mode usuarios: el formulario guarda en la API; la contraseña nunca entra al caché.
export function useUsersForm(
  record: AdminRecord | undefined,
  onSaved: () => void,
) {
  const [values, setValues] = useState<AdminRecord['values']>(() => ({
    nombre: '',
    correo: '',
    sid_rol: '',
    activo: true,
    ...record?.values,
    password: '',
  }));
  const client = useQueryClient();
  const { updateProfile } = useAuth();
  const mutation = useMutation({
    mutationFn: () => usersService.save(values, record),
    onSuccess: async () => {
      setValues((current) => ({ ...current, password: '' }));
      if (record)
        updateProfile(
          record.id,
          String(values.nombre).trim(),
          String(values.correo).trim(),
        );
      //code mode control: refresca el historial real después de cambiar usuarios.
      await Promise.all([
        client.invalidateQueries({ queryKey: usersKey }),
        client.invalidateQueries({ queryKey: historyKey }),
      ]);
      onSaved();
    },
    retry: false,
  });

  function setValue(key: string, value: FieldValue) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return { values, setValue, mutation };
}
