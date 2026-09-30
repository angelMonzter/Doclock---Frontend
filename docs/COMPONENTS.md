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
- model.ts: getSummary, filterDocuments, folderTrail, validateFile. Sin React.

Dependencias: app → features + components; features → components/ui + lib + config; services → tipos/modelo. components/ui no importa features. Dashboard consume el dominio documental sin duplicar colecciones.

## Matriz de impacto

1. Button/TextField/Notice: login, carpeta y subida; teclado, ref, error, disabled y contraste.
2. DocumentService/modelo: listado, detalle, dashboard, actividad y sidebar; pruebas de consistencia y confirmación atómica.
3. AppShell: tres pantallas, menú móvil, rutas activas y logout.
4. Tokens: login y rutas a 320, 768, 1024 y 1440 px. Estilos internos en workspace.css.
5. Subida: formatos/tamaños/cola, títulos/categoría, cancelación/fallo/reintento y ausencia de duplicados.

