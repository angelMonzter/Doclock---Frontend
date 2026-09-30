# Verificación · 29 de septiembre de 2026

## Comprobaciones automáticas

- npm run typecheck: correcto.
- npm run build: correcto.
- npm test: 9 pruebas correctas en 2 archivos.
- Pruebas de dominio: login, validación de correo/contraseña, carga confirmada y métricas coherentes, fallo recuperable sin registros parciales, cancelación, validación de formatos/tamaños/metadatos, carpetas y duplicados, snapshots independientes y reset.
- Sin dependencias nuevas. Lockfile de la instalación anterior conservado; no se repitió auditoría de dependencias en esta entrega.
- Rollup emite avisos no bloqueantes por comentarios de optimización de Zod. El build finaliza correctamente.

## Comprobaciones en navegador

- Ruta /documentos sin sesión redirige a /login.
- Campos vacíos, foco en correo y mostrar contraseña verificados; acceso demo navega a Inicio.
- Crear carpeta actualiza listado; duplicado muestra error y enfoca el campo. Cancelar devuelve foco a Nueva carpeta.
- Búsqueda sin resultados, limpiar filtros, formato PDF, cuadrícula, selección, detalles y Escape verificados. El cierre restaura el foco y conserva filtros/vista.
- Carpeta vacía y destino preseleccionado al navegar a Subir verificados.
- Selección real mediante diálogo: PNG aceptado y MD rechazado; retirada del inválido funciona.
- Título vacío bloquea y recibe foco. Título largo no rompe el layout.
- Fallo simulado conserva cola; reintento exitoso incorpora 1 registro. Total pasa de 8 a 9, actividad incluye el documento y la carpeta destino lo muestra.
- Cancelar la simulación no incorpora registros.
- Recarga conserva identidad demo y restaura 8 documentos/7 carpetas iniciales.
- Logout vuelve al login; intentar /subir vuelve a login.
- Tab hacia acción principal y foco visible verificados; menú móvil abre, enfoca navegación y se cierra con Escape.
- Inicio, Documentos y Subir: sin overflow horizontal en 320, 768, 1024 y 1440 px. También se revisó 390px. Login revisado en escritorio y 320px.
- Capturas en docs/screenshots. Los estados de prueba capturados no forman parte de los datos iniciales.

## Límites

- No auditoría completa con lector de pantalla ni certificación WCAG.
- Selección por diálogo comprobada; arrastrar/soltar implementado, sin prueba manual de arrastre desde el escritorio.
- No backend ni contenido de archivos. La sesión y rutas son simulaciones, no mecanismos de autorización real.
- Durante las ediciones Vite registró un fallo transitorio de hot reload; la carga posterior de las rutas y la compilación final funcionan.

## Extensión de administración · 30 de septiembre de 2026

- Ocho rutas nuevas protegidas y enlazadas; las páginas previas solo se movieron al nivel principal de pages.
- Compilación TypeScript/Vite correcta. Avisos no bloqueantes de Zod y bundle principal de aproximadamente 517 kB sin comprimir.
- Pruebas de administración: duplicados normalizados, historial antes/después, snapshots independientes, reset, referencias de roles, bloqueo de desactivación con usuarios activos, reactivación con rol inactivo, enteros/rangos, capacidad, singleton, MIME y colores.
- Navegador: las ocho rutas se abren. Alta/edición de categoría, confirmación y movimiento en historial verificados; detalle muestra antes/después.
- Teclado: foco inicial del editor, retorno al botón Editar después de guardar y Escape/retorno a Crear verificados. Menú móvil abre y navega a Usuarios.
- Escritorio 1440×1000: tabla de categorías y navegación. Móvil 390×844: estado vacío de mensajes, formulario y tabla de usuarios con desplazamiento interno; ancho de documento 375px, sin desbordamiento global.
- Capturas: admin-desktop.jpg, admin-mobile.jpg, admin-form-mobile.jpg y admin-history.jpg.
- Carga, reintento de consulta y disabled están implementados; no se simuló fallo de transporte en navegador (el adaptador es local). No se certifica accesibilidad con lector de pantalla.
- Los cambios de administración no se aplican a la política documental ni al shell existente; se explicita en las vistas y MODULES_GAPS.md.
- Resultado final de esta extensión: 15 pruebas correctas en 3 archivos; build completado. Revisión visual externa: ship visual para capturas corregidas de escritorio y móvil; no equivale a auditoría de accesibilidad completa.
