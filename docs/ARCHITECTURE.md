# Arquitectura

La app usa Electron con dos ventanas independientes.

## Procesos

- `src/main.js`: proceso principal de Electron.
  - Crea la ventana de control.
  - Crea o reposiciona la ventana de prompter.
  - Lee pantallas conectadas con `screen.getAllDisplays()`.
  - Abre y guarda archivos mediante diálogos nativos.
  - Expone acciones IPC.

- `src/preload.js`: puente seguro entre Electron y la UI.
  - Usa `contextBridge`.
  - No activa `nodeIntegration`.
  - Expone `window.teleprompter` con acciones concretas.

- `src/control.*`: ventana de operación.
  - Mantiene el estado principal.
  - Guarda estado en `localStorage`.
  - Envía estado y comandos al prompter.
  - Gestiona guiones, sesiones, recientes y limpieza de texto.

- `src/prompter.*`: ventana de lectura.
  - Renderiza el guion por párrafos.
  - Calcula saltos semánticos de párrafo.
  - Gestiona scroll, cuenta atrás, progreso y tiempo estimado.
  - Envía runtime a la ventana de control.

## Flujo de datos

1. El usuario edita texto o ajustes en Control.
2. Control guarda estado local y envía `prompter:set-state`.
3. Main reenvía el estado a la ventana Prompter.
4. Prompter re-renderiza texto/estilos sin reiniciar scroll.
5. Prompter envía runtime con progreso, tiempo y estado de reproducción.
6. Control actualiza barra, tiempos y botón Play/Pause.

## IPC principal

- `screens:list`: lista pantallas.
- `file:open-text`: abre un archivo de texto.
- `file:read-text`: reabre un archivo reciente por ruta.
- `file:save-text`: guarda el guion actual como texto.
- `session:save`: guarda sesión JSON.
- `session:open`: abre sesión JSON.
- `prompter:open`: abre o enfoca ventana Prompter.
- `prompter:close`: cierra ventana Prompter.
- `prompter:set-state`: estado Control -> Prompter.
- `prompter:command`: comandos Control -> Prompter.
- `prompter:runtime`: runtime Prompter -> Control.
