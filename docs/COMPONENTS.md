# Contratos, consumidores e impacto

Antes de cambiar un componente: localizar consumidores con rg, determinar su ámbito, revisar props y defaults, mantener compatibilidad y verificar todos los estados afectados. No crear flags de página como isLogin/isDashboard en primitivas.

## Componentes compartidos

| Componente | Props / defaults | Responsabilidad y consumidores |
| --- | --- | --- |
| Button | Props nativas de button incluido ref. variant=primary (primary/secondary/ghost), size=default (default/small), asChild=false, type=button | LoginForm, DashboardPage, DocumentsPage, CreateFolderForm, UploadPage, UploadDropzone, RepositoryState. Slot compone un único hijo, por ejemplo Link; disabled no deshabilita semánticamente un enlace. |
| TextField | Props nativas de input incluido ref; label obligatorio; error, hint, leadingIcon, trailingAction, id, className opcionales | LoginForm, búsqueda, CreateFolderForm y UploadQueue. Genera id, asocia mensajes mediante aria-describedby, error prevalece sobre hint. className afecta al input. |
| Notice | tone=info (info/error/success), children | Auth y documentos: ayuda, errores y confirmaciones. error usa role=alert; demás role=status. |
| Brand | inverse=false, className opcional | LoginPage y AppShell. Identidad desde config/brand, sin navegación propia. |
| PageHeader | title, description, action opcional | DashboardPage, DocumentsPage y UploadPage. h1 y acción; enfoca título al montar/cambiarlo. |
| EmptyState | title, description, action opcional | DocumentsPage: carpeta vacía y filtros sin coincidencias. Sin dominio. |
| AppShell | userName, storageBytes opcional, onSignOut, children | ProtectedWorkspace. Sidebar, cabecera, menú móvil, bytes simulados y footer. Sin features/servicios. Menú en flujo; Escape cierra y restaura foco. |

Cambio compartido: Button y TextField usan ComponentProps nativas para declarar ref (React 19). Sin cambios a props previas o apariencia del login. workspace.css limita nuevos tamaños y layouts a .workspace o clases propias.

## Componentes de dominio

| Componente | Props / defaults | Responsabilidad / consumidores |
| --- | --- | --- |
| LoginForm | Sin props | LoginPage; valida, llama useLogin y AuthProvider recibe usuario. |
| RepositoryState | error opcional, retry | Las tres páginas internas. Carga y error recuperable de consulta. |
| FileIcon | extension | Collection, Details y Queue; formato con icono y texto, sin vista previa real. |
| DocumentCollection | documents, categories, onSelect(id); view=list; selectedId opcional | Dashboard y explorador comparten filas; lista/cuadrícula, selección simple. |
| DocumentDetails | document, data, onClose | DocumentsPage; metadatos, foco en encabezado, Escape cierra. Página restaura foco. |
| CreateFolderForm | parentId (string/null), onClose, onCreated(name) | DocumentsPage; servicio, invalidación de snapshot y resultado. |
| UploadDropzone | disabled, onFiles(FileList) | UploadPage; diálogo/arrastre, sin validación o persistencia. |
| UploadQueue | files, busy, progress, validationVisible, onRemove(id), onTitle(id,title) | UploadPage; títulos, validación y progreso, sin transporte. |

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
- `components/auth`, `components/documents` y `components/administration`: componentes específicos de cada módulo.
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

- AdministrationModule ({module: ModuleId}, sin default): composición de catálogo/configuración, consulta, filtros, lista, carga/error/reintento, creación/edición y confirmación. Reutilizado por siete páginas concretas; no es una primitiva de components/ui.
- AdministrationEditor ({module, record?, roles, onClose, onSaved}): formulario de dominio; record ausente significa alta. Campos definidos por módulo, validación HTML y del servicio, permisos como booleanos, vista previa de menú y mensajes. Foco inicial, error anunciado/enfocado, Escape/cancelar y retorno al disparador. Campos y acciones disabled durante guardado.
- HistoryPage: composición de historial de solo lectura, filtros por texto/módulo/acción/fechas locales y detalle antes/después. Nunca muestra contraseñas.
- AdministrationService: getSnapshot, save(module, values, actor, id?), reset. Tipos ModuleId, AdminRecord, AdminField y AuditEvent explícitos. Adaptador mock en memoria, separado de UI; una futura API implementará la interfaz. El contrato de valores es Record<string, string | number | boolean>; la definición de cada módulo y el servicio validan campos, límites y relaciones.
- useAdministration: query compartida; invalidación al guardar. Logout reinicia administración y documentos y limpia QueryClient.
- AppShell (consumidor único: ProtectedWorkspace): únicamente enlaces nuevos e iconos. Sidebar desplazable para mantener todos los módulos alcanzables. No cambia props ni variantes. RouteMetadata incorpora títulos de módulos.
- Button, TextField, Notice, PageHeader y EmptyState se reutilizan sin cambios de contratos o estilos. Nuevos consumidores: AdministrationModule, AdministrationEditor, HistoryPage.
- administration.css: clases admin-* aisladas; única regla de shell añade overflow-y para navegación extensa. No modifica pantallas ni estilos de login/documentos.

Límites intencionales: los catálogos administrativos son una simulación separada; no alteran categorías, permisos, textos ni políticas de las pantallas existentes. Ver MODULES_GAPS.md para integración pendiente. No hay conexión a BD, S3 ni API.
