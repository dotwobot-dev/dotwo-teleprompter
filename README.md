# DoTwo Teleprompter

Aplicación de escritorio para teleprompter con dos ventanas:

- **Control**: edición de guion, operación, ajustes, archivos y pantallas.
- **Prompter**: salida limpia en pantalla externa, fullscreen, espejo y lectura.

La app está hecha con Electron para tener ventanas nativas, control de pantallas y una UI basada en HTML/CSS/JS sin abrir un navegador visible.

## Licencia y atribución

DoTwo Teleprompter se publica bajo Apache-2.0. Puedes usarla, modificarla y crear forks, conservando los avisos de licencia y atribución del proyecto original según `LICENSE` y `NOTICE`.

Concepto y dirección original: Domingo Moreno / DoTwo.

Consulta también `THIRD_PARTY_NOTICES.md` para dependencias como Electron, Mammoth y PDF Parse.

## Distribución

Los ZIPs de la beta `0.1.0` archivados siguen sin firmar ni notarizar. El
codigo `0.2.0` esta en GitHub `main`, sin tag ni release publica. Tres candidatos
nuevos tienen firma, notarizacion y verificacion tecnica completas, pero aun
no se han probado en instalacion ni campo. Una copia **anterior** de la variante
Intel legacy se usa internamente en la facultad; su prueba no valida los
paquetes nuevos.

El flujo nuevo prepara ZIP, DMG y PKG con Developer ID y exige notarizacion y
verificaciones locales antes de marcar un candidato como valido. Modernas:
Apple Silicon e Intel, macOS 12+, Electron 43.7.7. Compatibilidad: Intel,
macOS 10.13+, Electron 26.6.10 sin soporte de seguridad.
Detalle y estado real en [Distribución](docs/DISTRIBUTION.md).

Para instalacion manual se usara el DMG: arrastra la app a Aplicaciones,
expulsa la imagen y abre Teleprompter desde Aplicaciones. El PKG es la
alternativa para despliegues gestionados. [Guia de instalacion](docs/INSTALLATION.md).

## Uso rápido

```bash
npm ci
npm start
```

## Funciones actuales

- Selección de pantalla externa.
- Ventana de prompter independiente en fullscreen.
- Visor plegable de la salida de Talento arriba a la derecha de Control y en Panel directo (presente en los tres candidatos internos; validacion funcional completa pendiente).
- Modo portátil de una sola pantalla con control inferior dentro del prompter.
- Play/pause inmediato con espacio.
- Modo Ensayo/Directo para bloquear edición accidental.
- Estados visibles: pausado, reproduciendo, cuenta atrás, pantalla negra y finalizado.
- Seguimiento opcional del cursor del editor en el prompter.
- Arranque con cuenta atrás desde botón dedicado o `Cmd+Enter`.
- Pantalla negra/standby sin cerrar la ventana de prompter.
- Códigos de guion para notas internas, cámara activa, avisos flotantes y texto resaltado.
- Inserción rápida y validación básica de códigos de guion desde la chuleta.
- Saltos por párrafo con flechas izquierda/derecha y botones `-`/`+`.
- Botones Inicio, Mitad y Final.
- Atajos de velocidad con flechas arriba/abajo.
- Tiempo total y restante estimados.
- Fade superior e inferior en la ventana de lectura.
- Carga de archivos `.txt`, `.md`, `.srt`, `.vtt`, `.csv`, `.docx` y `.pdf`.
- Importación de Word y PDF como texto limpio adaptado al Markdown interno.
- Barra de guion y sesiones encima del editor.
- Marcadores de sección con líneas `# Sección` y salto directo.
- Chuleta integrada de códigos de guion.
- Contador de palabras, secciones y duración estimada.
- Limpieza de texto pegado o importado.
- Limpieza automática de subtítulos `.srt`/`.vtt`.
- Confirmación antes de limpiar, cargar archivo, abrir reciente o abrir sesión si ya hay guion.
- Guardado de guion como archivo de texto.
- Archivos recientes.
- Guardado y apertura de sesiones con guion + ajustes.
- Ajustes de velocidad, cuenta atrás, tamaño, interlineado, ancho, posición vertical, tipografía y tema.
- Presets de configuración visual y de lectura, con presets incluidos y guardado local de presets propios.
- Espejo horizontal para teleprompter físico.
- Guardado local automático del estado actual.

## Scripts

```bash
npm start      # Ejecuta la app en modo desarrollo local
npm run check  # Valida sintaxis JS
npm test       # Pruebas del visor y del flujo de firma
npm run pack   # Genera una app desempaquetada en dist/
npm run release:mac # Flujo beta, sin garantizar notarizacion
npm run check:mac-signing # Comprueba certificados y perfil del Llavero
npm run release:mac:signed -- --all # Candidatos ZIP/DMG/PKG de las tres variantes
npm run dist   # Genera artefactos distribuibles como .dmg y .zip en dist/
```

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Estado del proyecto](docs/PROJECT_STATUS.md)
- [Hoja de ruta](docs/HOJA_DE_RUTA.md)
- [Administración del repo](docs/ADMINISTRACION_REPO.md)
- [Funciones](docs/FEATURES.md)
- [Dependencias](docs/DEPENDENCIES.md)
- [Empaquetado](docs/BUILD.md)
- [Distribución](docs/DISTRIBUTION.md)
- [Instalacion desde DMG](docs/INSTALLATION.md)
- [Manual rapido con capturas](docs/manual/README.md)
- [Roadmap público](docs/ROADMAP.md)
- [Beta operativa](docs/BETA.md)
- [Conceptos de icono](docs/ICON_CONCEPTS.md)
- [Atajos](docs/SHORTCUTS.md)
- [Formato de guion](docs/SCRIPT_MARKUP.md)
- [Formato de sesiones](docs/SESSION_FORMAT.md)
- [Desarrollo](docs/DEVELOPMENT.md)
- [Changelog](CHANGELOG.md)

## Estructura

```text
src/main.js        Proceso principal Electron: ventanas, pantallas, archivos e IPC
src/preload.js     API segura expuesta a las ventanas
src/control.html   Interfaz de control
src/control.css    Estilos de control y responsive
src/control.js     Estado, acciones de operador, archivos y ajustes
src/prompter.html  Ventana limpia del prompter
src/prompter.css   Estilos de lectura, fade, espejo y guía
src/prompter.js    Scroll, párrafos, cuenta atrás y runtime
docs/              Documentación del proyecto
build/             Recursos para empaquetado
dist/              Salida generada por electron-builder
```
