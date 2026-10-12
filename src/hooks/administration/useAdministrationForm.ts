import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { administrationKey } from './useAdministration';
import {
  administrationService,
  defaultValues,
} from '@/services/administration/mockAdministrationService';
import { useAuth } from '@/providers/AuthProvider';
import type { AdminRecord, FieldValue, ModuleId } from '@/types/administration';

export function useAdministrationForm(
  module: ModuleId,
  record: AdminRecord | undefined,
  onSaved: () => void,
) {
  const [values, setValues] = useState(
    () => record?.values ?? defaultValues(module),
  );
  const client = useQueryClient();
  const { user } = useAuth();
  const mutation = useMutation({
    mutationFn: () =>
      administrationService.save(
        module,
        values,
        user?.name ?? 'Usuario demo',
        record?.id,
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: administrationKey });
      onSaved();
    },
  });

  function setValue(key: string, value: FieldValue) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return { values, setValue, mutation };
}
