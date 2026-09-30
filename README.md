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

