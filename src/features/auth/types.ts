import type { LoginValues } from './schemas/loginSchema';
export type DemoUser = { id: string; name: string; email: string };
export interface AuthService { login(values: LoginValues): Promise<DemoUser> }
