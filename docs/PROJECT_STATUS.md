# Estado del proyecto

Fecha de actualizacion: 2026-10-06

## Resumen

DoTwo Teleprompter es una app Electron de escritorio para control de guion y
salida limpia de teleprompter en una segunda ventana.

Version consolidada archivada: `0.1.0`. Fuente `0.2.0` en GitHub `main`.
Tres candidatos nuevos `0.2.0` firmados y notarizados, con verificacion tecnica
de ZIP/DMG/PKG; **instalacion y funcionamiento de campo aun no probados**.
Publicacion de prueba: GitHub prerelease `v0.2.0-rc.1`, no version estable.

Estado: una version anterior del candidato `0.2.0` Intel legacy, construida
desde el arbol sin commit, instalada por DMG y en produccion interna
en la facultad, segun confirmacion del usuario recibida el 2026-10-06.
No equivale a release publica GitHub ni a validacion de los candidatos nuevos.

Cambio incorporado a la fuente `0.2.0` y presente en los candidatos:
visor plegable de la salida real de Talento en la zona superior derecha de
Control y en Panel directo. Ya se han tomado capturas
nativas de la app firmada y su visor con un guion de demostracion y perfil
temporal separado. No sustituye las pruebas funcionales completas y de campo.

## Validacion

Comprobacion ejecutada en esta sesion:

```bash
npm run check
npm test
```

Resultado: sintaxis correcta y 17 pruebas automatizadas aprobadas (visor,
firma, espera limitada y reanudacion sin nueva subida).

Incidencia historica anterior a la firma: la prueba visual del antiguo runtime
no pudo ejecutarse porque macOS bloqueo el ejecutable
`Electron` y los registros mostraron tanto bloqueo de seguridad como fallo de
validacion de firma. Los intentos de arranque se detuvieron; el usuario confirmo
que los avisos dejaron de aparecer. No se han cambiado las protecciones de macOS.

El SHA-256 del ZIP de Electron 31.7.7 arm64 en cache coincide con el
[publicado oficialmente](https://github.com/electron/electron/releases/download/v31.7.7/SHASUMS256.txt).
Esto comprueba la integridad de la descarga, no resuelve ni invalida el bloqueo
de macOS. No se ha determinado su causa definitiva.

## Preparacion de firma

El 2026-10-04 se confirmo la cuenta individual activa del propietario y se
instalo su certificado Developer ID Application, emitido por G2, en el Llavero
de inicio de sesion de este Mac. Se verifico que la clave publica coincide con
la CSR creada aqui y que la identidad tiene asociada su clave privada.

Tambien se instalo el intermedio Developer ID G2 desde la web oficial de
Apple, verificando su cadena antes de importarlo y sin cambiar los ajustes
de confianza.

Comprobaciones: `security find-identity -v -p codesigning` devuelve una
identidad valida y `security verify-cert` pasa con la politica `codeSign`.
No se han exportado claves privadas ni guardado credenciales en el repo.

Tambien se instalo Developer ID Installer, emitido por G2, tras verificar que
su clave publica coincide con la segunda CSR y es distinta a la de Application.
`security find-identity -v -p basic` devuelve las dos identidades validas;
la cadena de Installer pasa la politica `basic`. Ya se han firmado los PKG
de las tres variantes y `pkgutil --check-signature` confirma Developer ID
Installer del equipo esperado y timestamp de confianza. Su notarizacion
queda pendiente.

Credenciales de notarizacion guardadas por el usuario en el Llavero bajo el
perfil `dotwo-notary`; autenticacion comprobada con `notarytool history`.
`npm run check:mac-signing` comprueba ambas identidades y el perfil sin acceder
a los secretos. Nuevo flujo `release:mac:signed` con salida separada por variante
y verificaciones obligatorias antes de marcar el manifiesto como `verified`.

Primera app moderna arm64 firmada; solicitud de notarizacion recibida por Apple
el 2026-10-04 a las 14:18 UTC: `9ff7adeb-e44e-4c0e-ab96-c1b3534a09ee`.
Tambien se genero y firmo la variante Intel legacy, con minimo `10.13` comprobado;
su solicitud de las 14:35 UTC es `d14bf670-8f04-4c66-a84f-ebaba4cea3e9`.
Tambien se genero y firmo Intel moderno: solicitud de las 14:39 UTC,
`cffeda57-d5fe-44ec-8a9c-e4d1ed84c0eb`.
Apple ya ha aceptado las tres apps. Eso no equivale a una release completa:
sus contenedores DMG/PKG requieren tambien notarizacion y verificacion.
Cada solicitud tiene su directorio y manifiesto independiente. No hay publicacion.
Los artefactos antiguos no cambian; instalar un certificado no demuestra que
el bloqueo del anterior Electron 31 este resuelto.

La firma de la app moderna pasa `codesign --verify --deep --strict`; su
metadato `LSMinimumSystemVersion` es `12.0`, con Team ID esperado, hardened
runtime y timestamp. Las tres apps ya tienen el ticket
adjunto y pasan Gatekeeper como `Notarized Developer ID` y `stapler validate`.
La app moderna Apple Silicon ya se ha ejecutado con un perfil temporal para
capturas de Control, Panel directo y Talento (modo portatil). Se comprobo el
visor pausado, el bloqueo Directo, el plegado del visor y los cambios de estado
Play/Pause y pantalla negra. No es todavia una prueba completa de todas las
combinaciones de formato, captura en movimiento y pantallas externas.

Se cerro la primera espera local de quince minutos sin cancelar la solicitud
de Apple. El flujo nuevo limita cada espera a cinco minutos y permite
`--resume` sobre el directorio de variante; conserva IDs y evita duplicados.
En aquel momento se conservaron estos directorios para retomar; el 06/10 Do
decidio abandonar la reanudacion de esta serie y se retiraron del disco local:

```text
release/signed/0.2.0-2026-10-04T14-15-16-214Z/modern-arm64/
release/signed/0.2.0-2026-10-04T14-34-30-330Z/legacy-x64/
release/signed/0.2.0-2026-10-04T14-36-36-904Z/modern-x64/
```

Se han generado ZIP/DMG/PKG de las tres variantes, sin cambiar las
firmas de las apps aprobadas. Los ZIP ya pasan la extraccion y verificacion
de la app. Apple ya ha aceptado los tres DMG:

- Apple Silicon: `946e8c49-3365-478b-ab45-c06879b8f1b9`.
- Intel moderno: `14b8f704-0dfc-41c5-9a19-49b8f6808128`.
- Intel legacy: `639fcae6-948e-4731-b612-dac0aef8a38e`.

La presentacion del DMG se comprobo visualmente en Finder: icono, flecha,
enlace `Aplicaciones` a `/Applications` e instrucciones en castellano, sin
solapamientos. Fondo 640 x 420 y Retina, generado con AppKit; formato UDZO.
Se monto en solo lectura y se expulso despues. No se instalo ni sobrescribio
ninguna app en `/Applications`. La app dentro del DMG legacy pasa firma,
Gatekeeper y ticket; su minimo declarado sigue siendo `10.13`.

Guia de instalacion y actualizacion: `docs/INSTALLATION.md`. El DMG es el
formato de instalacion manual; el PKG queda como alternativa para laboratorios.
Hasta terminar todos los checks, los manifiestos siguen `incomplete`.

## Copias de prueba y manual

Los tres DMG tienen copias separadas para pruebas en el NAS, con ticket
adjunto, `codesign --verify --strict`, `stapler validate` y Gatekeeper
`Notarized Developer ID` comprobados. Las copias se verificaron con SHA-256
despues de transferirlas; cada carpeta incluye `verification.json` e
`INSTALLATION.md`. Los originales no se alteraron mientras se evaluaba
`--resume`; sus manifiestos reflejan la ultima espera local. Posteriormente
se retiraron los candidatos completos y no se reanudaran esas solicitudes.

```text
/Volumes/BackUP_MacMini/DoTwo_Teleprompter/release_archive/CANDIDATE_0_2_0_TESTS/
  modern-arm64/DoTwo-Teleprompter-0.2.0-modern-arm64.dmg
  modern-x64/DoTwo-Teleprompter-0.2.0-modern-x64.dmg
  legacy-x64/DoTwo-Teleprompter-0.2.0-legacy-x64.dmg
  DoTwo_Teleprompter_Guia_Rapida_0.2.0.pdf
```

Manual rapido en castellano: dos paginas A4 con capturas reales, preparacion,
guion/sesiones, navegacion, lectura/visor, setup, directo, marcas y atajos.
Texto, capturas originales y generador en `docs/manual/`; PDF y renders fuera
de Git en `output/pdf/` y `tmp/pdfs/`. Revisado visualmente y comprobado el
numero de paginas y la extraccion de texto antes de entregarlo.

Estos DMG del 04/10 se prepararon para las pruebas solicitadas. El usuario confirma la
instalacion DMG y uso de Intel legacy en macOS 10.13 y su despliegue en la
facultad. No hay release publica. En esta serie historica siguen pendientes los
PKG y sus manifiestos; la nueva serie desde SHA limpio se detalla mas abajo.

## Validacion de campo y traspaso 2026-10-06

Confirmacion del usuario: app e instalacion desde DMG comprobadas en el trabajo
con macOS 10.13 legacy; Teleprompter ya esta en produccion en la facultad.
No se han aportado modelo del equipo ni un listado detallado de casos:
registrar esta confirmacion sin inventar cobertura de pantallas, formatos
de guion o pruebas en Apple Silicon/Intel moderno.

Incidencias y peticiones futuras se trataran cuando las comunique el usuario.
No se ha creado vigilancia automatica ni publicado una release. Antes del
commit del 06/10, GitHub `main` seguia en
`e6720f0d18dea5d70bea0bae3a443b56a9e2057e`.

Revision de procedencia del 2026-10-06: los tres manifiestos registran ese
commit y `sourceDirty: true`; no identifican una revision limpia del fuente.
Los ocho archivos de `src/` extraidos de cada `app.asar` coinciden byte a byte
con el arbol local actual, incluido el visor. Esto no demuestra que scripts,
configuracion de empaquetado, manual y documentacion actuales existieran ya
al construir las apps. Los manifiestos originales siguen `incomplete`:
registran app aceptada, DMG en `In Progress` y ninguna solicitud PKG.
Los DMG originales coinciden con sus hashes de manifiesto. Las copias del NAS,
con ticket grapado, tienen hashes distintos que coinciden con sus recibos
`verification.json`. No mezclar estas dos series de artefactos ni llamar
release reproducible al candidato basado en un arbol sucio.

## Nueva serie firmada desde SHA limpio — 2026-10-06

Fuente: commit `9ec71a67d650f7ce721bd7b37d8927790a4cbc84`, push normal a
GitHub `main` y workflow `Check` aprobado sobre ese SHA. Los tres candidatos
nuevos estan en `release/signed/0.2.0-2026-10-06T17-24-32-239Z/`, uno por
variante: `modern-arm64`, `modern-x64` y `legacy-x64`.

Los tres manifiestos registran `sourceDirty: false` y `status: verified`.
Apple acepto por separado app, DMG y PKG de cada variante. El flujo comprobo
firma, tickets y Gatekeeper; los nueve SHA-256 de ZIP/DMG/PKG se recalcularon
y coinciden con sus manifiestos. Aqui `verified` significa **verificacion
tecnica de artefactos**, no prueba de instalacion ni de uso de la app.

Do prefiere realizar las pruebas de campo el 2026-10-07 en la facultad, donde
hay principalmente Macs Intel y tambien algunos M1/M2. Hasta recibir sus
resultados, clasificar estos paquetes como **firmados y notarizados, no probados
en instalacion/campo**. No se han instalado en este Mac ni sustituido la
legacy en uso. El 06/10 se publico una prerelease de pruebas; conservar los
IDs de Apple del 04/10 solo como registro historico, sin mezclarlos con esta
nueva serie.

La prerelease publica `v0.2.0-rc.1` apunta al SHA binario
`9ec71a67d650f7ce721bd7b37d8927790a4cbc84`, no al commit documental
posterior `ab2fa8a454dd6892b1ee6607527ef1072f3742f1`. GitHub contiene
seis instaladores (DMG y PKG para las tres variantes) y un archivo de checksums;
los seis digests publicados coinciden con los manifiestos y el NAS. La release
esta marcada `prerelease`, no `latest` ni estable. No atribuirle pruebas de campo.

El NAS conserva una copia verificada de los seis DMG/PKG nuevos en
`release_archive/CANDIDATE_0_2_0_9ec71a6_FIRMADO_NO_PROBADO/`, sin apps
sueltas ni ZIP duplicados. Cada instalador coincide con el SHA-256 de su
manifiesto; `ESTADO.md` distingue verificacion tecnica de pruebas de campo.
Los tres DMG de prueba del 04/10 siguen en `CANDIDATE_0_2_0_TESTS/` y alli se
archivaron sus PKG originales, firmados pero **sin notarizar**, con manifiestos
separados. Do decidio prescindir de los tres candidatos locales del 04/10 el
2026-10-06. Se eliminaron tras verificar DMG y PKG historicos en el NAS;
esas copias no permiten reanudar `--resume`, y no se intentara recuperar las
solicitudes antiguas. Solo queda local la nueva serie firmada desde SHA limpio.

Guia y prompt para el hilo de Compress, guardados en la raiz compartida:

```text
/Users/dotwo/Repos/APPLE_SIGNING_DMG_HANDOFF.md
/Users/dotwo/Repos/PROMPT_DOTWO_COMPRESS_FIRMA_DMG_MANUAL.md
```

Incluyen la infraestructura comprobada el 2026-10-06, firma explicita de
FFmpeg/FFprobe, adaptacion CJS/ESM y esquema de builder, DMG, manual y entrega
en NAS. Compress se ha leido como referencia; no se ha modificado ni firmado
desde esta sesion. El prompt no se ha enviado a otro hilo.

## Compatibilidad acordada

- Moderna Apple Silicon e Intel: Electron `43.7.7`, macOS `12.0` o posterior.
- Legacy Intel: Electron `26.6.10`, macOS `10.13` o posterior para la facultad.
- Electron 26 esta fuera de soporte; firma/notarizacion no corrigen ese riesgo.
- Prueba de app e instalacion DMG en High Sierra confirmada por el usuario.
- Ampliar las pruebas al renovar artefactos y no generalizar a otras variantes.

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

Copia del codigo, recursos, documentacion y Git (sin dependencias, builds,
certificados ni credenciales), preparada en esta sesion:

```text
/Volumes/BackUP_MacMini/DoTwo_Teleprompter/repo_backups/DoTwo_Teleprompter_field_validation_20261006.tar.gz
```

Los backups anteriores de firma, DMG y manual se conservan. Solo la serie nueva
de apps y contenedores sigue local en `release/signed/`; este backup de fuente
no permite retomar un ticket si se pierde la app exacta enviada a Apple.

## Limpieza 2026-06-03

El repo local quedo reducido a unos `5.4 MB` tras archivar releases y retirar
artefactos regenerables.

Archivado en NAS:

```text
/Volumes/BackUP_MacMini/DoTwo_Teleprompter/release_archive/BETA_0_1_0/
/Volumes/BackUP_MacMini/DoTwo_Teleprompter/repo_backups/DoTwo_Teleprompter_preclean_20260603_130636.tar.gz
```

## Pendiente relevante

- La serie historica del 04/10 quedo retirada localmente; conservar sus DMG de
  prueba y PKG sin notarizar en el NAS solo como historico, sin reanudarla.
  La serie nueva tiene app, DMG y PKG firmados, notarizados y verificados
  tecnicamente.
- Completar las pruebas funcionales del visor con el runtime aprobado, sin ejecutar el Electron 31 bloqueado.
- Probar instalacion y funcionamiento de los **nuevos** artefactos en Macs Intel
  y M1/M2 de la facultad. La confirmacion legacy 10.13 corresponde al DMG anterior.
- Revision de dependencias antes de distribucion publica.
- Registrar resultados de campo y feedback de la prerelease antes de decidir
  la release estable; mantener el estado «firmado y notarizado, no probado en
  campo» hasta tener esa evidencia.
