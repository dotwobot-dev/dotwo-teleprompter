# Desarrollo

## Principios del proyecto

- Mantener una app de escritorio simple y operativa.
- Priorizar controles claros para uso en plató.
- Evitar dependencias frontend mientras no hagan falta.
- Mantener Control y Prompter separados.
- Documentar cada bloque funcional al añadirlo.

## Flujo recomendado

1. Cambiar una funcionalidad pequeña.
2. Ejecutar `npm run check` y `npm test`.
3. Arrancar con `npm start`.
4. Probar en ventana compacta y en pantalla externa.
5. Actualizar documentación si cambia comportamiento, dependencia o empaquetado.

## Validacion del visor de Talento

`npm test` usa el codigo real de Main con dobles de Electron para comprobar
acceso desde Control, captura completa sin ampliar, concurrencia, cierre/reapertura,
recuperacion de errores y suspension con Control oculto/minimizado.

La prueba manual debe comparar la miniatura con Prompter en pausa, reproduccion,
espejo, tema claro, avisos, cuenta atras, pantalla negra y distintos formatos de
pantalla. Revisar tambien ventana minima de Control y Panel directo.

El 2026-10-04 macOS bloqueo el Electron de desarrollo durante esta prueba.
No repetir el arranque ni desactivar protecciones para forzarlo. Las tres apps
firmadas fueron aceptadas por Apple; hubo una comprobacion visual parcial del
visor en la variante moderna Apple Silicon. Sigue pendiente la matriz funcional
completa y el cierre de DMG/PKG originales. Probar sobre el candidato aprobado,
con un perfil temporal
`--user-data-dir` para no modificar guiones, recientes ni presets del usuario.
Ver [Estado del proyecto](PROJECT_STATUS.md).

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
