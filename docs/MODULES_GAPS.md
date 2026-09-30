# Cobertura de módulos y diferencias con db.sql

## Entrega

| Tabla | Interfaz |
| --- | --- |
| archivos / carpetas | Documentos y Subir existentes, sin modificación de contenido |
| categorias | /categorias: alta, edición, color, estado, búsqueda |
| usuarios / vista_usuarios | /usuarios: alta demo, edición, correo único, rol y estado |
| roles | /roles: alta, edición, los nueve permisos SQL y estado |
| historial / vista_historial | /historial: movimientos de administración, filtros y antes/después |
| configuracion_apariencia | /apariencia: empresa, tema, ruta S3, colores y vista previa local del menú |
| configuracion_archivos | /configuracion-archivos: tamaños en bytes, cantidad, capacidad nullable, papelera, descargas y reemplazo |
| tipos_archivo_permitidos | /tipos-archivo: MIME único, descripción y estado |
| mensajes_sistema / vista_mensajes_activos | /mensajes: catálogo completo y vista previa de textos |

Las vistas SQL son proyecciones de tablas, no módulos adicionales. Las fechas e identificadores administrativos se generan en la demo; el backend será responsable de sus valores reales. Los permisos de roles se editan pero no se aplican a la sesión demo. No hay eliminación física: se edita Activo para desactivar.

## Pendientes de integración de interfaz

- Conectar un adaptador real de cada interfaz de servicio a API autorizada; validar permisos también en backend.
- Unificar categorías administrativas con los selectores/documentos, políticas con la carga, mensajes con avisos, apariencia con el shell e historial con eventos documentales. En esta entrega se preservan las primeras pantallas y sus datos. Cada módulo nuevo advierte esta separación.
- Alta real de usuarios: falta flujo de contraseña inicial/invitación y recuperación. No pedir ni almacenar contraseñas en el catálogo de prueba.
- Documentos: no existen todavía descarga real, reemplazo/versiones, editar metadatos, mover/eliminar/restaurar archivos, papelera ni edición/desactivación de carpetas. La navegación y creación de carpetas ya existen.
- El tema y logotipo guardados se preparan como valores; la vista previa muestra colores del menú. No hay carga S3 ni aplicación global del tema.
- Historial real debe guardar actor por sid_usuario y dirección IP en servidor; la demo solo registra nombre de sesión y cambios de administración. vista_historial no incluye datos_anteriores/datos_nuevos: el detalle deberá consultar la tabla o ampliar la vista.

## Diferencias y decisiones pendientes en la BD

- La UI documental actual usa título separado de nombre_original; archivos no tiene columna titulo. Añadirla mediante migración o decidir que el título es nombre_original.
- dias_papelera existe, pero archivos/carpetas no guardan fecha_eliminacion ni usuario de eliminación. activo solo no permite calcular vencimiento de papelera; una migración debe definir dichos campos y restauración.
- permitir_reemplazar_archivos no conserva versiones. Si se requiere historial de contenidos/restauración, hace falta un modelo de versiones; si solo se sobrescribe, documentar esa decisión.
- roles no distingue gestionar roles ni gestionar mensajes ni descargar: definir si dependen de gestionar_usuarios/configuracion y del permiso global de descargas, o incorporar permisos específicos.
- Las tablas de configuración permiten múltiples filas; GLOBAL0001 es una convención inicial, no una garantía de singleton. La API debe imponer un registro global.
- Relaciones sid_* sin FOREIGN KEY son una decisión explícita del SQL: deben validarse en backend, igual que jerarquías sin ciclos y referencias activas.
- UNIQUE nombre/correo depende de la collation seleccionada; alinear normalización y sensibilidad a mayúsculas con la API.
- No hay usuario inicial en db.sql. El despliegue real necesita un alta administrativa segura con hash de contraseña, no la credencial de la demo.
- IDs históricos de documentos/categorías dummy no tienen diez caracteres. Al conectar API se sustituirán por los IDs backend; no migrar los ejemplos como datos reales.

No se ejecutó ni modificó db.sql. Los cambios SQL requieren decidir estas reglas y preparar una migración, ya que el script actual crea tablas desde cero.
