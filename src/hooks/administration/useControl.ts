import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PageRequest } from '@/types/pagination';
import { useAuth } from '@/providers/AuthProvider';
import { controlService } from '@/services/administration/controlService';
import type { ControlModule } from '@/types/control';
import { controlKey } from './controlKeys';

//code mode control: cada pantalla consulta solamente su módulo y respeta los permisos reales.
const writePermissions = {
  categories: 'puede_gestionar_categorias',
  roles: 'puede_gestionar_usuarios',
  appearance: 'puede_gestionar_configuracion',
  fileSettings: 'puede_gestionar_configuracion',
} as const;

export function useControl(module: ControlModule, request: PageRequest) {
  const { user } = useAuth();
  const canWrite = Boolean(user?.permissions[writePermissions[module]]);
  const canRead =
    Boolean(user) &&
    (module === 'appearance' ||
      module === 'fileSettings' ||
      canWrite ||
      (module === 'categories' &&
        [
          'puede_ver_archivos',
          'puede_subir_archivos',
          'puede_editar_archivos',
        ].some((permission) => user?.permissions[permission])));
  const query = useQuery({
    queryKey: [...controlKey, module, user?.id, request],
    queryFn: ({ signal }) => controlService.page(module, request, signal),
    placeholderData: keepPreviousData,
    enabled: canRead,
    retry: false,
  });
  return { query, canRead, canWrite, currentRoleId: user?.roleId };
}
