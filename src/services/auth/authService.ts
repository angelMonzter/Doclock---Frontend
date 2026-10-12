import { apiRequest } from '@/services/api';
import type { AuthService, AuthUser } from '@/types/auth';

//code mode usuarios: adapta tanto el perfil de login como la respuesta plana de /me.
type ApiProfile = {
  id_usuario: string;
  nombre: string;
  correo: string;
  sid_rol: string;
  rol: string;
  permisos?: Record<string, number | boolean>;
  [key: string]: unknown;
};

function toUser(profile: ApiProfile): AuthUser {
  const permissions = profile.permisos ?? profile;
  return {
    id: profile.id_usuario,
    name: profile.nombre,
    email: profile.correo,
    roleId: profile.sid_rol,
    role: profile.rol,
    permissions: Object.fromEntries(
      Object.entries(permissions)
        .filter(([key]) => key.startsWith('puede_'))
        .map(([key, value]) => [key, value === 1 || value === true]),
    ),
  };
}

export const authService: AuthService = {
  async login(values) {
    const result = await apiRequest<{ token: string; perfil: ApiProfile }>(
      '/auth/login',
      {
        method: 'POST',
        authenticated: false,
        body: JSON.stringify({
          correo: values.email,
          password: values.password,
        }),
      },
    );
    return { token: result.token, user: toUser(result.perfil) };
  },
  async me(signal) {
    return toUser(await apiRequest<ApiProfile>('/auth/me', { signal }));
  },
};
