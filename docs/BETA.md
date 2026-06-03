# Beta operativa

## Estado

Esta carpeta recoge la primera beta operativa de DoTwo Teleprompter.

Objetivo de la beta:

- Probar la app en campo real.
- Validar lectura en pantalla externa.
- Validar uso en portátil con una sola pantalla.
- Confirmar comportamiento en Apple Silicon, Intel moderno e Intel legacy macOS 10.13.
- Recoger ajustes finos de operación antes de una versión firmada/notarizada.

## Builds de prueba

Los paquetes finales se generan con:

```bash
npm run release:mac
```

Salida esperada:

```text
release/DoTwo Teleprompter Apple Silicon.zip
release/DoTwo Teleprompter Intel macOS 10.15+.zip
release/DoTwo Teleprompter Legacy macOS 10.13 Intel.zip
```

Distribuir siempre como `.zip` cuando se copie a otro Mac. En las pruebas,
el bundle `.app` sin comprimir puede perder permisos o metadatos al moverlo
por carpetas compartidas.

## Matriz de compatibilidad

| Paquete | Arquitectura | macOS objetivo | Uso |
| --- | --- | --- | --- |
| Apple Silicon | arm64 | 10.15+ | Macs M1/M2/M3/M4 |
| Intel macOS 10.15+ | x64 | 10.15+ | Macs Intel modernos |
| Legacy macOS 10.13 Intel | x64 | 10.13+ | Macs Intel antiguos |

La build legacy usa Electron 26.6.10. Se mantiene separada de la app oficial
moderna porque es una línea de compatibilidad para equipos antiguos.

## Checklist de prueba de campo

- Abrir la app desde ZIP descomprimido.
- Abrir prompter en segunda pantalla.
- Probar play/pausa con `Espacio`.
- Probar saltos por párrafo con `←` y `→`.
- Probar velocidad con `↑` y `↓`.
- Probar cuenta atrás con el botón dedicado o `Cmd+Enter`.
- Probar pantalla negra con botón o `B`.
- Probar `Seguir lectura` en Control.
- Probar etiquetas `[CAM: ...]`, `[AVISO: ...]`, `[FIN AVISO]` y `==resalte==`.
- Probar carga de `.txt`, `.md`, `.docx` y `.pdf` con texto seleccionable.
- Probar modo una pantalla: con una sola pantalla conectada, abrir prompter y usar el control inferior.

## Pendiente antes de distribución pública

- Firma con Developer ID.
- Notarización de macOS.
- Revisión de `npm audit`.
- Decidir si se publica ZIP, DMG o ambos.
- Revisión visual final del icono en Finder, Dock y ventana Acerca de.
