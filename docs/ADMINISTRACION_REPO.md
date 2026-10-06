# Administracion del repositorio

Fecha de inventario: 2026-06-03

Este repo debe tratarse como la fuente de trabajo de DoTwo Teleprompter. Los
paquetes generados para entrega no deben formar parte del historial Git normal,
porque pesan mucho y se pueden reconstruir desde el codigo, la configuracion y
los recursos activos.

## Que debe vivir en Git

- `src/`: proceso principal, preload y ventanas de Control/Prompter.
- `scripts/`: generacion de marca y release macOS.
- `build/icon.icns`, `build/icons/`, `build/icon.iconset/` y recursos finales de `build/brand/`.
- `docs/`: documentacion tecnica, beta, build, formato de guion y continuidad.
- `README.md`, `LEEME_PRIMERO.md`, `CHANGELOG.md`.
- `package.json` y `package-lock.json`.

## Que no debe vivir en Git

- `node_modules/`: se regenera con `npm install`.
- `dist/` y `dist-legacy/`: salidas de `electron-builder`.
- `release/`: ZIPs beta y candidatos ZIP/DMG/PKG firmados.
- Certificados, CSRs, claves, `.p12`, `.p8`, `.env` y credenciales del Llavero.
- `logs/`, `reports/`, `artifacts/`, temporales y `.DS_Store`.
- Bocetos y candidatos antiguos de marca que ya no alimentan el build.

## Peso detectado antes de limpieza

- Repo completo: unos `1.6 GB`.
- `node_modules/`: unos `584 MB`.
- `dist/`: unos `529 MB`.
- `dist-legacy/`: unos `247 MB`.
- `release/`: unos `305 MB`.
- `build/`: unos `12 MB`.

## NAS

Patron de archivo:

```text
/Volumes/BackUP_MacMini/DoTwo_Teleprompter/
  release_archive/
  repo_backups/
```

## Validacion basica

```bash
npm run check
npm test
```

## Politica de limpieza local

Se pueden borrar y regenerar cuando haga falta, salvo candidatos enviados
a Apple que aun deban retomarse:

```text
node_modules/
dist/
dist-legacy/
release/
```

Antes de borrar `node_modules/`, confirmar que existe `package-lock.json`. Para
reinstalar:

```bash
npm install
```

No borrar ni modificar `release/signed/<ejecucion>/<variante>/` cuando su
manifiesto tenga una solicitud pendiente. `--resume` necesita esa misma app,
sus artefactos y el manifiesto; recompilarla no equivale a retomar su ticket.
Archivar los candidatos verificados antes de limpiarlos. Las claves privadas
y credenciales siguen en el Llavero del host, no en los backups normales del NAS.

Antes de generar paquetes nuevos:

```bash
npm run check
npm test
npm run check:mac-signing
npm run release:mac:signed -- --all
```

## Limpieza realizada

En la sesion de inventario del `2026-06-03` se retiraron del arbol local:

- `node_modules/`
- `dist/`
- `dist-legacy/`
- `release/`
- `.DS_Store`
- `build/icon-concepts/`
- candidatos antiguos de `build/brand/` que no alimentan el build actual.

Antes de limpiar se guardo en el NAS:

```text
/Volumes/BackUP_MacMini/DoTwo_Teleprompter/release_archive/BETA_0_1_0/
/Volumes/BackUP_MacMini/DoTwo_Teleprompter/repo_backups/DoTwo_Teleprompter_preclean_20260603_130636.tar.gz
```

Resultado local despues de limpieza: unos `5.4 MB`.
