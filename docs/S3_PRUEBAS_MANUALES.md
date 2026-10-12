# Pruebas manuales S3 desde el frontend

Ejecutar después de configurar el perfil AWS y reiniciar el backend. No usar documentos importantes para las pruebas. La BD utilizada contiene información real: identificar todos los documentos de prueba con prefijo `PRUEBA-S3`. Anotar valores de configuración antes de probar límites y restaurarlos al terminar. Papelera no libera cuota ni elimina los objetos de AWS.

| Caso | Pasos | Resultado esperado |
| --- | --- | --- |
| Crear carpeta | Documentos → Nueva carpeta → `PRUEBA-S3-Proyecciones`. Recargar. Revisar S3. | Persiste en BD y aparece el prefijo vacío en S3. |
| Subcarpeta | Abrir esa carpeta y crear `Cotizaciones`. | Prefijo `PRUEBA-S3-Proyecciones/Cotizaciones/`; navegación correcta. |
| Carga individual | Subir un PDF válido con categoría y título propios. | Confirmación, fila al recargar, objeto en carpeta y espacio aumentado por sus bytes. |
| Lote con títulos | Seleccionar PDF y PNG válidos con títulos diferentes. | Se confirman juntos y cada documento mantiene su título. |
| Descargar | Abrir detalles → Descargar. | Contenido idéntico, nombre igual al título con su extensión. Bucket sigue privado. |
| Renombrar | Editar título, guardar y descargar de nuevo. | Nuevo nombre de descarga; mismo objeto/contenido, nombre original conservado. |
| Mover documento | Editar carpeta destino. | Cambia en UI y sus versiones se copian al prefijo destino; cuota documental sin incremento. |
| Renombrar carpeta | Abrir carpeta → Administrar esta carpeta → cambiar nombre. | Nueva ruta S3 y navegación actualizada; documentos/descargas siguen funcionando. |
| Nueva versión | Detalles → Versiones → seleccionar otro PDF y comentario. | Nueva versión, tamaño acumulado de ambas; descarga vigente devuelve nuevo contenido. |
| Restaurar versión | Elegir versión anterior y confirmar. | Vuelve el contenido anterior; las demás versiones permanecen y cuota no disminuye. |
| Papelera | Enviar documento a papelera confirmando. | Desaparece de activos; aparece en Papelera; espacio no baja. |
| Restaurar documento | Papelera → Restaurar. | Regresa a carpeta y vuelve a descargar. |
| Carpeta vacía | Enviar carpeta vacía a papelera, luego restaurarla. | Cambio lógico y restauración; marcador físico puede conservarse. |
| Carpeta con contenido | Intentar enviar una carpeta con documentos/subcarpetas a papelera. | Error; permanece intacta. Incluye contenido que esté en papelera. |
| Duplicado de carpeta | Crear mismo nombre bajo el mismo padre. | Error sin carpeta extra confirmada. |
| Nombre inválido | Nombre de carpeta con `/`, `\`, `..` o `documentos`. | Error de validación, sin prefijo nuevo. |
| Extensión inválida | Seleccionar un `.exe`. | Rechazo antes de enviar. |
| Firma inválida | Crear un archivo de texto y renombrarlo a `.pdf`. | Puede superar validación por extensión; servidor rechaza tipo real. No documento confirmado. |
| Lote parcialmente inválido | PDF válido + falso PDF anterior. | Ningún registro del lote confirmado; se limpian las versiones AWS conocidas creadas antes del fallo. |
| Vacío | Seleccionar archivo de 0 bytes. | Error y bloqueo de confirmación. |
| Archivo grande | Seleccionar uno mayor a 20 MiB. | Error; no se acepta. |
| Cantidad | Seleccionar 11 archivos válidos. | Solo admite 10 y avisa del límite. |
| Cuota agotada | En entorno controlado, fijar cuota al uso actual + menos bytes que el lote, manteniendo cuota >= máximo por archivo. Ajustar primero ese máximo si hace falta. | UI o API rechaza por capacidad; restaurar ambos valores originales. No subir 30 GiB para probar esto. |
| Cambiar políticas | Reducir el tamaño permitido mientras existe cola pendiente; volver a Subir. | Se revalida antes de confirmar con la política actual. |
| Categoría inactiva | Desactivar una categoría de prueba y volver a Subir. | No puede utilizarse para nueva carga; reactivarla al terminar. |
| Sin permiso subir | Usuario de solo lectura. | Subida deshabilitada y petición directa rechazada por backend. |
| Sin permiso editar | Usuario lector → detalles. | No muestra edición/reemplazo/restauración de versión. API devuelve 403 si se intenta directamente. |
| Sin permiso eliminar | Usuario lector. | No permite enviar a papelera ni restaurar documentos. |
| Sin gestionar carpetas | Usuario con carga pero sin ese permiso. | No puede crear, editar ni restaurar carpetas. |
| Descargas desactivadas | Administrador desactiva descargas, volver a detalles. | Control deshabilitado y API rechaza nuevas solicitudes; enlaces ya emitidos pueden funcionar hasta vencer. |
| Reemplazo desactivado | Desactivar reemplazos. | No permite cargar ni restaurar versiones. |
| Sesión vencida | Invalidar el token de una sesión de prueba. | Respuesta 401 limpia sesión; no muestra éxito. |
| Red caída antes de envío | Herramientas del navegador → Red → sin conexión. Intentar subir. | Error de conectividad, sin éxito ficticio. |
| Red caída durante envío | Cortar conexión durante el lote o cancelar. Restablecer y revisar Documentos. | Advertencia de resultado no confirmado. El backend podría haber confirmado todo; no repetir sin revisar. Nunca se debe asumir que cancelar deshace un COMMIT. |
| Credenciales AWS inválidas | En entorno de prueba usar perfil inexistente y reiniciar; crear carpeta/subir. | Error de almacenamiento, sin fila confirmada. Restaurar perfil y reiniciar. |
| Permiso AWS denegado | Probar con identidad de prueba que carezca de PutObject. | Error, sin confirmación. No retirar permisos de una identidad compartida de producción. |
| Recarga | Tras una operación exitosa recargar o cerrar/abrir sesión. | Datos persisten; el resumen mantiene el uso real registrado. |
| Teclado/móvil | A 320, 768, 1024 y 1440 px; Tab, Shift+Tab, Enter y Escape en detalles. | Controles alcanzables, etiquetas claras, errores legibles, sin desbordamientos. |

Confirmar MySQL: archivo, versión, tamaño, ruta y VersionId de AWS. Confirmar AWS: objetos y versiones correspondientes. No editar filas de documentos manualmente para simular espacio; usar configuración y archivos de prueba.

No ejecutar pruebas de borrado definitivo, Lifecycle o reconciliación: esas funciones quedan pendientes.
