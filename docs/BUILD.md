# Empaquetado

El proyecto usa `electron-builder`.

## Candidatos firmados 0.2.0

La version local `0.2.0` es un candidato sin publicar. El flujo nuevo requiere
Developer ID Application e Installer del mismo equipo, sus claves privadas en
el Llavero, herramientas de Xcode y el perfil de notarizacion `dotwo-notary`.

```bash
npm run check:mac-signing
npm run release:mac:signed
npm run release:mac:signed -- --variant modern-x64
npm run release:mac:signed -- --variant legacy-x64
npm run release:mac:signed -- --all
npm run release:mac:signed -- --resume /ruta/absoluta/al/candidato/variante
```

Sin argumentos genera solo la variante moderna de la arquitectura local;
`--all` prepara las tres secuencialmente. Cada ejecucion crea un directorio
nuevo, no borra candidatos anteriores y no publica nada:

```text
release/signed/0.2.0-<fecha-UTC>/<variante>/
  manifest.json
  DoTwo-Teleprompter-0.2.0-<variante>.zip
  DoTwo-Teleprompter-0.2.0-<variante>.dmg
  DoTwo-Teleprompter-0.2.0-<variante>.pkg
  mac[-arm64]/DoTwo Teleprompter.app
```

Variantes: `modern-arm64`, `modern-x64` y `legacy-x64`. Application firma app
y DMG; Installer firma el PKG, que instala en `/Applications`. El flujo exige
hardened runtime, timestamp, aceptacion de Apple y tickets de notarizacion.
Los entitlements conceden unicamente JIT, no camara, microfono ni excepciones
de validacion de bibliotecas.

Se verifica la app con `codesign`, `spctl` y `stapler`, se extrae el ZIP para
repetir las comprobaciones y se verifican DMG/PKG. Solo cuando todo termina
el manifiesto pasa de `incomplete` a `verified` e incluye SHA-256. La existencia
de un archivo firmado no equivale a candidato verificado; incluso `verified`
necesita pruebas funcionales y de campo antes de distribucion.

Cada solicitud guarda su ID antes de esperar un maximo de cinco minutos. Si
Apple sigue procesando, el comando termina dejando el candidato `incomplete`;
`--resume` consulta la misma solicitud sin volver a subirla ni recompilar la
app. La espera local termina, pero Apple continua procesando. El empaquetado
de ZIP/DMG/PKG solo empieza cuando la app obtiene su ticket. DMG y PKG reciben
sus propias solicitudes, tambien persistidas. No editar una app ya enviada.

Variables opcionales no secretas: `APPLE_TEAM_ID`, `APPLE_KEYCHAIN_PROFILE`,
`APPLE_KEYCHAIN` y `CSC_KEYCHAIN`. No guardar contrasenas Apple, claves API,
certificados ni `.p12` en el repo. Estado real: [Estado](PROJECT_STATUS.md).

### Presentacion del DMG

La imagen contiene la app a la izquierda y un enlace `Aplicaciones` a
`/Applications` a la derecha. Fondo de 640 x 420 con instrucciones en castellano,
flecha y version Retina; formato UDZO compatible con macOS 10.13.
La app enviada a Apple no cambia: se personaliza solo su contenedor DMG.

```bash
npm run build:dmg-background
```

Regenera `build/dmg/background.png` y `background@2x.png` con AppKit, sin
dependencias npm adicionales. La configuracion compartida vive en
`package.json`, campo `build.dmg`. Guia: [Instalacion](INSTALLATION.md).

## Desarrollo

```bash
npm install
npm start
```

Node 22.12+; CI usa Node 24. El 2026-10-04 se instalaron dependencias con
`npm install --ignore-scripts`, por lo que el runtime de `npm start` no esta
instalado. No reutilizar ni forzar la ejecucion del Electron 31 bloqueado por
macOS. El empaquetador descarga el runtime oficial por separado.

## Validación

```bash
npm run check
npm test
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
| Moderna Apple Silicon | Macs Apple Silicon | 12.0 | Electron 43.7.7 | `npm run pack:mac-arm64` | `dist/mac-arm64/DoTwo Teleprompter.app` |
| Moderna Intel | Macs Intel con Monterey o posterior | 12.0 | Electron 43.7.7 | `npm run pack:mac-intel` | `dist/mac/DoTwo Teleprompter.app` |
| Legacy Intel | Macs Intel antiguos | 10.13 | Electron 26.6.10 | `npm run pack:mac-legacy` | `dist-legacy/mac/DoTwo Teleprompter.app` |

Para mover cualquier `.app` entre equipos o carpetas compartidas, usar el
DMG, PKG o ZIP generado. El bundle sin comprimir puede perder permisos o
metadatos al copiarse; no distribuir la carpeta `.app` suelta por el NAS.

## Flujo beta historico

```bash
npm run release:mac
```

Valida sintaxis, regenera las tres apps macOS y crea tres ZIPs listos para
copiar en `release/`. El script limpia los ZIPs previos de `release/` antes de
crear los nuevos para evitar mezclar builds antiguas con la beta actual:

```text
release/DoTwo Teleprompter Apple Silicon.zip
release/DoTwo Teleprompter Intel macOS 12+.zip
release/DoTwo Teleprompter Legacy macOS 10.13 Intel.zip
```

No garantiza notarizacion ni borra el subdirectorio `release/signed/`.
Para nuevas releases usar `release:mac:signed`, no este flujo beta.

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
- El flujo firmado la distribuye en DMG, PKG o ZIP, preservando el bundle `.app`.
- Es una build legacy: Electron 26 ya no está dentro del soporte oficial actual de Electron.
- La app moderna sigue siendo la build recomendada para macOS 12 o superior.
- La firma y notarizacion no corrigen los riesgos del Electron legacy sin soporte.
- La app y su instalacion por DMG ya se probaron en un Mac Intel con macOS 10.13;
  repetir la prueba si se sustituye el artefacto desplegado.

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

## Notas para una release pública posterior

Antes de distribuir fuera de tu equipo conviene:

- Completar la firma, notarizacion y verificacion de los contenedores pendientes.
- Revisar `npm audit`.
- Revisar dependencias de importación (`mammoth`, `pdf-parse`) antes de versión pública.
- Cambiar nombre de producto si deja de ser MVP.
- Usar DMG para instalacion manual y PKG para despliegue gestionado; ZIP alternativo.

## Verificacion historica de la beta 0.1.0

Antes de la actualizacion del runtime se probaron estos comandos con la beta
`0.1.0`; no constituyen evidencia de notarizacion del candidato `0.2.0`:

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

Notas historicas vistas durante el empaquetado de `0.1.0`:

- La app usa firma ad-hoc local mientras no haya identidad de Developer ID configurada.
- Aquella beta no estaba notarizada para distribución pública.
- Si no hay icono en `build/`, Electron usa el icono por defecto.

El resultado actual de los candidatos nuevos se mantiene en `PROJECT_STATUS.md`.
