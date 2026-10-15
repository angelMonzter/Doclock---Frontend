# Contratos, consumidores e impacto

- `LoginForm`: el botón de acceso permanece desactivado mientras falte correo o contraseña, y durante la petición. Su cursor desactivado es normal; conserva la validación y el indicador interno de envío existentes. El estilo se limita a `.login-submit` y no modifica `Button` compartido.

## Color de categorías

- `CategoryLabel` pertenece al módulo `components/categories`. Props: `name?: string | null`, `color?: string | null`; sin color predeterminado. Solo muestra un indicador decorativo para valores hexadecimales de seis dígitos. El nombre permanece legible y, si falta, indica «Categoría no disponible». No consulta servicios ni añade interacción o foco.
- Consumidores: `CategoriesPage`, vista previa de `CategoryForm`, `DocumentCollection` (Inicio y Documentos, lista/cuadrícula) y `DocumentDetails`. Estilos locales en `category-label.css`; etiqueta con fondo blanco, texto negro, borde del color elegido y pestaña izquierda de 9px. Sin color usa borde neutro y omite la pestaña. Los nombres largos pueden partirse.
- `Category.color` es opcional y nullable; `repositoryService` conserva el valor real de la API y representa su ausencia con `null`. No se asignan colores de ejemplo ni se cambia el filtrado de categorías activas.
- El formulario permite un hexadecimal opcional o el selector nativo. El negro inicial del selector es únicamente el valor técnico que exige `input[type=color]`; no se asigna al registro hasta una selección del usuario. El campo textual vacío se guarda como `null`. La vista previa usa el nombre escrito, nunca uno de ejemplo. Guardar mantiene la invalidación de consultas existente.
- Estados de carga, error, permisos y disabled siguen a cargo de los componentes existentes. El indicador es decorativo (`aria-hidden`), no sustituye el nombre ni los estados de selección y no altera los colores de los iconos de archivo. Los transportes simulados de pruebas permanecen aislados del flujo real.

## Operaciones documentales S3

Esta sección sustituye la descripción anterior de subida simulada. Comentarios `//code mode S3` identifican el cambio. El dummy permanece separado y se usa únicamente en sus pruebas.

- `DocumentActionsService` define carga real con `File`, edición/movimiento, descarga, versiones y papelera. `documentActionsService` usa el transporte HTTP autenticado; XHR se limita al lote para medir envío. No mezcla resultados simulados ni credenciales AWS con el navegador.
- `useUploadQueue` conserva los objetos File solo en memoria; la cola revalida política/categoría/capacidad antes de enviar un multipart atómico con títulos individuales. El progreso llega hasta 99 durante transporte y 100 solo con confirmación. Cancelación o respuesta perdida advierten resultado incierto; no hay reintento automático. El servidor puede completar el lote si ya recibió el contenido.
- `useDocumentAction` concentra estado de mutación e invalidación de repositorio, historial, versiones y papelera. Errores no confirman éxito. Los permisos se aplican en UI y backend.
- `DocumentActions` es documental y recibe `document: DocumentFile` y `data: RepositorySnapshot`, sin defaults; solo lo consume `DocumentDetails`, montado por ID. Usa controles existentes para edición, movimiento y confirmación de papelera. Error de acción enfoca el aviso. `DocumentDetails.data` ahora requiere RepositorySnapshot; consumidor único DocumentsPage actualizado.
- `DocumentVersions` recibe `documentId` y `data`, sin defaults. Consulta al abrir el details, muestra error/reintento/carga, permite descargar versiones y, con política y permiso, cargar/restaurar una versión. Las confirmaciones conservan versiones previas.
- `RepositoryTrash` no recibe props; lo compone DocumentsPage. Consulta al abrir, restaura con permisos y no ofrece eliminación física. `FolderActions` recibe `folder` y `folders`; administra nombre, padre y envío de carpetas vacías a papelera. Descendientes se excluyen del selector; backend valida ciclos.
- `FilePolicy` añade allowDownloads/allowReplacement opcionales por compatibilidad de fixtures; su ausencia no habilita acciones. La API real devuelve ambos valores. RepositoryService añade updateFolder. apiRequest admite FormData sin forzar Content-Type; consumidores JSON conservan comportamiento.
- Los componentes ui no cambian. Se añaden reglas locales `.document-actions` para asegurar formularios de una columna en el panel de detalle y evitar desbordamiento de archivos/nombres; se reutilizan layout, colores, controles y breakpoints existentes.
- MySQL recibe columnas nullable para rutas y VersionId AWS, sin recrear tablas. El dashboard sigue usando SUM(tamano_bytes) de todas las versiones; no equivale a facturación AWS cuando existan objetos huérfanos/no registrados.

Guías: `backend/docs/S3_IMPLEMENTACION.md` y `frontend/docs/S3_PRUEBAS_MANUALES.md`. Limpieza programada, reconciliación, recuperación e idempotencia persistente de reintentos permanecen pendientes antes de producción.

Verificación: build aprobado, 52 pruebas frontend y 42 backend aprobadas. Navegador Edge con todas las respuestas API simuladas: revisión de acciones a 320, 768, 1024 y 1440 px sin desbordamiento horizontal, Tab de título a descripción, panel de versiones y envío de archivo hasta confirmación. Capturas en `docs/screenshots/s3-actions-*.png`. No se efectuaron cargas reales AWS; el perfil local anterior no autentica y el perfil dedicado debe configurarlo el usuario.

## Integración del repositorio y políticas reales

Esta sección actualiza las referencias históricas a simulación de carpetas, categorías, límites y almacenamiento. La subida del contenido sigue simulada por decisión de alcance; no se modifica S3, el diseño ni los componentes UI compartidos.

- `RepositoryService` (`types/repository.ts`) separa consultas y creación de carpetas reales de `DocumentService`, que conserva la simulación. `repositoryService` adapta todas las páginas de la API, filtra categorías/tipos activos y consulta documentos solo si la sesión tiene permiso. Los errores se muestran sin recurrir a datos dummy.
- `useDocuments` consulta por usuario y permisos, refresca al montar/recuperar foco y expone `RepositorySnapshot`: documentos, carpetas, categorías, actividad de incorporaciones, `policy` y `storageBytes`. El guardado de categorías/configuración invalida este snapshot; crear carpetas también refresca historial. No se almacenan copias permanentes en el navegador.
- `FilePolicy` define extensiones, tamaño máximo efectivo, cantidad máxima efectiva y capacidad nullable (null = sin límite). El backend publica el menor límite entre BD y servidor. El almacenamiento cuenta todas las versiones, incluida papelera; nunca se deriva solo de los documentos visibles.
- `CreateFolderForm` sigue siendo un componente documental, con las mismas props y foco/disabled/error. Guarda mediante POST `/carpetas`; la acción se deshabilita sin permiso. `DocumentsPage` obtiene carpetas/categorías reales y conserva filtros, navegación y composición.
- `UploadDropzone` incorpora `policy: FilePolicy` obligatoria (consumidor único: `UploadPage`). Conserva clases, controles, arrastre y comportamiento de teclado. Sin formatos activos o sin permiso se deshabilita. `validateFile` acepta la política explícita; el valor de demo predeterminado queda reservado a pruebas/simulación aislada.
- `useUploadQueue` revalida archivos al cambiar políticas y consulta datos vigentes antes de confirmar. La simulación recibe una copia del snapshot real y su cuota; sus resultados no se insertan en consultas reales ni en la BD. Se conservan cancelación, errores, títulos y progreso simulado.
- `AppShell` añade `capacityBytes?: number | null` y `storageError?: boolean = false`; `storageBytes` sigue opcional mientras carga. `ProtectedWorkspace` es su único consumidor. Muestra cuota real, capacidad ilimitada y errores conservando estructura y clases. `DashboardPage` muestra bytes reales y últimas incorporaciones de la API. El tema/logotipo global y el catálogo administrativo de tipos no cambian en esta entrega.
- No se alteran props ni estilos de `components/ui`; se conservan los breakpoints y la arquitectura página → hooks/componentes → servicios → API. Las nuevas pruebas comprueban paginación, activos, carpetas persistidas, permisos, errores, cuota y actualización de consultas después de guardar categorías o configuración.

Validación de esta integración: compilación correcta y 45 pruebas frontend aprobadas; tres pruebas aisladas del controlador de uso aprobadas con MySQL simulado. La ejecución integral del backend está bloqueada por `backend/index.js`, que actualmente importa rutas inexistentes de otro sistema. La comprobación de lectura de MySQL real devolvió `ECONNREFUSED`; no se insertaron ni alteraron registros. No se afirma validación visual en navegador ni funcionamiento de extremo a extremo contra la BD local.

Formato del código: indentación de dos espacios y bloques TypeScript, JSX y CSS en varias líneas. La normalización de formato conserva contratos, consumidores, estados, textos y estilos.

Antes de cambiar un componente: localizar consumidores con rg, determinar su ámbito, revisar props y defaults, mantener compatibilidad y verificar todos los estados afectados. No crear flags de página como isLogin/isDashboard en primitivas.

## Componentes compartidos

| Componente | Props / defaults                                                                                                                          | Responsabilidad y consumidores                                                                                                                                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button     | Props nativas de button incluido ref. variant=primary (primary/secondary/ghost), size=default (default/small), asChild=false, type=button | LoginForm, DashboardPage, DocumentsPage, CreateFolderForm, UploadPage, UploadDropzone, RepositoryState. Slot compone un único hijo, por ejemplo Link; disabled no deshabilita semánticamente un enlace.                                                        |
| TextField  | Props nativas de input incluido ref; label obligatorio; error, hint, leadingIcon, trailingAction, id, className opcionales                | LoginForm, búsqueda, CreateFolderForm y UploadQueue. Genera id, asocia mensajes mediante aria-describedby, error prevalece sobre hint. className afecta al input.                                                                                              |
| Notice     | tone=info (info/error/success), children                                                                                                  | Auth y documentos: ayuda, errores y confirmaciones. error usa role=alert; demás role=status.                                                                                                                                                                   |
| Brand      | inverse=false, className opcional                                                                                                         | LoginPage y AppShell. Identidad desde config/brand, sin navegación propia.                                                                                                                                                                                     |
| PageHeader | title, description, action opcional                                                                                                       | DashboardPage, DocumentsPage y UploadPage. h1 y acción; enfoca título al montar/cambiarlo.                                                                                                                                                                     |
| EmptyState | title, description, action opcional                                                                                                       | DocumentsPage: carpeta vacía y filtros sin coincidencias. Sin dominio.                                                                                                                                                                                         |
| AppShell   | userName, storageBytes opcional, onSignOut, children                                                                                      | ProtectedWorkspace. Sidebar, cabecera, menú móvil, bytes simulados y footer. Sin features/servicios. Menú en flujo; Escape cierra y restaura foco. Ajuste de despliegue: retirados imports de iconos sin uso; sin cambios de contrato, estados o presentación. |

Cambio compartido: Button y TextField usan ComponentProps nativas para declarar ref (React 19). Sin cambios a props previas o apariencia del login. workspace.css limita nuevos tamaños y layouts a .workspace o clases propias.

## Componentes de dominio

| Componente         | Props / defaults                                                          | Responsabilidad / consumidores                                                     |
| ------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| LoginForm          | Sin props                                                                 | LoginPage; valida, llama useLogin y AuthProvider recibe usuario.                   |
| RepositoryState    | error opcional, retry                                                     | Las tres páginas internas. Carga y error recuperable de consulta.                  |
| FileIcon           | extension                                                                 | Collection, Details y Queue; formato con icono y texto, sin vista previa real.     |
| DocumentCollection | documents, categories, onSelect(id); view=list; selectedId opcional       | Dashboard y explorador comparten filas; lista/cuadrícula, selección simple.        |
| DocumentDetails    | document, data, onClose                                                   | DocumentsPage; metadatos, foco en encabezado, Escape cierra. Página restaura foco. |
| CreateFolderForm   | parentId (string/null), onClose, onCreated(name)                          | DocumentsPage; servicio, invalidación de snapshot y resultado.                     |
| UploadDropzone     | disabled, onFiles(FileList)                                               | UploadPage; diálogo/arrastre, sin validación o persistencia.                       |
| UploadQueue        | files, busy, progress, validationVisible, onRemove(id), onTitle(id,title) | UploadPage; títulos, validación y progreso, sin transporte.                        |

## Estado y servicios

- AuthProvider: user, signIn(user), signOut(). Identidad en sessionStorage, sin contraseña/token. Rutas protegidas en app.
- useDocuments: documentsKey único y DocumentService.getSnapshot. staleTime=Infinity para memoria; invalidación tras crear/subir.
- useUploadQueue: files, addFiles, remove, updateTitle, submit, cancel, reset. Solo metadatos; aborta al desmontar. No confirma hasta completar toda la operación.
- DocumentService: getSnapshot, createFolder, upload(request, options), reset. Fábrica para pruebas aisladas y adaptador singleton para app.
- UploadRequest: nombre/tamaño/título de archivos, carpeta nullable, categoría, descripción y autor. UploadOptions: signal, onProgress, simulateFailure (solo demo).
- models/documents.ts: getSummary, filterDocuments, folderTrail, validateFile. Sin React.

Dependencias: app → pages + layouts + providers; pages → components + hooks + modelos; components de dominio → hooks + components/ui + lib + config; services → tipos/modelos. components/ui no importa páginas, módulos ni servicios. Dashboard consume el dominio documental sin duplicar colecciones.

## Ubicación de los archivos

- `components/ui` y `components/brand`: componentes compartidos.
- `components/auth`, `components/documents`, `components/categories`, `components/users`, `components/roles`, `components/appearance`, `components/fileSettings`, `components/fileTypes` y `components/messages`: piezas específicas de cada dominio. `components/administration` contiene únicamente el marco común de formularios.
- `layouts/AppShell.tsx`: estructura visual compartida de las pantallas internas.
- `pages`: páginas que componen los módulos, sin subcarpetas salvo `pages/auth` para autenticación.
- `services/auth` y `services/documents`: adaptadores simulados y sus pruebas; datos iniciales en `services/documents/seed.ts`.
- `hooks/auth` y `hooks/documents`: hooks por dominio.
- `providers/AuthProvider.tsx`: contexto de sesión.
- `schemas/auth/loginSchema.ts`, `types/auth.ts`, `types/documents.ts` y `models/documents.ts`: validaciones, contratos y funciones de dominio.

La reorganización conserva las props, valores predeterminados, estados y responsabilidades documentados arriba. Solo cambian las ubicaciones, sus importaciones y el formato del código.

## Matriz de impacto

1. Button/TextField/Notice: login, carpeta y subida; teclado, ref, error, disabled y contraste.
2. DocumentService/modelo: listado, detalle, dashboard, actividad y sidebar; pruebas de consistencia y confirmación atómica.
3. AppShell: Inicio, Documentos, Subir y ocho módulos administrativos; navegación desplazable, menú móvil, rutas activas y logout.
4. Tokens: login y rutas a 320, 768, 1024 y 1440 px. Estilos internos en workspace.css.
5. Subida: formatos/tamaños/cola, títulos/categoría, cancelación/fallo/reintento y ausencia de duplicados.

## Administración (extensión basada en db.sql)

Páginas: CategoriesPage, UsersPage, RolesPage, HistoryPage, AppearancePage, FileSettingsPage, FileTypesPage y MessagesPage, todas directamente en src/pages. DashboardPage, DocumentsPage y UploadPage fueron movidas sin cambiar su contenido. Solo auth conserva subcarpeta.

- Cada página administrativa compone su encabezado, estados de consulta, acciones, filtros, tabla o resumen y formulario. Las columnas se declaran en la página. AdministrationModule fue eliminado.
- Los formularios CategoryForm, UserForm, RoleForm, AppearanceForm, FileSettingsForm, FileTypeForm y MessageForm contienen campos explícitos en sus carpetas de dominio. AdministrationEditor fue eliminado. Conservan validación HTML y del servicio, permisos booleanos y vistas previas locales.
- HistoryPage: composición de historial de solo lectura, filtros por texto/módulo/acción/fechas locales y detalle antes/después. Nunca muestra contraseñas.
- AdministrationService: getSnapshot, save(module, values, actor, id?), reset. Tipos ModuleId, AdminRecord, AdminField y AuditEvent explícitos. Adaptador mock en memoria, separado de UI; una futura API implementará la interfaz. El contrato de valores es Record<string, string | number | boolean>; la definición de cada módulo y el servicio validan campos, límites y relaciones.
- useAdministration: query compartida; invalidación al guardar. Logout reinicia administración y documentos y limpia QueryClient.
- AppShell (consumidor único: ProtectedWorkspace): únicamente enlaces nuevos e iconos. Sidebar desplazable para mantener todos los módulos alcanzables. No cambia props ni variantes. RouteMetadata incorpora títulos de módulos.
- Button, TextField, Notice, PageHeader y EmptyState se reutilizan sin cambios de contratos o estilos. Consumidores administrativos: páginas, formularios de dominio, AdministrationFormFrame e HistoryPage.
- administration.css: clases admin-* aisladas; única regla de shell añade overflow-y para navegación extensa. No modifica pantallas ni estilos de login/documentos.

Límites intencionales: los catálogos administrativos son una simulación separada; no alteran categorías, permisos, textos ni políticas de las pantallas existentes. Ver MODULES_GAPS.md para integración pendiente. No hay conexión a BD, S3 ni API.

## Controles reutilizables y composición de páginas

Los contratos de props se exportan desde el archivo del componente; los contratos de datos permanecen en types. Indentación de dos espacios, props y bloques JSX en varias líneas. No existen componentes globales que seleccionen una pantalla mediante una prop de módulo.

| Componente              | Contrato y valores predeterminados                                                                                                                                                          | Responsabilidad y consumidores                                                                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SelectField             | SelectFieldProps extiende props nativas de select, incluido ref; label obligatorio; containerClassName, hint, error opcionales; id autogenerado si se omite; children contiene las opciones | Filtros de cinco catálogos, DocumentsPage, HistoryPage, UploadPage, UserForm, AppearanceForm y MessageForm. Etiqueta y mensajes asociados; error prevalece sobre hint; combina aria-describedby. className aplica al select.                                              |
| TextareaField           | TextareaFieldProps extiende props nativas de textarea, incluido ref; label obligatorio; containerClassName, hint y error opcionales; id autogenerado                                        | Descripciones en CategoryForm, RoleForm, FileTypeForm y UploadPage; contenido de MessageForm. className aplica al textarea. Conserva límites, filas, readonly y disabled nativos.                                                                                         |
| CheckboxField           | CheckboxFieldProps extiende props nativas de input salvo type, fijo en checkbox; label obligatorio; containerClassName opcional; id autogenerado                                            | Booleanos de los formularios administrativos y simulación de fallo en UploadPage. checked/onChange o defaultChecked nativos; sin reglas de dominio.                                                                                                                       |
| DataTable<T>            | caption, rows, columns, getRowId obligatorios; emptyState=null. DataTableColumn<T>: id, header, cell(row)                                                                                   | UsersPage, RolesPage, CategoriesPage, FileTypesPage, MessagesPage. Tabla semántica con encabezados, caption y región enfocables para desplazamiento horizontal. Cada página define columnas, acciones y estado vacío. Carga/error y filtrado pertenecen a la página/hook. |
| AdministrationFormFrame | title, legend, busy, children, onSubmit, onClose obligatorios; error, note y preview opcionales                                                                                             | Marco de siete formularios de administración. Enfoca encabezado al montar y error después de guardar; fieldset y acciones disabled durante guardado; Escape cancela si no está ocupado. No consulta servicios ni decide campos o módulos.                                 |
| Formularios de dominio  | Cada archivo exporta su tipo FormProps: record opcional, onClose y onSaved; UserForm añade roles. Sin record significa alta                                                                 | Cada página monta su formulario específico. Campos explícitos construidos con controles ui; permisos en RoleForm, vista previa en AppearanceForm/MessageForm y opciones de rol en UserForm. Se desmontan al cerrar para reiniciar valores en la siguiente edición.        |

- useAdministrationPage(module): consulta, búsqueda/estado, registros filtrados, edición, confirmación y retorno de foco al disparador (o título si el registro deja de aparecer). No devuelve JSX.
- useAdministrationForm(module, record, onSaved): valores iniciales, setValue y mutación de guardado. Usa el adaptador mock existente e invalida la consulta antes de notificar éxito; conserva errores del servicio. No conoce componentes visuales.
- Las páginas componen los estados de carga/error/reintento y conectan los formularios. Los componentes ui no importan config de módulos, páginas, hooks de dominio ni servicios.
- components.css contiene los estilos de DataTable, extraídos con los mismos valores de administration.css. Los controles conservan los elementos HTML y las clases existentes para mantener el aspecto y los breakpoints.
- ButtonProps y TextFieldProps ahora son exportados; no cambian variantes ni valores predeterminados.

Verificación de impacto: login, catálogos, configuraciones, documentos, subida e historial; alta/edición, duplicados, búsqueda, estado vacío, permisos, vista previa, foco, Escape, disabled y diseño móvil/escritorio. Se mantienen separados los servicios mock y sus interfaces; no se conecta BD ni API.

Validación de esta reorganización: 20 pruebas automatizadas aprobadas (servicios y contratos accesibles de controles). En navegador: acceso demo; alta/edición de usuario; filtros, vacío y duplicados; Escape y retorno del foco; apertura de los siete formularios y vistas previas; filtrado PDF, controles de subida e historial. Vista de Usuarios revisada en escritorio y a 390 px, sin desbordamiento de página. Sin errores de consola en la sesión revisada.

## Login y usuarios conectados a la API

<!-- //code mode usuarios: actualización de contratos, consumidores y alcance. -->

Esta sección reemplaza la descripción de datos simulados únicamente para login y Usuarios. El resto de los módulos conserva su implementación anterior.

- AuthService ahora devuelve AuthSession (token y AuthUser) y expone me(signal). authService adapta los campos del backend. AuthProvider valida /auth/me al recargar, conserva el token por pestaña, permite reintentar fallos de red y limpia sesión/caché ante 401 o logout.
- LoginForm mantiene TextField, Button, Notice, disposición y clases originales. Se retiran credenciales, botón y panel de prueba. Los mensajes provienen de la API; la ayuda de contraseña remite al administrador.
- UsersService es un contrato independiente de AdministrationService. usersService consulta todas las páginas de usuarios y los roles necesarios para el selector. No conecta el módulo administrativo de Roles.
- useUsersPage sustituye useAdministrationPage solo en UsersPage. Mantiene búsqueda, filtro, estados de carga/error/vacío y retorno de foco. Añade desactivación mediante DELETE (borrado lógico), confirmación y control de permisos.
- UserForm conserva sus props (record?, roles, onClose, onSaved) y los controles compartidos. useUsersForm usa POST/PATCH reales. Contraseña obligatoria al crear y opcional al editar; no se guarda en caché ni almacenamiento. El formulario permite reactivar cuentas. El rol y estado propios se deshabilitan de acuerdo con la API.
- No se cambiaron estilos, variantes ni contratos de components/ui. AppShell conserva diseño y actualiza únicamente el texto de la cuenta. WorkspaceRoutes espera la validación de sesión antes de navegar.
- Los cambios de código llevan el comentario //code mode usuarios. El backend solo añade orden estable en el listado paginado de usuarios; no cambia tablas ni endpoints.
- Verificación: pruebas HTTP simuladas con componentes reales para login, /me, CRUD, foco, errores, permisos y expiración; no se insertan usuarios de prueba en la base de datos.

## Categorías, roles, historial y configuración conectados

<!-- //code mode control: contratos y alcance de la integración. -->

Esta sección reemplaza las referencias anteriores a datos simulados para Categorías, Roles y permisos, Historial, Apariencia y Configuración de archivos.

- ControlService (types/control.ts) separa el contrato HTTP de los componentes. controlService consulta los catálogos paginados y la configuración global; guarda categorías/roles con POST o PATCH y configuración con PUT. Solo envía campos editables, convierte booleanos a 0/1, números a enteros seguros y valores opcionales vacíos a null.
- useControl y useControlPage conservan filtros, edición, carga, error, reintento, vacío y retorno de foco. Consultan según permisos de la sesión. Los valores de un formulario nuevo son predeterminados, no registros ficticios.
- CategoryForm, RoleForm, AppearanceForm y FileSettingsForm conservan sus props record?, onClose y onSaved, así como sus controles, composición, CSS y vista previa. useControlForm guarda en la API y refresca el módulo y el historial; Roles también invalida la consulta del selector de Usuarios.
- Roles no permite editar el rol de la sesión, conforme a la restricción del backend. Categorías y Roles se activan o desactivan desde la casilla Activo existente.
- HistoryService consulta /historial. useHistory requiere puede_ver_historial. HistoryPage mantiene sus filtros y detalles; admite entidades SQL, JSON nativo/texto, datos nulos, eventos de eliminación y cambios parciales sin presentar campos omitidos como borrados. Los cambios de Usuarios también invalidan su caché.
- Apariencia persiste nombre, tema, ruta S3 y colores; conserva la vista previa existente. No añade carga de logotipos ni aplicación global de tema al shell. Configuración de archivos persiste límites y políticas que la API ya aplica; las pantallas documentales aún usan su servicio simulado.
- No cambian props, variantes ni estilos de components/ui. Sus consumidores mantienen controles nativos, foco, Escape y disabled al guardar; DataTable conserva su contenedor adaptable y las configuraciones su cuadrícula existente.
- El backend mantiene rutas y estructura. Solo se añade desempate por identificador a la ordenación paginada de catálogos e historial. No se modifican tablas ni datos.
- Los cambios llevan //code mode control. Pruebas de HTTP simulado cubren formularios reales, permisos, foco/teclado, carga, errores, paginación, inicialización de configuración y diferencias de historial. No se escriben datos de prueba en MySQL.

## Paginación de tablas y listados

- `Pagination` pertenece a `components/ui`: recibe `label`, `page`, `pageSize`, `total`, `busy` (false por defecto), `onPageChange` y `onPageSizeChange`. Compone Button y SelectField; no importa servicios ni módulos. Usa 10/25/50/100 registros, navegación nativa por teclado, estado anunciado y botones disabled en los límites o durante una consulta.
- Consumidores: Historial, Usuarios, Roles, Categorías, Tipos, Mensajes, documentos, carpetas, versiones y papelera. DataTable y DocumentCollection conservan sus contratos y estilos; la paginación se compone fuera de ellos.
- Historial, Usuarios, Roles, Categorías, documentos, versiones y papelera consultan una sola página en el servidor. `PageResult<T>` contiene items/total/limit/offset. Las rutas existentes conservan su respuesta de arreglo cuando no se solicita `paginated=1`; formularios y selectores siguen accediendo a sus catálogos completos.
- Los filtros se aplican en SQL antes de contar y limitar. Historial admite módulo, acción, búsqueda por descripción/usuario y límites UTC calculados desde las fechas locales. Sus opciones de filtro se obtienen de todos los eventos, no únicamente de la página actual.
- `usePagination` conserva los filtros de administración y vuelve a página 1 al cambiarlos o cambiar el tamaño. DocumentsPage conserva sus parámetros de URL e incorpora pagina/cantidad. Los resultados anteriores se ocultan mientras llega la nueva página; el paginador permanece montado para conservar el foco. Errores muestran Reintentar y no se presentan como listas vacías.
- `useLocalPagination` se limita a Tipos/Mensajes (transporte simulado existente) y a la jerarquía de carpetas, que ya debe estar disponible para selectores, rutas y validación de descendientes. Filtra antes de paginar, reinicia la página al cambiar filtros y ajusta páginas que desaparecen. No conecta los módulos simulados a MySQL.
- El snapshot documental compartido carga solo los cinco documentos recientes y un resumen agregado de totales, categorías utilizadas, incorporaciones del día local, formatos y archivos por carpeta. El dashboard conserva sus cifras globales. La selección de un documento consulta su detalle por ID, aunque esté en otra página. La cuota y los límites siguen usando su endpoint existente.
- Versiones y papelera conservan sus formularios y acciones; sus claves de caché incluyen la página y se invalidan con las mutaciones existentes. Papelera usa una consulta conjunta de archivos/carpetas ordenada por fecha e identificador.
- No se modifican tablas, registros ni políticas de S3. Verificación: pruebas de contratos y filtros SQL, integración de formularios, compilación, consultas de lectura en MySQL y `scripts/pagination-ui-check.cjs` con HTTP interceptado a 320/768/1024/1440 px, navegación de teclado, errores y reintentos.

## Logo de la empresa

- Brand utiliza `src/logo_sistema.png` en lugar del icono y los textos de marca. Conserva las props `inverse` (false por defecto) y `className`.
- Consumidores: menú lateral de AppShell y login de escritorio/móvil. La imagen conserva su proporción, ancho máximo adaptable y texto alternativo; inverse proporciona fondo blanco para mantener el contraste sobre el panel oscuro.
- Login: la variante inverse utiliza `logo_sistema_white.png` en escritorio y móvil. En móvil se añade fondo primario al logo para que el blanco sea legible. AppShell mantiene `logo_sistema.png` mediante la variante predeterminada.

## Paleta azul y configuración temporalmente oculta

- La identidad visual usa primary #262c62, hover #1d224d, foco #505aa0 y superficies azules suaves. Se conservan estructura, dimensiones, colores semánticos de avisos y colores por tipo de archivo.
- AppShell oculta los accesos a Apariencia y Configuración de archivos. Las rutas y permisos del backend se mantienen.
- RoleForm omite la casilla Gestionar configuración; useControlForm conserva el valor cargado del rol y lo envía sin alterarlo. Los roles nuevos conservan el valor predeterminado false. No se modifica la definición del permiso ni datos existentes.

## Interfaz según permisos de rol

- `workspaceAccess` centraliza el acceso de navegación: Inicio para toda sesión; Documentos con lectura o gestión de carpetas; Subir con permiso de carga; Categorías con lectura, carga, edición o gestión de categorías; Usuarios/Roles con gestión de usuarios; Historial con lectura de historial. Apariencia y Configuración de archivos permanecen ocultas.
- `AppShell` es una composición del sistema: recibe `permissions` tipado desde `WorkspaceLayout`, su único consumidor de producción. Conserva navegación, estilos, apertura móvil y retorno de foco con Escape.
- `DocumentActions`, `DocumentVersions`, `FolderActions` y `RepositoryTrash` pertenecen al módulo documental. Mantienen visibles las acciones restringidas con controles nativos deshabilitados y motivos en texto. Respetan también las políticas globales de descarga y reemplazo. Los servicios y operaciones existentes no cambian.
- `DocumentsPage` impide el acceso sin lectura ni gestión de carpetas y no muestra detalles de archivos al perder lectura. Inicio y Documentos deshabilitan las entradas de carga sin permiso; UploadPage mantiene la validación existente y vuelve a Inicio cuando el usuario no puede entrar al explorador.
- CategoriesPage conserva consulta y filtros con edición deshabilitada para lectores. CreateFolderForm bloquea el guardado al perder permiso; Cancelar sigue disponible. No cambian contratos ni estilos de components/ui.
- AuthProvider vuelve a consultar `/auth/me` al recuperar foco o visibilidad, sin desmontar formularios durante la consulta. Un fallo transitorio conserva la sesión; el tratamiento existente de HTTP 401 sigue cerrándola. El backend continúa validando cada operación.
- Pruebas con HTTP simulado: menú por combinaciones de permisos, lector sin mutaciones, actualización de sesión y fallo de red, además de compilación y revisión adaptable/teclado. No se modifican backend, MySQL ni S3.

## Vaciar papelera e historial legible

- `EmptyTrashActions` pertenece al módulo documental; su único consumidor es `RepositoryTrash`. Recibe `total`, `pending`, `busy` (false por defecto) y `onBusyChange`. Compone Button/Notice sin cambiar sus variantes ni estilos compartidos. Conserva el foco al cancelar, admite Escape, explica la acción irreversible y bloquea confirmación/restauración mientras se procesa.
- `DocumentActionsService.emptyTrash(pendingOnly = false)` usa POST `/archivos/papelera/vaciar`; el reintento envía `solo_pendientes: true` y no vacía elementos nuevos. `TrashPage` conserva la paginación e incorpora `pendientes` opcional para tolerar respuestas previas.
- El permiso `puede_vaciar_papelera` se edita en RoleForm y se mantiene independiente de enviar a papelera/restaurar. Requiere además Ver archivos. Se presenta deshabilitado con explicación para otros roles. Se conserva la prohibición existente de editar el propio rol.
- Historial muestra actor, acción y nombre en lenguaje natural. Los datos originales permanecen en BD; la interfaz omite identificadores, rutas y secretos en los detalles, y traduce los tipos de acción. Los eventos antiguos se presentan con los nombres disponibles sin inventar datos faltantes.
- Pruebas de frontend cubren confirmación, cancelación/foco, permiso denegado y error/reintento. `scripts/trash-ui-check.cjs` intercepta HTTP para revisar 320/768/1024/1440 px e historial sin borrar datos reales.
