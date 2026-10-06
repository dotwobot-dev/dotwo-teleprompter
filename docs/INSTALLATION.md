# Instalacion en macOS

## Elegir el paquete

- Apple Silicon (M1 o posterior), macOS 12+: `modern-arm64.dmg`.
- Intel, macOS 12+: `modern-x64.dmg`.
- Intel, macOS 10.13 a 11: `legacy-x64.dmg`.

Los nombres completos incluyen `DoTwo-Teleprompter` y la version. La variante
legacy conserva equipos antiguos, pero Electron 26 ya no recibe parches de
seguridad. Usar la moderna siempre que el equipo lo permita.

## Instalar arrastrando

1. Abre el archivo `.dmg` con doble clic.
2. Arrastra **DoTwo Teleprompter** sobre **Aplicaciones**, a su derecha.
3. Espera a que termine la copia. En equipos de la facultad puede hacer falta
   que un administrador autorice la escritura en Aplicaciones.
4. Expulsa la imagen desde Finder.
5. Abre **DoTwo Teleprompter** desde Aplicaciones, no desde la imagen montada.

El acceso Aplicaciones apunta a `/Applications`: no es una segunda copia de
la app. Puedes eliminar el archivo `.dmg` despues de instalarla.

## Actualizar

Cierra Teleprompter antes de arrastrar la nueva version a Aplicaciones. Si
Finder pregunta, confirma Reemplazar solo despues de comprobar que es la
variante correcta para el equipo. La app guarda guiones, ajustes, recientes
y presets fuera del bundle; no borres sus datos de usuario al actualizar.
Como precaucion, guarda la sesion de trabajo antes de actualizar.

## Seguridad

Distribuir solo los candidatos cuya firma y notarizacion hayan sido verificadas.
Una confirmacion normal de primera apertura no equivale a un aviso de software
malicioso. Si macOS dice que la app contiene malware, esta danada o no puede
verificarla, no desactives Gatekeeper ni retires la cuarentena: comunica el
mensaje exacto y el paquete utilizado para revisarlo.

Los DMG son para instalacion manual. El PKG se reserva para despliegue
administrado en laboratorios; no hace falta ejecutar ambos.
