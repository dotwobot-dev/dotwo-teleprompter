# Hoja de ruta

## Validado en campo

- El 2026-10-06 el usuario confirma funcionamiento de `0.2.0` Intel legacy e
  instalacion por DMG en macOS 10.13, con despliegue en produccion interna
  en la facultad. No se generaliza a otras variantes o a todos los flujos.

## Prioridad alta

- Ampliar pruebas de `0.2.0` en campo real con segunda pantalla.
- Probar modo portatil de una sola pantalla.
- Confirmar las tres familias macOS: Apple Silicon, Intel moderno e Intel legacy.
- Probar instalacion y funcionamiento de los nuevos DMG firmados/notarizados
  en Intel y M1/M2; sus PKG estan notarizados, pero sin prueba de instalacion.
- Validar el visor real de Talento sobre la app moderna firmada.
- Repetir la prueba legacy en macOS 10.13 al cambiar el artefacto desplegado.
- Revisar dependencias del toolchain y de importacion antes de publicacion estable.
- Mantener Electron moderno dentro de ramas soportadas; documentar la excepcion legacy.
- Cerrar y sincronizar la documentacion del candidato nuevo sobre `main` sin
  alterar el SHA de fuente usado para construir los paquetes.

## Prioridad media

- Afinar presets de lectura tras pruebas reales.
- Revisar experiencia de importacion de Word y PDF con guiones de produccion.
- Revisar icono final en Finder, Dock y ventana Acerca de.

## Prioridad baja

- Explorar OCR para PDFs sin texto seleccionable.
- Preparar instalador/notas publicas si la app sale de beta privada.
