import type { LoginValues } from '@/schemas/auth/loginSchema';
export type DemoUser = { id: string; name: string; email: string };
export interface AuthService {
  login(values: LoginValues): Promise<DemoUser>;
}
