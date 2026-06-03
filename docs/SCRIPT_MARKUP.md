# Formato de guion

El editor guarda texto plano con marcas sencillas. Control muestra el texto completo y Prompter interpreta algunas marcas al renderizar.

El botón `Chuleta` incluye controles compactos para insertar `CAM`, `AVISO`, `FIN AVISO`, notas internas, resaltado y limpiar el guion.

## Comentarios internos

```md
// Entra vídeo antes de este bloque
```

Las líneas que empiezan por `//` son notas para operador o realización. No aparecen en la ventana de prompter.

Al limpiar texto, estas líneas se conservan como bloque propio para que no se mezclen con el texto leído.

## Indicaciones flotantes

```md
[CAM: 1]
Texto que lee el talento.

[AVISO: Mira a cámara 2]
Siguiente bloque de lectura.

El texto empieza en cámara uno [CAM: 1] y cambia aquí a cámara dos [CAM: 2] sin cortar el párrafo.

Esta parte tiene aviso [AVISO: Más energía] y desde aquí se limpia [FIN AVISO].
```

- `[CAM: ...]` muestra una indicación flotante tipo cámara.
- `[AVISO: ...]` muestra una indicación flotante libre.
- `[FIN AVISO]` quita la indicación flotante.
- Si una marca está sola en un párrafo, se aplica al siguiente bloque visible.
- Si una marca está dentro de un párrafo, se activa desde ese punto concreto del texto.

## Resaltado

```md
Esta frase tiene ==una palabra clave== resaltada.
```

El texto entre `==` aparece resaltado para el talento en Prompter.

Si hay texto seleccionado en el editor, el botón `Resaltar` de la chuleta envuelve esa selección con `==`.

## Validación

Control muestra un resumen de marcas junto al contador de palabras y avisa de casos básicos:

- Resaltado `==` sin cerrar.
- Marcas `[CAM:]` o `[AVISO:]` vacías.
- Marcas `[CAM:` o `[AVISO:` sin cierre `]`.
- Indicación flotante activa hasta el final del guion.

Control también muestra la indicación flotante actual y la siguiente cuando el prompter está abierto.

## Navegación de marcas

El selector `Marca` permite saltar directamente a:

- Cámaras.
- Avisos.
- Cierres `[FIN AVISO]`.
- Notas `//`.
- Resaltados `==texto==`.

Cada selector tiene botones separados: `Control` coloca el cursor del editor en esa posición y `Talento` mueve la ventana de prompter a esa zona del guion.

## Limpieza

La acción `Limpiar` está dentro de la chuleta porque forma parte de la preparación del formato interno. Normaliza espacios y párrafos, pero protege:

- Líneas `// Nota`.
- Líneas de sección `#`, `##`, `###`.
- Marcas sueltas `[CAM: ...]`, `[AVISO: ...]` y `[FIN AVISO]`.

## Secciones

```md
# Intro
## Bloque 1
### Cierre
```

Las líneas con `#`, `##` o `###` crean secciones para el selector de salto. El botón `Control` enfoca esa sección en el editor y `Talento` mueve la lectura a esa sección.
