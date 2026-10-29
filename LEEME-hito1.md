# Hito 1 · Reproductor de lecciones

## Cómo instalarlo
1. Descomprime el zip **encima** de tu carpeta `C:\dev\ajedrez-app` y acepta reemplazar los archivos (App.tsx, src/...).
2. Instala la dependencia nueva (oculta la barra de abajo del sistema):
   ```
   npx expo install expo-navigation-bar
   ```
3. Inicia el servidor limpiando la caché:
   ```
   cd C:\dev\ajedrez-app
   npx expo start -c
   ```
4. Abre la app en el celular (Expo Go).

## Qué verás
- Pantalla de inicio con las 12 lecciones de la Unidad 1 y un botón "Tablero libre".
- Al tocar una lección: barra de progreso, pasos con tablero, y panel inferior verde o rojo.
- Pasos incluidos: explicación (con casillas resaltadas, flechas y destinos de una pieza), jugada, pregunta con opciones, tocar casillas.
- Si fallas, ves la pista y puedes reintentar de inmediato. Cada error se cuenta, pero no hay vidas ni bloqueos.
- Al terminar: pantalla con XP y errores.

## Cambios de esta versión (v2)
- Casilla tocada antes de comprobar: azul con borde. Casilla marcada en ejercicios: dorado con borde. Al acertar, la casilla pedida se resalta.
- Barra de navegación del sistema oculta.
- Las piezas se deslizan al moverse.
- Se quitó la lección «Capturar piezas» (ahora son 12). «Intercambios» tiene una pregunta nueva sobre el caballo y un ejercicio de recaptura con la secuencia reproducida.
- El tablero queda fijo arriba en todos los pasos; el texto y las opciones van debajo.

## Limitaciones de esta versión
- No se guarda el progreso (llega en el hito 2).
- Navegación provisional por estado; en el hito 2 pasa a React Navigation con pestañas.
- Los pasos `line` (aperturas) muestran un aviso: llegan en el hito 3.
- No se pudo ejecutar este código al escribirlo: si ves un error, copia el mensaje y lo corregimos.
