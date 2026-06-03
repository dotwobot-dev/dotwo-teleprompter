# Desarrollo

## Principios del proyecto

- Mantener una app de escritorio simple y operativa.
- Priorizar controles claros para uso en plató.
- Evitar dependencias frontend mientras no hagan falta.
- Mantener Control y Prompter separados.
- Documentar cada bloque funcional al añadirlo.

## Flujo recomendado

1. Cambiar una funcionalidad pequeña.
2. Ejecutar `npm run check`.
3. Arrancar con `npm start`.
4. Probar en ventana compacta y en pantalla externa.
5. Actualizar documentación si cambia comportamiento, dependencia o empaquetado.

## Estado local

Control guarda tres cosas en `localStorage`:

- `teleprompter-mvp-state`: estado actual.
- `teleprompter-mvp-recents`: lista de archivos recientes.
- `teleprompter-mvp-setup-presets`: presets de configuración creados por el usuario.

## Limpieza de texto

La función de limpieza está en `src/control.js`.

Hace:

- Normalización de saltos de línea.
- Sustitución de espacios no separables.
- Reducción de espacios múltiples.
- Unión de líneas dentro de párrafos.
- Conservación de separación entre párrafos.

La limpieza de subtítulos elimina:

- Índices numéricos.
- Timestamps.
- Cabecera `WEBVTT`.
- Líneas vacías sobrantes.
