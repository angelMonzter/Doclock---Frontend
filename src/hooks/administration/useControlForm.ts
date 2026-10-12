import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { defaultValues } from '@/config/administrationDefaults';
import { controlService } from '@/services/administration/controlService';
import type { AdminRecord, FieldValue } from '@/types/administration';
import type { ControlModule } from '@/types/control';
import { controlKey, historyKey } from './controlKeys';
import { usersKey } from '@/hooks/users/useUsersPage';
import { documentsKey } from '@/hooks/documents/useDocuments';

//code mode control: guardado real y actualización de listados relacionados, sin mutar el dummy.
export function useControlForm(
  module: ControlModule,
  record: AdminRecord | undefined,
  onSaved: () => void,
) {
  const [values, setValues] = useState(() => ({
    ...defaultValues(module),
    ...record?.values,
  }));
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => controlService.save(module, values, record?.id),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: [...controlKey, module] }),
        client.invalidateQueries({ queryKey: historyKey }),
        ...(['categories', 'fileSettings'].includes(module)
          ? [client.invalidateQueries({ queryKey: documentsKey })]
          : []),
        ...(module === 'roles'
          ? [client.invalidateQueries({ queryKey: usersKey })]
          : []),
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
