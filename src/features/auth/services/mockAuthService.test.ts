import { describe, expect, it, vi, afterEach } from 'vitest';
import { mockAuthService, demoCredentials } from './mockAuthService';
import { loginSchema } from '../schemas/loginSchema';
afterEach(() => vi.useRealTimers());
describe('contrato de login simulado', () => {
  it('acepta la cuenta demo sin devolver contraseñas', async () => {
    vi.useFakeTimers();
    const request = mockAuthService.login(demoCredentials);
    await vi.runAllTimersAsync();
    const user = await request;
    expect(user.email).toBe(demoCredentials.email);
    expect(user).not.toHaveProperty('password');
  });
  it('rechaza credenciales incorrectas', async () => {
    vi.useFakeTimers();
    const result = expect(mockAuthService.login({ ...demoCredentials, password: 'incorrecta' })).rejects.toThrow('no coinciden');
    await vi.runAllTimersAsync();
    await result;
  });
  it('rechaza correo inválido y contraseña vacía', () => {
    expect(loginSchema.safeParse({ email: 'no-es-correo', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse(demoCredentials).success).toBe(true);
  });
});
