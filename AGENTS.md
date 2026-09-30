# Reglas del proyecto

## Modularidad obligatoria

- Antes de crear o modificar un componente personalizado, evaluar si pertenece a una página, un módulo o al sistema compartido.
- Buscar todos los consumidores antes de cambiar props, variantes o estilos compartidos y revisar el efecto en todo el proyecto.
- Definir parámetros tipados, valores predeterminados, estados y responsabilidades; mantener `frontend/docs/COMPONENTS.md` actualizado.
- Preferir composición y variantes semánticas; no crear componentes genéricos sin un caso concreto de reutilización.
- `components/ui` no puede importar `features`, páginas ni servicios. Los servicios no importan UI. Las páginas componen módulos.
- Revisar escritorio, móvil, teclado, foco, carga, error y disabled en los consumidores afectados. Ejecutar compilación y pruebas pertinentes.
- Mantener dummy y transporte real separados por interfaces. No conectar la base de datos ni añadir módulos fuera del alcance solicitado.
