# Dependencias

## Runtime

- Node.js: 22.12.0 o posterior para instalar dependencias y ejecutar scripts;
  CI usa Node 24. No se instala Node en los equipos que ejecutan la app.
- Electron: runtime de escritorio, ventanas, pantallas, diálogos nativos e IPC.

## Dependencias npm

### `electron`

Se usa para ejecutar la aplicación de escritorio.

La build moderna usa Electron `43.7.7`, fijado en `package.json`. La build
legacy para macOS 10.13 Intel se empaqueta con Electron `26.6.10` mediante el
script `npm run pack:mac-legacy`, sin cambiar la dependencia principal del
proyecto.

La distribución de macOS se separa por arquitectura:

- Apple Silicon moderno: Electron `43.7.7`, `arm64`, macOS 12+.
- Intel moderno: Electron `43.7.7`, `x86_64`, macOS 12+.
- Intel legacy: Electron `26.6.10`, `x86_64`, macOS 10.13+.

Electron 43 sigue dentro de las ramas mantenidas a fecha 2026-10-04 y conserva
Monterey. Electron 44 exige macOS 13. Electron 26 es la ultima rama compatible
con High Sierra y Mojave, pero ya no recibe parches: se conserva exclusivamente
como variante de compatibilidad para los equipos antiguos de la facultad.
La firma y notarizacion no corrigen las vulnerabilidades de ese runtime.

Fuentes: [Electron 27](https://www.electronjs.org/blog/electron-27-0),
[Electron 38](https://www.electronjs.org/blog/electron-38-0),
[Electron 44](https://www.electronjs.org/blog/electron-44-0) y
[politica de soporte](https://www.electronjs.org/docs/latest/tutorial/electron-timelines).

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
npm run check:mac-signing
npm run release:mac:signed -- --all
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
- `release/`: ZIPs beta y candidatos firmados; nunca se incluyen en Git.

## Revision de seguridad

El 2026-10-04 `npm audit` encontro 14 dependencias afectadas (13 high y
1 critical). `npm audit --omit=dev` reduce el resultado a una dependencia
de produccion afectada, `@xmldom/xmldom`, transitiva de Mammoth. La actualizacion
de Electron no sustituye la revision del toolchain ni de importadores Word/PDF
antes de publicar.
No se ha aplicado `npm audit fix --force` ni actualizado dependencias ajenas
a este cambio.
