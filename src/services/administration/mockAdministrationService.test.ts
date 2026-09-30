import { describe, expect, it } from 'vitest';
import { createMockAdministrationService, defaultValues } from './mockAdministrationService';

describe('administración simulada', () => {
  it('rechaza duplicados normalizados y no escribe historial por errores', async () => {
    const service = createMockAdministrationService();
    await service.save('categories', { ...defaultValues('categories'), nombre: '  Nueva  ' }, 'Demo');
    await expect(service.save('categories', { ...defaultValues('categories'), nombre: 'nueva' }, 'Demo')).rejects.toThrow('Ya existe');
    const snapshot = await service.getSnapshot();
    expect(snapshot.history).toHaveLength(1);
    expect(snapshot.history[0].after.values.nombre).toBe('Nueva');
  });
  it('conserva antes/después inmutables y restablece los datos', async () => {
    const service = createMockAdministrationService();
    const created = await service.save('messages', { ...defaultValues('messages'), codigo: 'UPLOAD_OK', contexto: 'carga', titulo: 'Listo', contenido: 'Carga completa' }, 'Demo');
    await service.save('messages', { ...created.values, titulo: 'Guardado' }, 'Demo', created.id);
    const snapshot = await service.getSnapshot();
    expect(snapshot.history[0].before?.values.titulo).toBe('Listo');
    expect(snapshot.history[0].after.values.titulo).toBe('Guardado');
    snapshot.records.messages[0].values.titulo = 'Mutación externa';
    expect((await service.getSnapshot()).records.messages[0].values.titulo).toBe('Guardado');
    service.reset();
    expect((await service.getSnapshot()).history).toEqual([]);
  });
  it('exige roles válidos y protege los roles asignados', async () => {
    const service = createMockAdministrationService();
    await expect(service.save('users', { ...defaultValues('users'), nombre: 'Ana', correo: 'ana@example.com', sid_rol: 'missing' }, 'Demo')).rejects.toThrow('rol activo');
    const admin = (await service.getSnapshot()).records.roles[0];
    await expect(service.save('roles', { ...admin.values, activo: false }, 'Demo', admin.id)).rejects.toThrow('Reasigna');
  });
  it('valida límites enteros, capacidad y configuración única', async () => {
    const service = createMockAdministrationService();
    const values = defaultValues('fileSettings');
    await expect(service.save('fileSettings', { ...values, archivos_maximos_por_carga: 1.5 }, 'Demo', 'GLOBAL0001')).rejects.toThrow('entero');
    await expect(service.save('fileSettings', { ...values, almacenamiento_maximo_bytes: 1 }, 'Demo', 'GLOBAL0001')).rejects.toThrow('capacidad');
    await expect(service.save('fileSettings', values, 'Demo')).rejects.toThrow('existente');
  });
  it('no reactiva usuarios con un rol inactivo', async () => {
    const service = createMockAdministrationService();
    const snapshot = await service.getSnapshot();
    const user = snapshot.records.users[0];
    const role = snapshot.records.roles[0];
    await service.save('users', { ...user.values, activo: false }, 'Demo', user.id);
    await service.save('roles', { ...role.values, activo: false }, 'Demo', role.id);
    await expect(service.save('users', { ...user.values, activo: true }, 'Demo', user.id)).rejects.toThrow('rol activo');
  });
  it('rechaza MIME y colores inválidos', async () => {
    const service = createMockAdministrationService();
    await expect(service.save('fileTypes', { ...defaultValues('fileTypes'), tipo_mime: 'pdf' }, 'Demo')).rejects.toThrow('MIME');
    await expect(service.save('appearance', { ...defaultValues('appearance'), color_menu: 'red' }, 'Demo', 'GLOBAL0001')).rejects.toThrow('hexadecimal');
  });
});

