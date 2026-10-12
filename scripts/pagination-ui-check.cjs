const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

// Todas las peticiones se interceptan: esta prueba no escribe en MySQL ni S3.
(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage();
        const errors = [];
        const requests = [];
        let failHistory = false;
        page.on('pageerror', (error) => errors.push(error.message));
        await page.addInitScript(() => sessionStorage.setItem('archivo.api.session.v1', 'pagination-test'));
        const rows = Array.from({ length: 31 }, (_, i) => ({
            id_historial: 'H' + String(i).padStart(9, '0'), usuario: 'Usuario de prueba', entidad: 'archivos', accion: 'subir',
            descripcion: 'Movimiento ' + (i + 1), fecha_evento: '2026-10-11 12:00:00', datos_anteriores: null, datos_nuevos: null,
            id_usuario: 'U' + String(i).padStart(9, '0'), nombre: 'Registro ' + (i + 1), correo: `user${i}@example.test`, sid_rol: 'ROLADMIN01',
            id_categoria: 'C' + String(i).padStart(9, '0'), id_rol: 'R' + String(i).padStart(9, '0'), activo: 1,
            fecha_creacion: '2026-10-11 12:00:00', fecha_actualizacion: '2026-10-11 12:00:00',
            id_archivo: 'A' + String(i).padStart(9, '0'), titulo: 'Archivo ' + (i + 1), nombre_original: 'archivo.pdf', extension: 'pdf', tamano_bytes: 500,
            sid_carpeta: null, sid_categoria: 'C000000000', fecha_subida: '2026-10-11 12:00:00', usuario_subida: 'Usuario de prueba',
            id_version: 'V' + String(i).padStart(9, '0'), numero_version: i + 1,
        }));
        const permissions = Object.fromEntries(['ver_archivos', 'subir_archivos', 'editar_archivos', 'eliminar_archivos', 'gestionar_carpetas', 'gestionar_categorias', 'gestionar_configuracion', 'ver_historial', 'gestionar_usuarios'].map((name) => ['puede_' + name, 1]));
        await page.route('**/api/**', async (route) => {
            const url = new URL(route.request().url());
            const endpoint = url.pathname.slice(4);
            requests.push(url);
            if (endpoint === '/historial' && failHistory) {
                return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ msg: 'Fallo controlado' }) });
            }
            let body;
            if (endpoint === '/auth/me') body = { id_usuario: 'USUARIO001', nombre: 'Pruebas', correo: 'test@example.test', sid_rol: 'ROLADMIN01', rol: 'Administrador', ...permissions };
            else if (endpoint === '/configuracion/archivos/uso') body = { bytes_utilizados: 15500, almacenamiento_maximo_bytes: 32212254720, tamano_maximo_efectivo_bytes: 20971520, archivos_maximos_efectivos: 10, permitir_descargas: 1, permitir_reemplazar_archivos: 1 };
            else if (endpoint === '/archivos/resumen') body = { total: 31, categories: 1, today: 31, folders: [], extensions: ['pdf'] };
            else if (endpoint === '/carpetas') body = Array.from({ length: 31 }, (_, i) => ({ id_carpeta: 'F' + String(i).padStart(9, '0'), nombre: 'Carpeta ' + (i + 1), sid_carpeta_padre: null }));
            else if (endpoint === '/tipos-archivo') body = [{ extensiones: ['pdf'], activo: 1 }];
            else if (url.searchParams.get('paginated') === '1') {
                const offset = Number(url.searchParams.get('offset'));
                const limit = Number(url.searchParams.get('limit'));
                const search = url.searchParams.get('search');
                const filtered = search ? rows.filter((row) => `${row.descripcion} ${row.nombre}`.includes(search)) : rows;
                body = { items: filtered.slice(offset, offset + limit), total: filtered.length, offset, limit, entities: ['archivos'], actions: ['subir'] };
                if (endpoint === '/archivos/papelera') body.items = body.items.map((row) => ({ id: row.id_archivo, name: row.titulo, kind: 'archivos' }));
            } else if (endpoint.startsWith('/archivos/')) body = rows.find((row) => row.id_archivo === endpoint.split('/')[2]);
            else body = rows.slice(0, Number(url.searchParams.get('limit') ?? 100));
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
        });
        for (const width of [320, 768, 1024, 1440]) {
            await page.setViewportSize({ width, height: 950 });
            for (const route of ['historial', 'usuarios', 'roles', 'categorias', 'documentos', 'tipos-archivo', 'mensajes']) {
                await page.goto('http://127.0.0.1:5174/' + route);
                const nav = page.getByRole('navigation', { name: /Paginación/ }).first();
                await nav.waitFor();
                await page.evaluate(() => document.fonts.ready);
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${route}: desbordamiento a ${width}px`);
                if (route === 'historial') {
                    const next = nav.getByRole('button', { name: 'Siguiente' });
                    await next.focus();
                    await page.keyboard.press('Enter');
                    await page.getByText('Movimiento 26', { exact: true }).waitFor();
                    assert.equal(await page.getByText('Movimiento 1', { exact: true }).count(), 0);
                    assert.equal(await next.isDisabled(), true);
                    await page.getByLabel('Buscar por descripción o usuario').fill('Movimiento 1');
                    await page.getByText('Movimiento 1', { exact: true }).waitFor();
                    await page.screenshot({ path: path.join(__dirname, `../docs/screenshots/pagination-${width}.png`), fullPage: false });
                }
            }
        }
        await page.goto('http://127.0.0.1:5174/documentos?documento=A000000030');
        await page.getByText('Versiones del documento', { exact: true }).click();
        await page.getByRole('navigation', { name: 'Paginación de versiones' }).getByRole('button', { name: 'Siguiente' }).click();
        await page.getByText('Versión 26', { exact: true }).waitFor();
        await page.getByText('Papelera', { exact: true }).click();
        await page.getByRole('navigation', { name: 'Paginación de papelera' }).waitFor();
        failHistory = true;
        await page.goto('http://127.0.0.1:5174/historial');
        await page.getByRole('alert').filter({ hasText: 'Fallo controlado' }).waitFor();
        failHistory = false;
        await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
        await page.getByText('Movimiento 1', { exact: true }).waitFor();
        assert.ok(requests.filter((url) => url.pathname === '/api/historial').every((url) => url.searchParams.get('paginated') === '1'));
        assert.deepEqual(errors, []);
        console.log('Paginación verificada: siete pantallas a 320/768/1024/1440 px, teclado, filtros, error/reintento, versiones y papelera.');
    } finally {
        await browser.close();
    }
})().catch((error) => { console.error(error); process.exitCode = 1; });
