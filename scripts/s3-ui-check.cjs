//code mode S3: revisión visual aislada; todas las rutas /api se interceptan.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.addInitScript(() => sessionStorage.setItem('archivo.api.session.v1', 'visual-test'));
        const permissions = Object.fromEntries(['ver_archivos', 'subir_archivos', 'editar_archivos', 'eliminar_archivos', 'gestionar_carpetas', 'gestionar_categorias', 'gestionar_configuracion', 'ver_historial', 'gestionar_usuarios'].map((name) => ['puede_' + name, 1]));
        const document = { id_archivo: 'ARCHIVO001', titulo: 'PRUEBA-S3 Proyección anual', nombre_original: 'proyeccion.pdf', extension: 'pdf', tamano_bytes: 500, sid_carpeta: 'CARPETA001', sid_categoria: 'CATEGORIA1', descripcion: 'Documento para revisión visual aislada.', usuario_subida: 'Usuario de pruebas', fecha_subida: '2026-10-09 12:00:00' };
        await page.route('**/api/**', async (route) => {
            const url = new URL(route.request().url());
            const endpoint = url.pathname.slice(4);
            let body;
            if (endpoint === '/auth/me') body = { id_usuario: 'USUARIO001', nombre: 'Usuario de pruebas', correo: 'visual@example.test', sid_rol: 'ROLADMIN01', rol: 'Administrador', ...permissions };
            else if (endpoint === '/configuracion/archivos/uso') body = { bytes_utilizados: 500, almacenamiento_maximo_bytes: 32212254720, tamano_maximo_efectivo_bytes: 20971520, archivos_maximos_efectivos: 10, permitir_descargas: 1, permitir_reemplazar_archivos: 1 };
            else if (endpoint === '/archivos/lote') body = { ids: ['ARCHIVO002'] };
            else if (endpoint === '/archivos/resumen') body = { total: 1, categories: 1, today: 1, folders: [{ id: 'CARPETA001', total: 1 }], extensions: ['pdf'] };
            else if (endpoint === '/archivos/ARCHIVO001') body = document;
            else if (endpoint === '/archivos/ARCHIVO001/versiones') body = [{ id_version: 'VERSION001', numero_version: 1, nombre_original: 'proyeccion.pdf', tamano_bytes: 500, comentario: 'Inicial' }];
            else if (url.searchParams.get('papelera') === '1') body = [];
            else if (endpoint === '/archivos') body = [document];
            else if (endpoint === '/carpetas') body = [{ id_carpeta: 'CARPETA001', nombre: 'Proyecciones', sid_carpeta_padre: null }];
            else if (endpoint === '/categorias') body = [{ id_categoria: 'CATEGORIA1', nombre: 'Informes', activo: 1 }];
            else if (endpoint === '/tipos-archivo') body = [{ extensiones: ['pdf', 'png'], activo: 1 }];
            else body = { msg: 'Operación simulada por la prueba' };
            if (url.searchParams.get('paginated') === '1' && Array.isArray(body)) body = { items: body, total: body.length, offset: 0, limit: Number(url.searchParams.get('limit')) };
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
        });
        for (const width of [320, 768, 1024, 1440]) {
            await page.setViewportSize({ width, height: 950 });
            await page.goto('http://127.0.0.1:5174/documentos?documento=ARCHIVO001');
            await page.getByText('Editar y mover documento').click();
            await page.getByText('Versiones del documento', { exact: true }).click();
            await page.getByRole('button', { name: 'Subir nueva versión' }).waitFor();
            await page.evaluate(() => document.fonts.ready);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Desbordamiento en ' + width);
            await page.screenshot({ path: path.join(__dirname, '../docs/screenshots/s3-actions-' + width + '.png'), fullPage: true });
            await page.getByLabel('Título', { exact: true }).focus();
            await page.keyboard.press('Tab');
            console.log('Foco tras Tab:', width, await page.evaluate(() => ({ url: location.href, tag: document.activeElement?.tagName, textareas: document.querySelectorAll('textarea').length })));
            assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'TEXTAREA');
        }
        await page.goto('http://127.0.0.1:5174/subir');
        await page.getByLabel('Seleccionar archivos desde tu equipo').setInputFiles({ name: 'prueba.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
        await page.getByLabel('Categoría', { exact: false }).selectOption('CATEGORIA1');
        await page.getByRole('button', { name: 'Subir 1 archivo', exact: true }).click();
        await page.getByText('Carga confirmada. Los documentos están disponibles en el sistema.').waitFor();
        assert.deepEqual(errors, []);
        console.log('Revisión visual: 320/768/1024/1440 px, teclado, versiones y carga HTTP simulada correctos.');
    } finally {
        await browser.close();
    }
})().catch((error) => { console.error(error); process.exitCode = 1; });
