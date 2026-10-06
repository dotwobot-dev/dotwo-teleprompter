# Manual rapido de Teleprompter

Guia de dos paginas A4 para la version `0.2.0`, en castellano, con capturas
nativas de la app firmada. El guion de las imagenes es una demostracion;
se capturo con un perfil temporal separado de los datos del usuario.

- `content.json`: texto editable del manual, contrastado con la UI y el codigo.
- `assets/`: capturas originales de Control, Panel directo y Talento.
- `build_manual.py`: maquetacion reproducible con ReportLab y Pillow.

```bash
python3 docs/manual/build_manual.py
pdftoppm -r 130 -png output/pdf/DoTwo_Teleprompter_Guia_Rapida_0.2.0.pdf tmp/pdfs/guia
```

Necesita ReportLab y Pillow. La salida PDF y las pruebas de render quedan fuera
de Git; el texto, el generador y las capturas forman parte de la documentacion.
Se omiten la barra de titulo de macOS y su margen al colocar Control/Directo en el PDF,
sin modificar el contenido de las capturas. Talento muestra el modo portatil
porque se preparo en un Mac con una sola pantalla.

Destino de entrega en NAS:

```text
/Volumes/BackUP_MacMini/DoTwo_Teleprompter/release_archive/CANDIDATE_0_2_0_TESTS/DoTwo_Teleprompter_Guia_Rapida_0.2.0.pdf
```

El 2026-10-06 el usuario confirma prueba de app e instalacion DMG en macOS
10.13 y uso en produccion interna en la facultad. El manual no certifica
cobertura completa ni una release publica; seguir probando las otras variantes
y repetir las pruebas cuando cambie el artefacto.
