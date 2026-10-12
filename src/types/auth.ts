import type { LoginValues } from '@/schemas/auth/loginSchema';
//code mode usuarios: contrato de sesión real, independiente del transporte HTTP.
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role: string;
  permissions: Record<string, boolean>;
};
export type AuthSession = { token: string; user: AuthUser };
export interface AuthService {
  login(values: LoginValues): Promise<AuthSession>;
  me(signal?: AbortSignal): Promise<AuthUser>;
}
