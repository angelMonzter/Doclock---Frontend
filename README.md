# Archivo · Frontend documental de demostración

React + Vite + TypeScript + Tailwind CSS + Lucide. Flujo: login → inicio → documentos y carpetas → subida simulada. Sin SQL, API ni almacenamiento remoto. Marca provisional editable en src/config/brand.ts.

## Instalar y abrir

Requiere Node.js 22.12 o superior compatible con Vite 7 y npm. En la carpeta que contiene package.json:

~~~bash
npm ci
npm run dev
~~~

Abre la dirección que muestre Vite (normalmente http://127.0.0.1:5173; puede usar otro puerto si está ocupado). No abras index.html con doble clic.

~~~bash
npm run typecheck
npm test
npm run build
npm run preview
~~~

El ZIP no incluye node_modules ni dist. No se añadieron dependencias en esta etapa. Fuentes locales mediante Fontsource.

## Despliegue en Netlify

La raíz de este repositorio es la carpeta que contiene `package.json` y `netlify.toml`. Al conectar la rama de GitHub en Netlify, deja el directorio base en la raíz (vacío); no añadas `frontend` para esta estructura. La configuración versionada ejecuta `npm run build`, publica `dist` y usa Node.js 22.19.0. `.nvmrc` indica la misma versión para desarrollo local.

Antes de subir cambios, ejecuta `npm ci`, `npm run typecheck`, `npm test` y `npm run build`. Puedes revisar el resultado con `npm run preview`; para desarrollar sigue usando `npm run dev`.

Vite copia `public/_redirects` a `dist/_redirects` para que las rutas de React funcionen también al abrirlas directamente o recargarlas en Netlify. No se requieren variables de entorno para la demo actual. El despliegue conserva los servicios simulados y no añade persistencia ni almacenamiento remoto.

## Recorrido de prueba

1. Usa demo@archivo.app / Archivo2026! o «Usar datos de prueba». Inicia sesión.
2. Inicio muestra indicadores calculados desde el repositorio. Abre un documento reciente.
3. Busca por nombre, filtra categoría/formato, cambia orden y vista. Selecciona un archivo; Escape cierra sus detalles y devuelve el foco al archivo.
4. Crea una carpeta. Se rechazan nombres vacíos, mayores de 150 caracteres y duplicados en el mismo destino. Las carpetas pueden contener subcarpetas; las categorías clasifican documentos.
5. En Subir archivos, selecciona o arrastra archivos. Define títulos, carpeta y categoría. La descripción es opcional.
6. Confirma. El progreso es simulado; los metadatos aparecen en listado, actividad y resumen.
7. En «Opciones de prueba», activa el fallo simulado. La cola se conserva tras el error; desactiva la opción y reintenta. Cancelar durante el progreso no incorpora registros parciales.
8. Cierra sesión. Las rutas internas vuelven al login y el repositorio se reinicia.

## Qué persiste

| Dato | Navegación interna | Recarga | Cierre de sesión |
| --- | --- | --- | --- |
| Usuario demo (id/nombre/correo) | Se conserva | sessionStorage de esta pestaña | Se elimina |
| Carpetas, documentos y actividad | Memoria compartida | Datos iniciales | Datos iniciales |
| Búsqueda, filtros, selección y vista | URL del explorador | URL; IDs temporales pueden dejar de existir | Vuelve al login |
| Cola de subida | Se descarta al salir de Subir | Se descarta; el navegador puede advertir | Se descarta |

Nunca se guardan contraseñas ni contenido de archivos en localStorage o sessionStorage. Solo se conserva el metadato (nombre, extensión, tamaño y campos capturados); no se lee ni transmite el contenido. Descargas y vistas previas reales no implementadas. Si sessionStorage está bloqueado, la sesión funciona solo en memoria.

La protección de rutas es una simulación visual, no autorización de seguridad. El backend futuro deberá autenticar, autorizar y validar archivos independientemente.

## Política provisional

src/config/files.ts: PDF, DOCX, XLSX, PNG, JPG/JPEG; máximo 10 MB por archivo, 10 archivos por operación y capacidad simulada de 1 GB. Se rechazan archivos vacíos. La validación por extensión es para esta demo, no inspección de contenido ni control de seguridad. No hay AWS S3, cifrado, correos o sincronización.

## Estructura

~~~text
src/
  app/                   # Providers, rutas protegidas y composición
  components/
    brand/               # Identidad centralizada
    auth/                # Formulario de acceso
    documents/           # Listado, detalle, carpeta, dropzone y cola
    ui/                  # Primitivas sin dominio
  config/                # Marca y política de archivos
  layouts/               # AppShell presentacional
  pages/
    auth/                # Login
    dashboard/           # Resumen del repositorio compartido
    documents/           # Explorador y subida
  services/
    auth/                # AuthService dummy y pruebas
    documents/           # DocumentService dummy, seed y pruebas
  hooks/
    auth/                # Inicio de sesión
    documents/           # Consulta compartida y ciclo de carga
  providers/             # Contexto de sesión: AuthProvider
  schemas/auth/          # Validación del formulario de acceso
  types/                 # Contratos de autenticación y documentos
  models/                # Filtros, métricas, jerarquía y validación documental
  lib/                   # Formatos y utilidades
  styles/                # globals.css (login/primitivas), workspace.css
~~~

Para una API real, implementar AuthService y DocumentService y sustituir sus adaptadores. TanStack Query mantiene un único snapshot; no hay cifras duplicadas. AppShell recibe nombre, bytes y callback de salida; no importa lógica del dominio.

Consulta AGENTS.md y docs/COMPONENTS.md antes de modificar componentes. No hay usuarios, auditoría completa ni configuración avanzada. En producción el servidor debe devolver index.html para las rutas de la SPA.


## Conexión de login y usuarios

<!-- //code mode usuarios: configuración y alcance de la integración real. -->

Inicia backend con `npm run dev` en su carpeta y frontend con `npm run dev` en esta carpeta. Reinicia Vite si estaba abierto antes de estos cambios.

El valor predeterminado de `VITE_API_URL` es `/api`. Vite redirige esas peticiones a `http://127.0.0.1:4000`, evitando diferencias entre localhost y 127.0.0.1 en CORS. Puedes crear `.env.local` a partir de `.env.example` y ajustar `API_PROXY_TARGET` si tu backend utiliza otro puerto. No pongas secretos en variables VITE_.

En producción configura un proxy `/api` hacia el backend o define `VITE_API_URL` con su URL pública y habilita el origen del frontend en CORS del backend.

Solo login, validación de sesión y CRUD de usuarios utilizan la API. El selector de roles hace consultas de lectura para asignar roles existentes; la pantalla de Roles y los demás módulos continúan sin conectar.

Las cuentas se crean con contraseña, se editan conservando la actual si el campo queda vacío, se desactivan mediante DELETE y se reactivan desde Editar. El backend exige el permiso `puede_gestionar_usuarios`. No existe acceso de prueba ni registro público. La API registra el historial, pero la pantalla de Historial aún no está conectada.

Ejecuta `npm test` para las pruebas del frontend y `npm run build` para comprobar TypeScript y generar la compilación. Las pruebas de esta integración simulan HTTP: no modifican datos de tu BD.

## Control administrativo conectado

<!-- //code mode control: alcance actual, adicional a login y Usuarios. -->

Categorías, Roles y permisos, Historial, Apariencia y Configuración de archivos ya usan la API y no leen sus datos del adaptador dummy. Utilizan el mismo token y proxy configurados para Usuarios.

- Categorías: consultar, crear, editar y activar/desactivar desde Activo.
- Roles: consultar, crear y editar permisos y estado. Otro administrador debe modificar el rol de la propia sesión.
- Historial: consulta de eventos reales, filtros y detalle de campos modificados.
- Apariencia: lectura y guardado de configuración, conservando la vista previa. La ruta de imagen es una referencia S3; no sube imágenes ni cambia automáticamente el tema global.
- Configuración de archivos: lectura y guardado de límites, papelera, descargas y reemplazos.

Una configuración global inexistente se muestra como Sin configurar y se crea al guardar. Errores de red o permisos se muestran sin sustituir los datos por ejemplos. Documentos, carpetas, carga, tipos de archivo y mensajes conservan su transporte previo; esta integración no los conecta.

Validación: npm test en frontend/backend y npm run build en frontend. Las pruebas usan HTTP/BD simulados; no crean registros en la base de datos del proyecto. Los contratos y consumidores se documentan en docs/COMPONENTS.md.
