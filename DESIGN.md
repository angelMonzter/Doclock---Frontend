# Sistema visual inicial

Identidad provisional Archivo. Interfaz operativa de login, verde bosque con superficie clara; sin imágenes externas. Fuentes DM Sans para cuerpo y Manrope para títulos, alojadas localmente mediante Fontsource.

Tokens: fondo #fbfcfa, texto #202d28, primario #194e3e, superficie editorial #153f35, acento editorial #c6dda8, borde #d4dcd6, foco #347c60, error #a13333. Radio base 10px. El estado nunca depende únicamente del color.

Escritorio: panel editorial 47%, formulario 53%; formulario máximo 390px. Móvil a 760px: una columna y marca compacta, sin ilustración decorativa. Controles con estados hover, focus, disabled; tamaño de campos 49px. Contraseña con acción accesible de 44px.

La tarjeta del login es ilustrativa, marcada como ejemplo y sin acciones falsas. El acceso correcto navega a Inicio mediante una sesión demo; no promete seguridad de backend.

Cambios a componentes o tokens requieren revisar consumidores según docs/COMPONENTS.md.

## Espacio documental

Inicio, Documentos y Subir heredan el mismo sistema. Sidebar claro de 244px (216px en escritorio compacto), contenido de hasta 1560px. Resumen calculado, documentos recientes y actividad. Carpetas jerárquicas y categorías diferenciadas. Selección simple con panel lateral a más de 960px; detalle a ancho completo debajo de ese tamaño. Menú móvil en flujo hasta 760px.

Los estilos nuevos quedan en workspace.css y no redefinen login-*. Controles internos de al menos 44px; campos a 16px en móvil. Foco en encabezados al navegar, errores y detalles; Escape restaura disparador. Movimiento reducido respetado.

Tokens: --surface #ffffff, --surface-subtle #f1f4ed, --surface-selected #e4eddf, --warning #805614, --warning-surface #fff4de, --success #27502c, --success-surface #e7f2e4. Tonos de iconos con extensión textual: PDF #98402d/#f9eee9, texto #3e5d72/#eaf0f5, imagen #765180/#f3eef5. No representar garantías de cifrado/seguridad.

Responsive interno: 1200px (densidad), 960px (detalle completo), 760px (menú móvil), 380px (cuadrícula de una columna). Capacidad de 1GB provisional y simulada.
