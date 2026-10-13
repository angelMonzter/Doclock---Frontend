import type { AuthUser } from '@/types/auth';

export function workspaceAccess(permissions: AuthUser['permissions'] = {}) {
  return {
    documents: Boolean(
      permissions.puede_ver_archivos || permissions.puede_gestionar_carpetas,
    ),
    upload: Boolean(permissions.puede_subir_archivos),
    categories: Boolean(
      permissions.puede_ver_archivos ||
      permissions.puede_subir_archivos ||
      permissions.puede_editar_archivos ||
      permissions.puede_gestionar_categorias,
    ),
    users: Boolean(permissions.puede_gestionar_usuarios),
    history: Boolean(permissions.puede_ver_historial),
  };
}
