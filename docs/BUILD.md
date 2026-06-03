# Empaquetado

El proyecto usa `electron-builder`.

## Desarrollo

```bash
npm install
npm start
```

## Validación

```bash
npm run check
```

Este comando valida sintaxis de los archivos JavaScript principales.

## App desempaquetada

```bash
npm run pack
```

Genera una app local dentro de `dist/` sin crear instalador final.

Uso recomendado:

- Probar iconos y recursos.
- Comprobar que la app abre fuera del entorno de desarrollo.
- Hacer una revisión rápida antes de distribuir.

## Builds de macOS

Hay tres familias de app para macOS:

| Build | Equipo destino | macOS minimo | Electron | Script | Salida |
| --- | --- | --- | --- | --- | --- |
| Moderna Apple Silicon | Macs M1/M2/M3/M4 | 10.15 | Version actual del proyecto | `npm run pack:mac-arm64` | `dist/mac-arm64/DoTwo Teleprompter.app` |
| Moderna Intel | Macs Intel recientes | 10.15 | Version actual del proyecto | `npm run pack:mac-intel` | `dist/mac/DoTwo Teleprompter.app` |
| Legacy Intel | Macs Intel antiguos | 10.13 | Electron 26.6.10 | `npm run pack:mac-legacy` | `dist-legacy/mac/DoTwo Teleprompter.app` |

Para mover cualquier `.app` entre equipos o carpetas compartidas, distribuirla
como `.zip`. En las pruebas, el bundle sin comprimir puede perder permisos o
metadatos al copiarse; el `.zip` conserva mejor la estructura interna de macOS.

## Release macOS completo

```bash
npm run release:mac
```

Valida sintaxis, regenera las tres apps macOS y crea tres ZIPs listos para
copiar en `release/`. El script limpia los ZIPs previos de `release/` antes de
crear los nuevos para evitar mezclar builds antiguas con la beta actual:

```text
release/DoTwo Teleprompter Apple Silicon.zip
release/DoTwo Teleprompter Intel macOS 10.15+.zip
release/DoTwo Teleprompter Legacy macOS 10.13 Intel.zip
```

## App legacy para macOS 10.13 Intel

La app oficial usa la versión moderna de Electron configurada en `package.json`.
Para equipos Intel antiguos con macOS 10.13 High Sierra se genera una variante
separada con Electron 26, que todavía marca `LSMinimumSystemVersion` como `10.13`.

```bash
npm run pack:mac-legacy
```

Salida:

```text
dist-legacy/mac/DoTwo Teleprompter.app
```

Notas:

- Es una build `x86_64`, pensada para Mac Intel.
- Debe distribuirse comprimida en `.zip` para conservar correctamente el bundle `.app`.
- Es una build legacy: Electron 26 ya no está dentro del soporte oficial actual de Electron.
- La app oficial moderna sigue siendo la build recomendada para macOS 10.15 o superior.

Comando recomendado para crear el ZIP legacy desde la raíz del proyecto:

```bash
ditto -c -k --sequesterRsrc --keepParent "dist-legacy/mac/DoTwo Teleprompter.app" "DoTwo Teleprompter Legacy macOS 10.13 Intel.zip"
```

## Distribuible

```bash
npm run dist
```

En macOS genera artefactos de la arquitectura local en `dist/`, configurados
en `package.json`:

- `.dmg`
- `.zip`

## Configuración

La configuración está en `package.json`, campo `build`.

Valores principales:

- `appId`: `com.dotwo.teleprompter`
- `productName`: `DoTwo Teleprompter`
- `directories.output`: `dist`
- `directories.buildResources`: `build`
- `mac.category`: `public.app-category.video`
- `mac.icon`: `build/icon.icns`

## Marca

Los recursos de marca quedan en:

```text
build/brand/dotwo-teleprompter-logo-candidate.png
build/brand/dotwo-teleprompter-icon-candidate.png
build/brand/dotwo-teleprompter-icon-candidate-square.png
build/icons/app-icon.png
build/icon.icns
```

`build/icons/app-icon.png` es el PNG maestro de 1024 px. `build/icon.icns` es el
recurso final usado por `electron-builder` para el icono de la app macOS.

## Notas para versión final

Antes de distribuir fuera de tu equipo conviene:

- Revisar firma y notarización de macOS.
- Revisar `npm audit`.
- Revisar dependencias de importación (`mammoth`, `pdf-parse`) antes de versión pública.
- Cambiar nombre de producto si deja de ser MVP.
- Decidir si se distribuye como `.dmg`, `.zip` o ambos.

## Estado verificado

En este entorno se ha probado:

```bash
npm run check
npm run pack
npm run pack:mac-arm64
npm run pack:mac-intel
npm run pack:mac-legacy
npm run release:mac
```

`npm run pack:mac-arm64` generó una app local en:

```text
dist/mac-arm64/DoTwo Teleprompter.app
```

`npm run pack:mac-intel` generó una app local en:

```text
dist/mac/DoTwo Teleprompter.app
```

`npm run pack:mac-legacy` generó una app local en:

```text
dist-legacy/mac/DoTwo Teleprompter.app
```

Notas vistas durante el empaquetado:

- La app usa firma ad-hoc local mientras no haya identidad de Developer ID configurada.
- La notarización de macOS queda pendiente para distribución pública.
- Si no hay icono en `build/`, Electron usa el icono por defecto.
