# Formato de sesiones

Las sesiones se guardan como JSON.

Extensión sugerida:

```text
.teleprompter.json
```

## Estructura

```json
{
  "app": "teleprompter-mvp",
  "version": 1,
  "savedAt": "2026-05-31T11:40:00.000Z",
  "state": {
    "text": "Guion...",
    "speed": 2.2,
    "fontSize": 54,
    "fontFamily": "systemSans",
    "lineHeight": 1.35,
    "columnWidth": 78,
    "verticalPosition": 0,
    "countdownSeconds": 3,
    "operatorMode": "rehearsal",
    "followCursor": false,
    "mirror": false,
    "guide": true,
    "lightTheme": false
  }
}
```

## Qué guarda

- Texto del guion.
- Códigos de guion escritos dentro del texto, como `//`, `[CAM: ...]`, `[AVISO: ...]`, `[FIN AVISO]` y `==resaltado==`.
- Ajustes de lectura.
- Ajustes visuales.
- Cuenta atrás.
- Tema y guía.
- Estado de `Seguir escritura`.

## Qué no guarda

- La pantalla externa seleccionada.
- El estado de reproducción.
- El progreso actual del scroll.

Esto es intencional para que abrir una sesión sea seguro antes de directo.
