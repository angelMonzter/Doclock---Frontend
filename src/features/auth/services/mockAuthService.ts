import type { AuthService } from '../types';

// Datos públicos exclusivamente de demostración. No son credenciales reales.
export const demoCredentials = { email: 'demo@archivo.app', password: 'Archivo2026!' };
export const mockAuthService: AuthService = {
  async login(values) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (values.email.toLowerCase() !== demoCredentials.email || values.password !== demoCredentials.password) {
      throw new Error('El correo o la contraseña no coinciden. Revisa tus datos o usa el acceso de prueba.');
    }
    return { id: 'demo-user', name: 'Usuario de prueba', email: demoCredentials.email };
  },
};
