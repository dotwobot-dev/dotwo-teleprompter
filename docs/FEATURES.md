# Funciones

## Control de lectura

- Play/Pause inmediato con `Espacio`.
- Modo Ensayo/Directo en la barra del guion para bloquear edición accidental.
- Estados visuales claros para pausa, reproducción, cuenta atrás, pantalla negra y final.
- Panel directo compacto para operar sin editor ni panel de ajustes.
- Modo portátil de una sola pantalla: si solo hay una pantalla conectada, el prompter muestra un control inferior para play/pausa, saltos por párrafo, reinicio y velocidad.
- Seguimiento opcional de escritura: al escribir o pegar en el editor, la pantalla de prompter salta a esa zona.
- Cuenta atrás separada con botón dedicado o `Cmd+Enter`.
- Pantalla negra/standby con botón dedicado y atajo `B`.
- Indicaciones flotantes para cámara o avisos al talento desde el guion.
- Indicador en Control de indicación actual y siguiente.
- `Seguir lectura` junto a `Seguir escritura`: bloquea edición y selecciona en Control la línea visual que está leyendo el talento.
- Tabla completa de teclado en [Atajos](SHORTCUTS.md).
- Saltos por párrafo con `←` y `→`.
- Saltos rápidos Inicio, Mitad y Final.
- Velocidad por palabras/segundo con slider, presets y atajos `↑`/`↓`.
- `Shift+↑` y `Shift+↓` cambian velocidad en pasos grandes.
- El panel derecho prioriza operación rápida: velocidad, cuenta atrás y formato visual arriba.

## Ajustes visuales

- Tipografía sans serif por defecto.
- Selección de familia tipográfica en la zona baja del panel de ajustes.
- Tamaño de fuente.
- Interlineado.
- Separación compacta entre párrafos en Prompter para mantener lectura continua.
- Ancho de columna.
- Posición vertical: `0` centra la primera línea; valores negativos suben; positivos bajan.
- La velocidad se recalcula visualmente al cambiar tamaño, ancho o interlineado para mantener palabras/segundo.
- Tema claro/oscuro.
- Guía central.
- Espejo horizontal.
- Fade superior e inferior.
- Presets de setup al final del panel derecho para aplicar, guardar o borrar configuraciones de lectura.

## Gestión de guion

- Barra propia encima del editor para acciones de guion y sesiones.
- Botón `Chuleta` con los códigos rápidos de guion.
- Inserción rápida de `CAM`, `AVISO`, `FIN AVISO`, notas internas, resaltado y limpieza desde la chuleta.
- Marcadores de sección usando líneas que empiezan por `#`, `##` o `###`.
- Comentarios internos con `//` que no salen en el prompter.
- Resaltado visible para talento usando `==texto==`.
- Códigos `[CAM: ...]`, `[AVISO: ...]` y `[FIN AVISO]` para activar, cambiar o quitar indicaciones flotantes incluso dentro de un párrafo.
- Resumen y validación básica de marcas de guion junto a los contadores.
- Selector navegable de marcas para saltar a cámaras, avisos, notas, cierres y resaltados.
- Selectores de secciones y marcas con botones separados para mover solo Control o solo Talento.
- Los saltos manuales de secciones y marcas se bloquean mientras `Seguir escritura` está activo para evitar órdenes cruzadas.
- Búsqueda compacta dentro del guion con contador, anterior/siguiente y limpieza sin mover la pantalla de talento.
- Contador de palabras, secciones y duración estimada.
- Escribir o pegar texto en tiempo real sin reiniciar el prompter.
- Cargar archivos `.txt`, `.md`, `.srt`, `.vtt`, `.csv`, `.docx` y `.pdf`.
- Convertir Word y PDF a texto limpio compatible con el Markdown interno.
- Limpiar texto pegado conservando notas internas, secciones y marcas sueltas como bloques propios.
- Limpiar subtítulos `.srt` y `.vtt` al cargar.
- Confirmaciones antes de acciones que reemplazan o transforman el guion actual.
- En modo Directo se bloquean acciones que pueden cambiar el guion, pero siguen activos los controles de operación.
- Guardar guion como archivo de texto.
- Lista de archivos recientes.
- Guardar y abrir sesiones.

## Responsive

La ventana de control usa breakpoints para:

- Mantener la barra de operación visible.
- Hacer scroll solo en la zona de ajustes.
- Reorganizar botones de pantalla y archivo en resoluciones pequeñas.
- Evitar overflow horizontal.
