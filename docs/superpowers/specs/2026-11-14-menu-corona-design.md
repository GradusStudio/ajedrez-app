# Menú de Aprender y Aperturas: media corona, riel y tablero de progreso

Fecha: 14-11-2026 · Diseño: opus · Implementación: lingling (tareas en `agentes.md`).
Parte del prototipo `prototipo-rediseno.html` (13-11-2026, fuera de git) y de los bocetos del usuario (`C:\Bobeda obsidian\ideas\Gradus\Gradus - Ideas de menú.md`). Este documento manda sobre el prototipo donde no coinciden.

## Decisiones del usuario (14-11-2026)

1. **Web ancha (960 px o más):** el menú va como en el prototipo: barra lateral, media corona de 3 gajos, tablero a la derecha y riel de lecciones que entra desde la derecha.
2. **Celular (y web angosta):** un solo **riel vertical recto**. Se quita la ruta en zigzag porque se parece demasiado a Duolingo.
3. **El tablero es la barra de progreso.** Cada unidad y cada apertura tiene su propia partida, que avanza una jugada por cada lección hecha. No hay barras ni arcos de progreso en los gajos.
4. **Aperturas:** selector Blancas / Negras y la corona recorre las aperturas de ese color.
5. **La grilla de puntos de los bocetos no va.** Representaba el tablero.

## 1. Tablero de progreso (la pieza central)

### Regla

- Cada unidad o curso de apertura tiene una partida: `startFen` (opcional; si falta, la posición inicial), la lista de jugadas en UCI y el **bando que estudia** (`side`: `w` o `b`).
- Con `k` lecciones hechas de esa unidad o curso, el tablero muestra la posición **justo después de la jugada número `k` del bando que estudia**, con las jugadas del rival que haya antes.
  - Ejemplo, Italiana (blancas): 0 lecciones = posición inicial; 1 = después de `1.e4`; 2 = después de `1.e4 e5 2.Cf3`; 3 = después de `2...Cc6 3.Ac4`.
  - En un curso de negras: 1 = después de `1.e4 c5` (si la primera jugada es de las blancas, se muestra junto con la respuesta).
- Si la partida tiene menos jugadas del bando que lecciones, se queda en la posición final.
- **Unidad o curso completo: siempre la posición final de la partida**, aunque sobren jugadas. El final se revela al terminar (en casi todas las partidas de unidad es un mate).
- La última jugada mostrada va resaltada (`lastMove`). En la web, debajo del tablero: «Jugada 3 de 9» (`k` sobre el total de jugadas del bando; completo = «Partida completa»).
- `k` se cuenta con `progress.lessons` (lecciones hechas de esa unidad o curso), no con la lección sugerida.

### Partidas

- **Aperturas:** la línea principal del curso (paso `line` de la lección `l02` de cada apertura, ya en UCI en `aperturas-v3.json`). `side` = `color` del curso. Sin datos nuevos.
- **Unidades:** archivo nuevo `src/data/progressGames.json` (una sola copia: las jugadas no se traducen). Candidatas (partidas históricas; las jugadas no tienen derechos):

| Unidad | Partida | Por qué |
|---|---|---|
| 1 · Cómo se mueven las piezas | Greco, 1620: `1.e4 b6 2.d4 Ab7 3.Ad3 f5 4.exf5 Axg2 5.Dh5+ g6 6.fxg6 Cf6 7.gxh7+ Cxh5 8.Ag6#` | corta, mueven peón, alfil, dama y caballo, termina en mate |
| 2 · Reglas especiales | Ed. Lasker – Thomas, Londres 1912 (termina `18.Rd2#`) | el rey negro cruza todo el tablero; enroque de las negras |
| 3 · Táctica básica | Mate de Legal: `1.e4 e5 2.Cf3 d6 3.Ac4 Ag4 4.Cc3 g6 5.Cxe5 Axd1 6.Axf7+ Re7 7.Cd5#` | sacrificio de dama y mate con piezas menores |
| 4 · Apertura y estrategia | Morphy – Duque de Brunswick y Conde Isouard, París 1858 («la partida de la ópera», termina `17.Td8#`) | desarrollo rápido contra un rival que no desarrolla |
| 5 · Finales | posición de Lucena (`startFen`) jugada hasta coronar, con la maniobra del puente | es una lección de la unidad |
| 6 · Táctica intermedia | Réti – Tartakower, Viena 1910 (termina `11.Ad8#`) | sacrificio de dama, atracción y jaque doble |
| 7 · Finales intermedios | estudio de Réti, 1921 (`startFen` `7K/8/k1P5/7p/8/8/8/8 w - - 0 1`, el rey alcanza al peón) | rey activo |
| 8 · Piezas y peones | ruptura de tres peones contra tres (`startFen` `7k/ppp5/8/PPP5/8/8/8/7K w - - 0 1`): `b5b6 a7b6 c5c6 b7c6 a5a6 h8g7 a6a7 g7f7 a7a8q` (1.b6 axb6 2.c6 bxc6 3.a6 y corona) | es la lección «Rupturas y mayorías»; un peón pasa aunque sean tres contra tres. Elegida por opus el 14-11; chess.js y Stockfish (profundidad 22: 1.b6 es la mejor, +6,5, y sigue esta misma línea) |
| 9 · Ataque y defensa | Anderssen – Kieseritzky, Londres 1851 («la inmortal», termina `23.Ae7#`) | ataque al rey sin enrocar |

`side` = `w` en todas (en Lucena y Réti, el bando que juega primero). Una prueba valida cada partida con chess.js (jugadas legales; la final de 1, 2, 3, 4, 6 y 9 es mate). **Si una jugada transcrita aquí falla, se avisa en `agentes.md`; no se inventa una corrección.** La Unidad 8 parte de una posición (`startFen`), como la 5 y la 7.

## 2. Web ancha: corona, tablero y riel

Solo con `useWideLayout()` verdadero. La barra lateral es la `WideSidebar` que ya existe; no se construye otra.

**Referencia visual: `prototipo-rediseno-v2.html`** (14-11-2026, raíz del repo, fuera de git; usa las piezas Clásico y las posiciones reales de `progressGame.ts`). Manda sobre el prototipo v1. Se abre en una ventana de 1100 px o más.

**Estado «elegir»** (el que se ve al entrar):
- **Corona pegada a la barra lateral** (cambio del 14-11-2026 por el feedback de un tester; ver la spec del feedback, sección 7): el eje de la corona coincide con el borde de la barra lateral y el tablero (480 px) queda centrado en el resto, con el centro de la corona a la altura del centro del tablero.
- **Encabezado** encima de la corona, de alto fijo (104 px, para que no salte): «UNIDAD 2» chico (12 px, 900, mayúsculas, verde) y el nombre grande (24 px, 900, blanco, 2 renglones como máximo), alineados a la izquierda. Al cambiar de unidad, fundido de 140 ms.
- **Media corona** (`R 230`, `RIN 92`, separación de 2,4° a cada lado del gajo). Los gajos son **botones 3D** como `Button3D`: cara + canto del mismo gajo corrido 5 px hacia abajo; al apretar el actual, la cara baja la mitad del canto. Actual: `primary` con canto `primaryShadow`; vecinos: `surfaceRaised` con canto `surfaceShadow`, opacos (no semitransparentes: no parecen desactivados). El color se interpola según lo cerca que esté cada gajo del centro, así que durante el giro el verde pasa de uno a otro de forma continua. Donde no hay unidad, no se dibuja nada.
- **Eje:** una línea vertical de 4 px en `surfaceRaised` a lo largo del lado recto de la corona; lo que gira más allá de ±90° se esconde detrás del eje.
- **Rótulos:** en Aprender, solo el número (48 px el actual, 22 px los vecinos, siempre derechos); en Aperturas, el nombre corto (20 / 15 px).
- **Flechas:** dos botones redondos 3D (`Circle3D`, 44 px, `surfaceRaised` con canto `surfaceShadow`, chevron blanco) **dentro del hueco** de la corona, uno arriba y otro abajo del centro. Sin texto; etiqueta de accesibilidad «Unidad anterior» / «Unidad siguiente». Desactivados en los extremos (35 %).
- **Giro fluido:** la posición de la corona es un número continuo animado con un resorte críticamente amortiguado (rigidez 240, amortiguación 2·√240, sin rebote), no un giro de 60° y redibujo. Tocar varias veces seguidas suma objetivos sin cortar el movimiento. Arrastre vertical con el dedo o el mouse (150 px = un gajo), con resistencia en los extremos e inercia al soltar. Rueda del mouse o panel táctil: cada 60 px de desplazamiento, un gajo. Flechas ↑/↓ del teclado; Enter o espacio abre el riel. Con `useReducedMotion`, salta sin animar. En React Native, **sin dependencias nuevas** (el proyecto no tiene reanimated ni gesture-handler): `Animated.Value` para la posición, `Animated.spring` con `stiffness: 240`, `damping: 31`, `mass: 1` y `velocity` del gesto, y `PanResponder` para el arrastre (la rueda, solo en la web). Se dibujan todos los gajos y cada uno se rota con `transform` interpolado desde la misma posición.
- Tocar el gajo actual abre el riel; tocar un vecino lo trae al centro.
- **Tablero** de 480 px a la derecha, no interactivo, con piezas y tema del usuario, coordenadas, última jugada en `boardHighlight.lastMove` y, si la posición es mate, el rey en `boardHighlight.mate`. Leyenda debajo: «**Jugada 3 de 9** · avanza con cada lección» (la parte en negrita, en dorado). Al cambiar de unidad, las piezas se funden (160 ms); al completar una lección, la última pieza movida se desliza desde su casilla de origen (340 ms).
- Foco: el anillo dorado solo aparece al usar el teclado; con el mouse o el dedo no se mueve el foco.
- Al abrir la pestaña se muestra la unidad de `progress.lastUnit` (como hoy) o la de la lección sugerida.

**Estado «riel»** (al elegir una unidad):
- La columna de la corona sale por la izquierda con fundido, el tablero se corre hasta quedar **centrado en el espacio que deja el riel**, y el riel (400 px, borde izquierdo de 2 px en `surfaceRaised`) entra desde la derecha (520 ms, `cubic-bezier(0.22, 1, 0.36, 1)`). El tablero sigue mostrando esa partida.
- Los nodos del riel son círculos 3D de 44 px (como las flechas); hecho y actual en verde con canto `primaryShadow`, el actual con halo. El botón grande queda pegado abajo (`sticky`) aunque la unidad tenga muchas lecciones.
- Cabecera: botón «volver» (`Button3D` secundario) y título («UNIDAD 1» chico en verde, nombre grande).
- Riel recto con un nodo por lección: hecho (verde con ✓), actual (verde con halo), abierto y bloqueado. Estados con `lessonStates` de `src/progress/path.ts` (respeta `LOCK_LESSONS`). Tocar un nodo hecho, actual o abierto empieza esa lección; uno bloqueado no hace nada (con su estado en la etiqueta de accesibilidad).
- Botón grande al final: «Empezar» (0 hechas), «Continuar» o «Repasar» (unidad completa). Abre la lección sugerida de la unidad.
- Escape y «volver» regresan a «elegir».
- Barra de racha y monedas: arriba del todo, como en la Aprender de hoy.

## 3. Celular y web angosta: riel vertical

Reemplaza la ruta en zigzag de `HomeScreen` (solo Aprender; la pestaña Aperturas del celular no cambia en esta etapa).
- Un riel recto, centrado a la izquierda (como el riel de la web), con los mismos nodos y estados de la sección 2. Se quitan `ZIGZAG` y el desplazamiento de `LessonNode`.
- Cabecera de cada unidad: tarjeta con el nombre y un **tablero chico** (unos 120 px) con la posición de progreso de la sección 1. Así el tablero sigue siendo la barra de progreso en el teléfono.
- Se mantienen el menú de unidades, el botón flotante, la tarjeta de recuperación de racha y la barra de racha y monedas.

## 4. Aperturas en la web ancha

- La misma pantalla de la sección 2, con un `Segmented` Blancas / Negras arriba de la corona (la elección se recuerda mientras dura la sesión). La corona recorre las aperturas de ese color en el orden de hoy.
- El riel lista las lecciones del curso (Idea, Línea principal, guías y Repaso) con sus estados; el botón abre la sugerida. «Ver curso» lleva a la ficha actual (`OpeningDetailScreen`) para lo que el riel no muestra.
- Nombre corto para el gajo (campo nuevo `short` en los datos traducidos de aperturas, 11 caracteres como máximo). Español: Londres, Italiana, Vienesa, Escandinava, Najdorf, Dragón, Ataque IR, India Rey, Moderna, Pirc, Escocesa, Evans, Blackmar, Caro-Kann, Ruy López, Rossolimo, Alapin, G. Dama, G. Rey, Albin, Catalana, Inglesa, Danés, Francesa, Nimzoindia, Petrov, GD Decl., GD Acep., Holandesa. En, de, it y fr con gemma4 vía Ollama (sin revisión de nativos), con el mismo tope.

## 5. Accesibilidad y textos

- Cada gajo es un botón con etiqueta completa («Unidad 2: Reglas especiales, 3 de 6 lecciones»). El tablero lleva `accessibilityLabel` con la leyenda.
- Áreas táctiles de 44 px o más. Contraste del texto de los gajos vecinos: `muted` sobre `raised`, revisar que pase 4.5:1.
- Textos nuevos en `src/i18n/<lang>.ts` para los cinco idiomas (`noHardcoded.test.ts` tiene que pasar). Sin exclamaciones (docs/design.md).

## 6. Fuera de alcance

Progreso dentro de los gajos, grilla de puntos, cambiar la pestaña Aperturas del celular, animar las piezas del tablero de progreso al completar una lección (puede ir después, con `MovingPiece`).

## 7. Cómo se comprueba

- `npm test`: pruebas del módulo puro de la sección 1 (Italiana con 0, 1, 2 y 3 lecciones; curso de negras; partida corta con más lecciones que jugadas; unidad completa = final) y validación de todas las partidas.
- `npx expo lint` y `npx tsc --noEmit` sin errores.
- Navegador (`web-dev`): ancho de 1280 px (corona, riel, teclado, aperturas por color) y 375 px (riel vertical). Capturas en el resumen de cada tarea.
- El celular con Expo Go lo prueba el usuario.
