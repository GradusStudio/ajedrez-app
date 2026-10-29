# Formato de lecciones

Archivo de datos: `unidad-1-lo-basico.json`. Tipos TypeScript: `lessonTypes.ts`.
Cada lección tiene pasos; hay 5 tipos de paso (los 4 de abajo y `line`, más adelante). Todos llevan `fen` (la posición) y pueden llevar `orientation` y `highlight`.

## Tipos de paso

| Tipo | Qué ve el usuario | Qué hace | Cuándo se da por correcto |
|---|---|---|---|
| `explain` | Texto + tablero | Toca "Continuar" | Siempre |
| `move` | Pregunta + tablero | Juega una pieza | La jugada (`e2e4`) está en `solutions` |
| `select_squares` | Pregunta + tablero | Toca casillas | Tocó todas las de `squares` |
| `quiz` | Pregunta + opciones | Elige una opción | Índice elegido = `answer` |

## Comportamiento esperado de la app

- `explain` con `showMovesFrom`: marcar con puntos los destinos legales de esa pieza (el `Board` ya sabe calcularlos con chess.js). Si no hay destinos (peón bloqueado), mostrar el texto igual.
- `move`: tablero interactivo. Si la jugada es legal pero no está en `solutions`, se ve en el tablero y aparece el panel rojo con `hint` y "Reintentar", que la deshace. Si acierta, mostrar `success`.
- Al equivocarse, en todos los pasos aparece el panel rojo con "Reintentar". No se va solo, y el paso no acepta respuestas hasta tocarlo:
  - `quiz`: la opción equivocada queda marcada en rojo.
  - `select_squares`: las casillas elegidas quedan marcadas para corregirlas.
- `quiz`: tras responder, mostrar siempre `explanation` (acierte o no).
- `orientation: 'b'` se usa cuando mueven las negras, para ver las negras abajo.
- Cada error muestra la pista y se reintenta al instante, sin vidas. El paso fallado se guarda y se puede volver a hacer con "Repasar errores" desde el resultado.
- Al terminar la lección por primera vez, se suma `xp` (15 por lección, provisional). Repetirla no suma XP.

## Paso `line` (aperturas)

Archivos: `aperturas-v1.json` (4 cursos, ya no se usa) y `aperturas-v3.json` (28 cursos). La app usa la copia en `src/data/aperturas-v3.json`; si se corrige una línea, hay que cambiarla allí (y en `docs/` para que coincidan). Cada apertura es un curso de 4 lecciones: idea, línea principal, trampas y errores, repaso.

El paso `line` parte de la posición inicial. El usuario juega solo las jugadas de su color (`side`); la app juega las del rival automáticamente después de cada acierto.

| Campo | Significado |
|---|---|
| `mode: 'guided'` | Muestra la nota (`note`) de cada jugada propia después de jugarla y, tras un error, indica la jugada correcta |
| `mode: 'drill'` | Sin notas ni pistas; un error se marca y se reintenta, sin vidas (como en el resto de la app) |
| `moves[].uci` | Jugada para validar, como `e2e4`. El enroque es el movimiento del rey: `e1g1` |
| `moves[].san` | Texto para mostrar, en español: `Cf3`, `Axf7+`, `O-O` |

La captura al paso (por ejemplo `exf6` en la Vienesa) y el enroque funcionan con chess.js sin cambios: el tablero muestra el destino y `chess.move` lo resuelve.

`explain` admite `arrows` (pares como `c4f7`) para dibujar flechas, y `play` (jugadas que se reproducen solas). Las dos funcionan en `Board`.

### Cómo funciona en la app (hito 3, `src/lesson/steps/LineStep.tsx`)
- Juega el usuario cuando el turno del tablero coincide con `side`; el resto de las jugadas las hace la app sola, con una pausa de 0,7 s. En los cursos de negras, la app abre con la primera jugada blanca.
- Orientación: si el paso no trae `orientation`, el tablero se gira según `side`. Los pasos `line` de los cursos de negras no la traen.
- En `guided`, **antes** de cada jugada propia, una tarjeta dice cuál toca y para qué: "Tu jugada: Af4" y la `note` de esa jugada. El tablero marca la casilla de origen y la de destino. Mientras responde el rival, la tarjeta sigue visible ("Jugaste Af4") y solo cambia cuando vuelve a ser tu turno. Por eso **toda jugada del alumno en una línea `guided` debe tener `note`**: hoy las 263 la tienen. Las jugadas del rival no necesitan nota.
- Jugada equivocada (legal pero distinta de la línea): se ve en el tablero, cuenta como error y aparece el panel rojo con "Reintentar". "Reintentar" la deshace y la línea sigue desde la misma posición. Se muestra en una posición aparte, sin tocar la partida de la línea.
  - En `guided`, el panel nombra la jugada correcta y el tablero la marca con una flecha.
  - En `drill`, solo dice que no es la jugada de la línea.
  - Al acertar, el panel rojo desaparece y la línea sigue.
- Debajo del tablero se muestran el turno ("El rival jugó d5 · Tu turno") y las jugadas hechas, numeradas.
- En `drill` no hay tarjeta ni casillas marcadas: se juega de memoria.
- Al terminar la línea aparece el panel verde con "Continuar".
- Las líneas de Escocesa y Gambito de dama (lecciones 2 y 4) terminan con una jugada del rival (18 jugadas): la app la juega sola y después da la línea por completada.
- Todas las líneas de `aperturas-v3.json` se recorrieron con esta lógica: 61 líneas, 533 jugadas del usuario y 500 automáticas, sin problemas.

### Revisión con Stockfish (hito 3)
Las 61 líneas se analizaron con Stockfish 19 a profundidad 20, jugada por jugada.
- **Gambito Danés, corregido:** la línea enseñaba 7.Ab3, que pierde unos 4,5 peones porque permite 7...Dxd1+. Se cambió por la línea principal 7.Axf7+ Rxf7 8.Dxd8 Ab4+ 9.Dd2 Axd2+ 10.Cxd2, que termina pareja (−0,07). También se corrigió la nota de 6.Axd5.
- **Contragambito Albin:** termina en −2,06 para las negras, sin un error puntual: la apertura es dudosa. La variante 5...Cge7 quedaría en −0,66. **Decisión: se deja como está**, como gambito de trampas (lo juega Tomás, "el tramposo", nivel 1000).
- **Gambito de rey (−1,01), Blackmar-Diemer (−0,69) y Escandinava (−0,71):** la desventaja viene de la propia apertura (2.f4 y 2.e4 del Blackmar-Diemer pierden alrededor de 0,8 cada una). Es normal en un gambito y se dejan así.
- **Partida Italiana, lección 3:** los errores del rival (4...g6 y 5...Axd1) son a propósito: es la trampa del mate de Légal.
- Las demás terminan entre −0,6 y +0,4 para el alumno.

### Contenido de aperturas

| Curso | Color | Lecciones |
|---|---|---|
| Sistema Londres | Blancas | 4 |
| Partida Italiana | Blancas | 4 |
| Partida Vienesa | Blancas | 4 |
| Defensa Escandinava | Negras | 4 |
| Siciliana (Najdorf) | Negras | 4 |
| Dragón Siciliano | Negras | 4 |
| Ataque Indio de Rey | Blancas | 4 |
| Defensa India de Rey | Negras | 4 |
| Defensa Moderna | Negras | 4 |
| Defensa Pirc | Negras | 4 |
| Partida Escocesa | Blancas | 4 |
| Gambito Evans | Blancas | 4 |
| Gambito Blackmar-Diemer | Blancas | 4 |
| Defensa Caro-Kann | Negras | 4 |
| Ruy López | Blancas | 4 |
| Variante Rossolimo | Blancas | 4 |
| Variante Alapin | Blancas | 4 |
| Gambito de dama | Blancas | 4 |
| Gambito de rey | Blancas | 4 |

| Contragambito Albin | Negras | 4 |
| Apertura Catalana | Blancas | 4 |
| Apertura Inglesa | Blancas | 4 |
| Gambito Danés | Blancas | 4 |
| Defensa Francesa | Negras | 4 |
| Defensa Nimzoindia | Negras | 4 |
| Defensa Petrov | Negras | 4 |
| Gambito de dama declinado | Negras | 4 |
| Gambito de dama aceptado | Blancas | 4 |

Total: 28 cursos, 112 lecciones, 315 pasos.

Las líneas se comprobaron como jugadas legales y los mates como mates reales. No se evaluó su calidad con un motor: antes de publicarlas conviene revisarlas con Stockfish y una base de partidas.

## Reglas de las posiciones (para crear más lecciones)

- Siempre incluir ambos reyes y que no haya jaque al bando que no mueve.
- En ejercicios de movimiento, el bando que mueve es el del `fen`.
- Coronaciones: el tablero muestra un selector de pieza. Una solución de 4 letras (`e7e8`) acepta cualquier pieza; una de 5 (`e7e8n`) exige esa pieza. En `play` y en las líneas, la quinta letra indica la pieza.
- Textos en español, sentence case, sin signos de exclamación en mensajes del sistema (ver design.md, sección 7).

## Contenido de la Unidad 1

12 lecciones, 77 pasos. Se quitó «Capturar piezas» en la versión 2 del hito 1. «El peón» suma coronación y subpromoción (pasos s08 a s12; la posición de subpromoción se revisó con Stockfish: coronar caballo +7,8, coronar dama recibe mate en 2). Cada posición, solución y jugada reproducida se comprobó con chess.js, y los ids de lección y de paso son únicos.

| # | id | Lección | Pasos |
|---|---|---|---|
| 1 | u1-l01 | El tablero y las coordenadas | 9 |
| 2 | u1-l02 | La torre | 5 |
| 3 | u1-l03 | El alfil | 5 |
| 4 | u1-l04 | La dama | 5 |
| 5 | u1-l05 | El rey | 5 |
| 6 | u1-l06 | El caballo | 5 |
| 7 | u1-l07 | El peón | 12 |
| 8 | u1-l08 | Proteger piezas | 5 |
| 9 | u1-l09 | Intercambios | 7 |
| 10 | u1-l10 | El jaque | 6 |
| 11 | u1-l11 | Salir del jaque | 7 |
| 12 | u1-l12 | Jaque mate en una jugada | 6 |

Los ids no se deben cambiar una vez publicada la app: el progreso guardado y la lista de errores los usan.

## Contenido de la Unidad 2 · Reglas especiales

`src/data/unidad-2-reglas-especiales.json`: 6 lecciones, 46 pasos. Cada posición y jugada se validó con chess.js (también que el bando que no mueve no esté en jaque, y cada mate, ahogado y enroque que mencionan los textos). Las posiciones donde importa la mejor jugada se revisaron con Stockfish:
- Coronar sin ahogar (`8/k1P5/2K5/8/8/8/8/8 w`): c8=T mate en 2; c8=D ahoga.
- Coronar caballo (`8/1k1P1q2/8/8/8/8/6PP/7K w`): d8=C +7,3; dama, torre o alfil reciben Df1#.
- Jaque perpetuo (`6k1/6p1/8/2b5/4Q3/8/rr4PP/7K w`): Dd5+, De6+, Dc4+ y De8+ hacen tablas; lo demás pierde.

| # | id | Lección | Pasos |
|---|---|---|---|
| 1 | u2-l01 | El enroque | 8 |
| 2 | u2-l02 | La captura al paso | 7 |
| 3 | u2-l03 | Coronar bien | 7 |
| 4 | u2-l04 | El rey ahogado | 7 |
| 5 | u2-l05 | Otras tablas | 8 |
| 6 | u2-l06 | Cómo se escriben las jugadas | 9 |

## Pendiente
- Revisión de redacción (los textos son una primera versión).
