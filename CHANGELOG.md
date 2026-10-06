# Changelog

## 0.2.0 - Candidato sin publicar

- DMG con instalacion por arrastre a Aplicaciones, instrucciones en castellano, fondo Retina y guia de instalacion/actualizacion.
- Visor plegable de Talento en la parte superior de la columna derecha de Control, tambien disponible en Panel directo.
- Miniatura de la salida real de Prompter mediante captura interna de Electron: incluye espejo, guias, avisos, cuenta atras y pantalla negra, sin recortar ni deformar la imagen.
- Capturas limitadas en resolucion y frecuencia, sin solapamiento; se suspenden al plegar el visor u ocultar Control.
- Pruebas automatizadas de acceso IPC, cierre/reapertura, resolucion, concurrencia y recuperacion de capturas.
- Electron moderno actualizado y fijado a 43.7.7 para Apple Silicon e Intel con macOS 12+; variante Intel 10.13 conservada con Electron 26.6.10.
- Nuevo flujo de candidatos ZIP/DMG/PKG con certificados Developer ID Application e Installer del Llavero, hardened runtime, notarizacion y verificacion obligatorias.
- Directorios de salida independientes y manifiesto con estado, variantes y SHA-256; sin publicacion automatica.
- Pruebas automatizadas de identidades, credenciales, configuracion de variantes y rechazo de notarizaciones pendientes o invalidas.
- Node 22.12+ para desarrollo y Node 24 en CI. Certificados y secretos excluidos de Git.
- Estado de notarizacion y validacion visual registrado en `docs/PROJECT_STATUS.md`; los ZIPs antiguos 0.1.0 no cambian.

## 0.1.0

Estado actual del MVP operativo.

### Ventanas

- Ventana de control independiente.
- Ventana de prompter independiente en fullscreen.
- Seleccion de pantalla para enviar la salida de lectura.

### Lectura

- Play/Pause inmediato.
- Panel directo compacto para operación sin distracciones.
- Modo portátil de una sola pantalla con control inferior dentro del prompter.
- Cuenta atras separada del Play normal.
- Pantalla negra/standby sin cerrar la ventana de prompter.
- Atajo `B` para activar o desactivar pantalla negra.
- Indicaciones flotantes para cámara y avisos al talento.
- Indicaciones flotantes activables en mitad de párrafo y etiqueta `[FIN AVISO]` para quitarlas.
- Indicador de indicación actual y siguiente en Control.
- Resaltado de palabras o frases visibles en el prompter.
- Modo `Seguir lectura`: bloquea edición y selecciona en Control la línea visual actual de lectura del talento.
- Separación de párrafos más compacta en la ventana de talento para lectura continua.
- Velocidad basada en palabras/segundo, independiente del tamaño visual del texto.
- Presets rapidos de velocidad.
- Modo Ensayo/Directo para bloquear edicion accidental.
- Estados visuales claros para pausado, reproduciendo, cuenta atras y finalizado.
- Seguimiento opcional de escritura del editor en el prompter.
- Controles de Ensayo/Directo y Seguir escritura reubicados en la zona superior del guion.
- Bloqueo de saltos manuales de sección y marca mientras Seguir escritura está activo.
- Saltos por parrafo hacia delante y hacia atras.
- Correccion del salto hacia atras mientras el texto esta en reproduccion.
- Posicion vertical centrada como valor por defecto, con desplazamiento hacia arriba o abajo.
- Indicadores de progreso, tiempo total y tiempo restante.

### Guion

- Importacion de `.docx` como Markdown interno limpio.
- Importacion de `.pdf` con texto seleccionable.
- Aviso para PDFs sin texto extraible que puedan requerir OCR.
- Marcadores de seccion con `#`, `##` y `###`.
- Comentarios internos con `//` ocultos en el prompter.
- Boton `Chuleta` con referencia de códigos de guion.
- Chuleta ampliada con inserción rápida de códigos, resaltado de selección y limpieza de guion.
- Limpieza de texto ajustada para conservar notas internas y marcas sueltas como bloques propios.
- Resumen y validación básica de marcas de guion en Control.
- Selector navegable de marcas de guion.
- Selector para saltar directamente a secciones del guion.
- Saltos de secciones y marcas separados entre Control y Talento.
- Saltos de Control centrados en el editor con una sola pulsación.
- Buscador compacto de guion con contador, anterior/siguiente y limpieza.
- Atajos de búsqueda cambiados a `Cmd/Ctrl+G` para evitar saltos de línea accidentales con selecciones.
- Contador de palabras, secciones y duracion estimada.
- Texto de muestra actualizado con el comienzo del Quijote.
- Barra de guion/sesión movida encima del editor.
- Edicion en tiempo real sin reiniciar el prompter.
- Confirmaciones antes de reemplazar o transformar el guion actual.
- Bloqueo fino en modo Directo para acciones que pueden cambiar el guion.
- Carga de archivos de texto, Markdown, subtitulos y CSV.
- Limpieza de texto pegado o importado.
- Guardado de guion como texto.
- Archivos recientes.
- Guardado y apertura de sesiones.

### UI

- Responsive revisado para ventanas pequenas.
- Panel de ajustes con scroll propio.
- Barra de guion reorganizada en zonas `Archivo`, `Guion` y `Estado` para separar recientes, herramientas y mensajes.
- Estado y modo de edición comparten una misma línea operativa, justificados a izquierda y derecha.
- Zona de resumen del guion movida a una línea propia justo antes del texto para evitar descuadres con navegación.
- Reordenacion del panel derecho para dejar arriba velocidad, cuenta atras y formato visual.
- Barras de scroll afinadas con CSS.
- Tipografia sans serif por defecto y selector de tipografia.
- Tipografia movida a la zona baja del panel de ajustes.
- Presets de setup al final del panel derecho, con presets incluidos y guardado local de presets propios.
- Tema claro/oscuro, espejo, guia central y fades de lectura.

### Proyecto

- Nombre de producto actualizado a `DoTwo Teleprompter`.
- Marca final aplicada: logo principal y monograma `TP` con gorra azul.
- Primera beta operativa preparada para pruebas de campo.
- Icono macOS conectado en `build/icon.icns` y configurado en `package.json`.
- Script `npm run release:mac` para generar ZIPs Apple Silicon, Intel moderno e Intel legacy.
- Cuatro conceptos de icono documentados en `docs/ICON_CONCEPTS.md`.
- Documentacion inicial del proyecto.
- Configuracion de empaquetado con `electron-builder`.
- App desempaquetada verificada en `dist/mac-arm64/DoTwo Teleprompter.app`.
- Scripts explicitos para builds macOS Apple Silicon, Intel moderno e Intel legacy.
- Build legacy Intel para macOS 10.13 con Electron 26 documentada en `npm run pack:mac-legacy`.
