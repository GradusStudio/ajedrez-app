# Hito 2 · Progreso guardado, pestañas y ruta de Aprender

## Cómo probarlo
1. Las dependencias nuevas ya están instaladas (expo-router, AsyncStorage y las que necesitan). Si clonas el proyecto en otra PC, alcanza con `npm install`.
2. Inicia el servidor limpiando la caché (hace falta porque cambió el punto de entrada de la app):
   ```
   cd C:\dev\ajedrez-app
   npx expo start -c
   ```
3. Abre la app en el celular con Expo Go. Todo lo nuevo funciona en Expo Go, no hace falta una build de desarrollo.

## Qué verás
- **Seis pestañas abajo:** Aprender, Aperturas, Puzzles, Bots, Análisis (el tablero libre) y Perfil. Aperturas, Puzzles, Bots y Perfil muestran qué van a tener y en qué hito llegan.
- **Aprender:**
  - Arriba: tu racha (llama), la XP de hoy (rayo) y la barra de meta diaria (minutos de hoy sobre 10).
  - Encabezado de la unidad: «Lo básico · 3 de 12».
  - La ruta: nodos en zigzag. Verde con ✓ = terminada; verde con anillo que late = la actual; gris = bloqueada. Tocar una gris avisa qué lección terminar.
  - Dentro de una unidad, las lecciones se abren de a una. Todas las unidades están abiertas: la primera lección de cada una se puede hacer siempre, para que cada uno elija su nivel. Hoy hay una sola unidad; las siguientes aparecen debajo cuando se agreguen.
  - Abajo, fija: una tarjeta con la lección sugerida y el botón **Empezar** (o **Continuar** si la dejaste a medias). La sugerida es la siguiente de la unidad en la que estás trabajando.
- **Dentro de una lección:** si sales con la ✕ o con "atrás", tu avance queda guardado y la próxima vez sigues desde ese paso.
- **Resultado:** XP ganada, días de racha y errores. Si hubo errores, aparece **Repasar errores**, que repite solo los pasos que fallaste.
- **Reglas:**
  - La XP de una lección se suma solo la primera vez. Repetirla suma a la racha y a la meta diaria.
  - La racha sube un día cada día que terminas al menos una lección o un repaso. Si pasa un día entero sin practicar, vuelve a 0.
- El progreso sigue ahí al cerrar y volver a abrir la app. Si tenías progreso de la primera versión de este hito, se conserva.

## Qué probar
1. Termina la lección 1 con algún error. Mira el resultado y toca **Repasar errores**.
2. Vuelve a Aprender: la lección 1 tiene ✓ y la 2 es la actual.
3. Toca la lección 5: tiene que avisar que está bloqueada.
4. Empieza la lección 2, avanza dos pasos y sal con la ✕. El botón tiene que decir **Continuar**, y al entrar debes seguir en el paso 3.
5. Cierra la app del todo (desde las apps recientes) y vuelve a abrirla: todo tiene que seguir igual.
6. Mira la barra de pestañas: los íconos y los nombres tienen que verse completos, con un poco de aire abajo.

## Cómo está armado
- Navegación con **Expo Router**: cada archivo de `src/app/` es una pantalla. El detalle está en `docs/mapa-de-pantallas.md`, sección 5.
- Progreso en `src/progress/`:
  - `progressStore.ts`: los datos y las reglas (XP, racha, errores, avance).
  - `ProgressContext.tsx`: `useProgress()`, para usar el progreso en cualquier pantalla.
  - `path.ts`: el estado de cada nodo de la ruta.
- **Para abrir todas las lecciones sin bloqueos:** en `src/progress/path.ts` cambia `LOCK_LESSONS = true` por `false`.
- Las reglas de racha, XP, errores, avance y la migración de datos se probaron con un script (23 casos, todos bien).

## Limitaciones de esta versión
- La meta diaria es fija en 10 minutos. Se elige en la bienvenida, que llega en el hito 6.
- No hay botón para borrar el progreso. Llega en Ajustes (hito 6); el código ya existe (`resetProgress`).
- `npx expo lint` no funcionaba en este hito por un conflicto con `react-dom`. Se resolvió en el hito 4.
- No se probó en el celular al escribirlo: si ves un error, copia el mensaje y lo corregimos.
