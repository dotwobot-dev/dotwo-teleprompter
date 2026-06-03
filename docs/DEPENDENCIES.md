# Dependencias

## Runtime

- Node.js: usado para instalar dependencias y ejecutar scripts.
- Electron: runtime de escritorio, ventanas, pantallas, diálogos nativos e IPC.

## Dependencias npm

### `electron`

Se usa para ejecutar la aplicación de escritorio.

La build oficial usa la versión moderna declarada en `package.json`. La build
legacy para macOS 10.13 Intel se empaqueta con Electron `26.6.10` mediante el
script `npm run pack:mac-legacy`, sin cambiar la dependencia principal del
proyecto.

La distribución de macOS se separa por arquitectura:

- Apple Silicon moderno: Electron actual, `arm64`, macOS 10.15+.
- Intel moderno: Electron actual, `x86_64`, macOS 10.15+.
- Intel legacy: Electron `26.6.10`, `x86_64`, macOS 10.13+.

Partes usadas:

- `app`
- `BrowserWindow`
- `screen`
- `dialog`
- `ipcMain`

### `electron-builder`

Se usa para empaquetar la app como aplicación de escritorio distribuible.

Scripts relacionados:

```bash
npm run pack
npm run pack:mac-arm64
npm run pack:mac-intel
npm run pack:mac-legacy
npm run release:mac
npm run dist
```

### `mammoth`

Se usa para importar documentos Word `.docx`.

Uso principal:

- Convertir `.docx` a Markdown simple.
- Conservar encabezados como marcadores internos cuando sea posible.
- Descartar el formato visual del documento original.

### `pdf-parse`

Se usa para importar PDFs con texto seleccionable.

Uso principal:

- Extraer texto plano de PDFs.
- Detectar PDFs sin texto extraíble para avisar de que pueden requerir OCR.

Limitación: no hace OCR sobre PDFs escaneados.

## Sin framework frontend

La UI está hecha con HTML, CSS y JavaScript nativo. No usa React, Vue, Svelte ni bundler.

Motivos:

- Arranque simple.
- Menos dependencias.
- Menos fricción para empaquetar.
- Suficiente para una UI de control estable.

## Archivos generados

- `node_modules/`: dependencias instaladas.
- `package-lock.json`: versiones exactas instaladas.
- `dist/`: salida de empaquetado.
- `dist-legacy/`: salida de empaquetado para macOS 10.13 Intel.
- `release/`: ZIPs finales por arquitectura generados por `npm run release:mac`.
