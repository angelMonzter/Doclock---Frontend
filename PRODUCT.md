# Producto
<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
React, Vite, TypeScript, Tailwind, Lucide; stack propuesto y aceptado para esta implementación.

## Product Purpose
Sistema de documentos. Esta entrega permite evaluar login, dashboard, documentos/carpetas y subida simulada. La extensión administrativa añade categorías, usuarios, roles, historial, apariencia, configuración de archivos, tipos permitidos y mensajes del sistema, conservando las primeras pantallas.

## Capabilities and Constraints
Sin conexión a base de datos ni API. Los ocho módulos administrativos usan datos mock en memoria, independientes del repositorio documental existente; sus cambios se reinician al recargar o cerrar sesión. Los permisos editables no autorizan acciones reales ni modifican la sesión demo. Modularidad obligatoria y análisis de impacto de componentes compartidos. Las páginas quedan directamente en src/pages, salvo autenticación en src/pages/auth. ZIP instalable solicitado. La identidad «Archivo» es provisional; audiencia específica y marca definitiva pendientes de decisión.

## Evidence on Hand
El proyecto original contiene db.sql, referencia para los módulos y sus campos, sin ejecutar ni modificar el script. Las imágenes adjuntas guían contenido y funciones, adaptadas al login. Usuarios, permisos, configuración e historial administrativo forman parte de la simulación; quedan pendientes el alta real de usuarios, la autorización de backend, la auditoría completa y aplicar catálogos y políticas a las pantallas documentales. docs/MODULES_GAPS.md registra la cobertura y las decisiones de integración pendientes.
