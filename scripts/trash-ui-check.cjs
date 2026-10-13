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
    await page.addInitScript(() =>
      sessionStorage.setItem('archivo.api.session.v1', 'visual-test'),
    );
    const permissions = Object.fromEntries(
      [
        'ver_archivos',
        'subir_archivos',
        'editar_archivos',
        'eliminar_archivos',
        'gestionar_carpetas',
        'gestionar_categorias',
        'gestionar_configuracion',
        'ver_historial',
        'gestionar_usuarios',
      ].map((name) => ['puede_' + name, 1]),
    );
    const document = {
      id_archivo: 'ARCHIVO001',
      titulo: 'PRUEBA-S3 Proyección anual',
      nombre_original: 'proyeccion.pdf',
      extension: 'pdf',
      tamano_bytes: 500,
      sid_carpeta: 'CARPETA001',
      sid_categoria: 'CATEGORIA1',
      descripcion: 'Documento para revisión visual aislada.',
      usuario_subida: 'Usuario de pruebas',
      fecha_subida: '2026-10-09 12:00:00',
    };
    let removed = false;
    let pending = 0;
    const writes = [];
    permissions.puede_vaciar_papelera = 1;
    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      const endpoint = url.pathname.slice(4);
      let body;
      if (endpoint === '/archivos/papelera/vaciar') {
        const body = route.request().postDataJSON();
        writes.push(body);
        removed = true;
        pending = body.solo_pendientes ? 0 : 1;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            eliminados: 1,
            pendientes: pending,
            msg: pending ? 'Limpieza pendiente.' : 'Limpieza completada.',
          }),
        });
      }
      if (endpoint === '/archivos/papelera')
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: removed
              ? []
              : [{ id: 'ARCHIVO002', name: 'Cotización', kind: 'archivos' }],
            total: removed ? 0 : 1,
            limit: 25,
            offset: 0,
            pendientes: pending,
          }),
        });
      if (endpoint === '/historial')
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id_historial: 'HISTORY001',
                usuario: 'Mariana',
                entidad: 'archivos',
                accion: 'eliminar_definitivamente',
                descripcion:
                  'Mariana eliminó el archivo «Cotización» de la papelera; ya no se puede restaurar.',
                fecha_evento: '2026-10-13 12:00:00',
                datos_anteriores: { titulo: 'Cotización', ruta_s3: 'privado' },
                datos_nuevos: null,
              },
            ],
            total: 1,
            limit: 25,
            offset: 0,
            entities: ['archivos'],
            actions: ['eliminar_definitivamente'],
          }),
        });
      if (endpoint === '/auth/me')
        body = {
          id_usuario: 'USUARIO001',
          nombre: 'Usuario de pruebas',
          correo: 'visual@example.test',
          sid_rol: 'ROLADMIN01',
          rol: 'Administrador',
          ...permissions,
        };
      else if (endpoint === '/configuracion/archivos/uso')
        body = {
          bytes_utilizados: 500,
          almacenamiento_maximo_bytes: 32212254720,
          tamano_maximo_efectivo_bytes: 20971520,
          archivos_maximos_efectivos: 10,
          permitir_descargas: 1,
          permitir_reemplazar_archivos: 1,
        };
      else if (endpoint === '/archivos/lote') body = { ids: ['ARCHIVO002'] };
      else if (endpoint === '/archivos/resumen')
        body = {
          total: 1,
          categories: 1,
          today: 1,
          folders: [{ id: 'CARPETA001', total: 1 }],
          extensions: ['pdf'],
        };
      else if (endpoint === '/archivos/ARCHIVO001') body = document;
      else if (endpoint === '/archivos/ARCHIVO001/versiones')
        body = [
          {
            id_version: 'VERSION001',
            numero_version: 1,
            nombre_original: 'proyeccion.pdf',
            tamano_bytes: 500,
            comentario: 'Inicial',
          },
        ];
      else if (url.searchParams.get('papelera') === '1') body = [];
      else if (endpoint === '/archivos') body = [document];
      else if (endpoint === '/carpetas')
        body = [
          {
            id_carpeta: 'CARPETA001',
            nombre: 'Proyecciones',
            sid_carpeta_padre: null,
          },
        ];
      else if (endpoint === '/categorias')
        body = [{ id_categoria: 'CATEGORIA1', nombre: 'Informes', activo: 1 }];
      else if (endpoint === '/tipos-archivo')
        body = [{ extensiones: ['pdf', 'png'], activo: 1 }];
      else body = { msg: 'Operación simulada por la prueba' };
      if (url.searchParams.get('paginated') === '1' && Array.isArray(body))
        body = {
          items: body,
          total: body.length,
          offset: 0,
          limit: Number(url.searchParams.get('limit')),
        };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    for (const width of [320, 768, 1024, 1440]) {
      removed = false;
      pending = 0;
      await page.setViewportSize({ width, height: 950 });
      await page.goto('http://127.0.0.1:5174/documentos');
      await page.getByText('Papelera', { exact: true }).click();
      await page
        .getByRole('button', { name: 'Restaurar Cotización' })
        .waitFor();
      await page
        .getByRole('button', { name: 'Vaciar papelera', exact: true })
        .click();
      await page.keyboard.press('Escape');
      assert.equal(
        await page
          .getByRole('button', { name: 'Vaciar papelera', exact: true })
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await page
        .getByRole('button', { name: 'Vaciar papelera', exact: true })
        .click();
      await page.getByRole('button', { name: 'Sí, vaciar papelera' }).click();
      await page
        .getByText('La papelera está vacía.', { exact: true })
        .waitFor();
      await page.getByRole('button', { name: 'Reintentar limpieza' }).click();
      await page.getByText('Limpieza completada.', { exact: true }).waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await page.screenshot({
        path: path.join(
          __dirname,
          '../docs/screenshots/trash-' + width + '.png',
        ),
        fullPage: true,
      });
    }
    assert.equal(writes.length, 8);
    assert.equal(writes.filter((item) => item.solo_pendientes).length, 4);
    permissions.puede_vaciar_papelera = 0;
    await page.goto('http://127.0.0.1:5174/documentos');
    await page.getByText('Papelera', { exact: true }).click();
    assert.equal(
      await page
        .getByRole('button', { name: 'Vaciar papelera', exact: true })
        .isDisabled(),
      true,
    );
    await page.goto('http://127.0.0.1:5174/historial');
    await page
      .getByText(
        'Mariana eliminó el archivo «Cotización» de la papelera; ya no se puede restaurar.',
        { exact: true },
      )
      .waitFor();
    await page.getByText('Ver cambios', { exact: true }).click();
    assert.equal(await page.getByText('privado', { exact: true }).count(), 0);
    await page.screenshot({
      path: path.join(__dirname, '../docs/screenshots/trash-history.png'),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      'Papelera: permiso, confirmación, Escape, limpieza pendiente, reintento e historial; 320/768/1024/1440 px correctos.',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
