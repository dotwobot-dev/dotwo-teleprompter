# Estado del proyecto

Fecha de inventario: 2026-06-03

## Resumen

DoTwo Teleprompter es una app Electron de escritorio para control de guion y
salida limpia de teleprompter en una segunda ventana.

Version consolidada actual: `0.1.0`.

Estado: primera beta operativa documentada y empaquetable para macOS.

## Validacion

Comprobacion ejecutada en esta sesion:

```bash
npm run check
```

Resultado: correcto.

## Estructura activa

- `src/`: ventanas Electron, UI de control, preload y runtime del prompter.
- `scripts/`: generacion de marca y release macOS.
- `build/`: recursos activos de marca e icono para empaquetado.
- `docs/`: documentacion tecnica, formato de guion, atajos, build y beta.
- `package.json` y `package-lock.json`: dependencias y scripts npm.

## Artefactos externos

No forman parte del repo limpio:

- `node_modules/`
- `dist/`
- `dist-legacy/`
- `release/`
- `.DS_Store`
- logs, temporales y reportes generados.

Backups y releases archivadas:

```text
/Volumes/BackUP_MacMini/DoTwo_Teleprompter/
```

## Limpieza 2026-06-03

El repo local quedo reducido a unos `5.4 MB` tras archivar releases y retirar
artefactos regenerables.

Archivado en NAS:

```text
/Volumes/BackUP_MacMini/DoTwo_Teleprompter/release_archive/BETA_0_1_0/
/Volumes/BackUP_MacMini/DoTwo_Teleprompter/repo_backups/DoTwo_Teleprompter_preclean_20260603_130636.tar.gz
```

## Pendiente relevante

- Firma con Developer ID.
- Notarizacion de macOS.
- Pruebas de campo en Apple Silicon, Intel moderno e Intel legacy.
- Revision de dependencias antes de distribucion publica.
