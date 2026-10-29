# Formato de lecciones

Archivo de datos: `unidad-1-lo-basico.json`. Tipos TypeScript: `lessonTypes.ts`.
Cada lección tiene pasos; hay 6 tipos de paso. Todos llevan `fen` (la posición) y pueden llevar `orientation` y `highlight`.

## Tipos de paso

| Tipo | Qué ve el usuario | Qué hace | Cuándo se da por correcto |
|---|---|---|---|
| `explain` | Texto + tablero | Toca "Continuar" | Siempre |
| `move` | Pregunta + tablero | Juega una pieza | La jugada (`e2e4`) está en `solutions` |
| `select_squares` | Pregunta + tablero | Toca casillas | Tocó todas las de `squares` |
| `quiz` | Pregunta + opciones | Elige una opción | Índice elegido = `answer` |
| `line` | Tablero + línea de jugadas | Juega las jugadas de su color | Completó la línea |
| `practice` | Tablero contra Stockfish | Juega libre | Cumplió el objetivo (`goal`) sin dejar escapar el resultado |

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
| `success` (opcional) | Mensaje del panel verde al terminar. Si falta, "Completaste la línea" |
| `hint` (opcional) | Mensaje del panel rojo tras un error. Si falta, el de las aperturas |

`line` también sirve para **combinaciones tácticas** y **puzzles** (desde la Unidad 3): el `fen` puede ser cualquier posición, juegue quien juegue, y la numeración de jugadas sigue el `fen` ("23… Cxe5"). Si en el `fen` mueve el rival (puzzles de Lichess, cuya primera jugada es la del rival), la app la juega sola. Para tácticas se usa `mode: 'drill'` con `success` y `hint` propios.

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

## Contenido de la Unidad 3 · Táctica básica

`src/data/unidad-3-tactica-basica.json`: 8 lecciones, 75 pasos. Sin «El valor de las piezas» (ya está en «Intercambios», Unidad 1) y con «Antes de mover» en lugar de «Piezas colgadas» (lo básico está en «Proteger piezas»).

- **Combinaciones:** pasos `line` en modo `drill` con `success` y `hint` propios.
- **Puzzles reales de Lichess (CC0):** cada lección termina con 2, y «La horquilla», «La descubierta» y «La desviación» tienen uno más en el medio (0TCrY, MZ2x1, dvqbx), en lugar de posiciones propias que no funcionaban. El enunciado muestra el número del puzzle.
- **Validación con chess.js:** cada posición y jugada, y lo que dicen los textos (clavadas, mates, piezas sueltas, defensores).
- **Revisión con Stockfish (profundidad 16, todas las jugadas legales):** en cada ejercicio y en cada jugada propia de las combinaciones, la solución es la mejor jugada, o todas las jugadas buenas se aceptan. En los que tienen consigna («da jaque con la dama», «ataca con un peón»), la solución está a menos de 1,5 peones de la mejor y las otras buenas no cumplen la consigna.
- **Lo que encontró Stockfish y se corrigió:**
  - Una horquilla de dama en la misma fila que la torre (la torre la capturaba).
  - Mates en la última fila que no se veían: se agregó h3 o se protegió la torre.
  - Una horquilla de peón que la torre rival anulaba clavando el peón contra el rey.
  - Un «eliminar al defensor» donde la torre escapaba. Ahora la captura es con jaque.
  - Posiciones con tanta ventaja que cualquier jugada ganaba. Se emparejó el material.

| # | id | Lección | Pasos |
|---|---|---|---|
| 1 | u3-l01 | La horquilla | 10 |
| 2 | u3-l02 | La clavada | 10 |
| 3 | u3-l03 | El ataque a la descubierta | 9 |
| 4 | u3-l04 | Jaque doble y ataque doble | 9 |
| 5 | u3-l05 | Eliminar al defensor | 9 |
| 6 | u3-l06 | La desviación | 9 |
| 7 | u3-l07 | Mate del pasillo y mate del pastor | 10 |
| 8 | u3-l08 | Antes de mover: jaques, capturas y amenazas | 9 |

## Contenido de la Unidad 4 · Apertura y estrategia

`src/data/unidad-4-apertura-y-estrategia.json`: 6 lecciones, 47 pasos. En estrategia casi nunca hay una sola jugada correcta: hay más preguntas y casillas para tocar, y los ejercicios de jugada aceptan todas las que cumplen la idea.

- **Posiciones de apertura reales:** se arman jugando desde el inicio (Italiana, Escandinava, Siciliana con ...e5, Stonewall).
- **Validación con chess.js:** cada posición y jugada, y lo que nombran los textos. Peón aislado, peones doblados, único peón pasado, única columna abierta, casillas débiles (que ningún peón rival las pueda atacar nunca), clavada del alfil de e7, quién tiene la pareja de alfiles.
- **Revisión con Stockfish** (profundidad 16, todas las jugadas legales, margen de medio peón):
  - Las soluciones son la mejor jugada o están cerca de ella.
  - En las preguntas «¿cuál es mejor?» (Cf3, Cc3, Cg1), la respuesta correcta es la mejor de las opciones. Dg4 en la Escandinava, además, pierde la dama.
- **Lo que encontró Stockfish y se corrigió:**
  - A las blancas les faltaba el caballo de f3 en la posición del rey en el centro.
  - La carrera de peones era tablas con el rey negro en f5. Con el rey en g5 solo gana c6.
- **Puzzles de Lichess:** 2 de peón pasado al final de «Estructura de peones» (naoae, eh3NH).

| # | id | Lección | Pasos |
|---|---|---|---|
| 1 | u4-l01 | Principios de apertura | 8 |
| 2 | u4-l02 | Errores típicos de apertura | 8 |
| 3 | u4-l03 | Estructura de peones | 10 |
| 4 | u4-l04 | Columnas abiertas y torres activas | 7 |
| 5 | u4-l05 | Casillas débiles y puestos avanzados | 7 |
| 6 | u4-l06 | La pareja de alfiles | 7 |

## Paso `practice` (práctica contra Stockfish)

`src/lesson/steps/PracticeStep.tsx`. Se usa en los finales, donde hay muchas jugadas buenas y una línea fija marcaría como error jugadas que también ganan.

- Campos: `side` (con qué color juega el usuario), `goal` (`mate`, `promote` o `draw`), `maxMoves`, `success` y `hint`.
- El paso monta su propio Stockfish (`EngineView`) y muestra «Preparando a Stockfish…» mientras carga.
- Después de cada jugada, Stockfish evalúa la posición a profundidad 14 y, con esa misma búsqueda, elige su respuesta. Juega con toda su fuerza.
- **Cuándo es error:**
  - En `mate` y `promote`, si la evaluación para el usuario baja de +3 (`WIN_CP`).
  - En `draw`, si baja de −3 (`LOSING_CP`).
  - El ahogado y las demás tablas las detecta chess.js antes de preguntarle al motor.
  - La jugada equivocada queda a la vista y «Reintentar» la deshace.
- **Cuándo se cumple el objetivo:**
  - `mate`: al dar mate.
  - `promote`: al coronar sin perder la pieza nueva.
  - `draw`: al aguantar `maxMoves` jugadas, o antes si la partida termina en tablas.
- Si en `mate` o `promote` se terminan las `maxMoves` jugadas, «Reintentar» vuelve a la posición inicial. También hay un botón «Empezar de nuevo».
- Medido con Stockfish: un final de rey y peón ganado da cerca de +5,7, uno en tablas cerca de 0, la Lucena +4,9 y rey y torre contra rey +4,7. Los mates dan miles.
- Ojo: Stockfish se cierra si recibe una posición ilegal (por ejemplo, con el bando que no mueve en jaque). Los armadores de unidades rechazan esas posiciones.

## Contenido de la Unidad 5 · Finales

`src/data/unidad-5-finales.json`: 5 lecciones, 39 pasos. Las lecciones de mates, oposición y Lucena terminan con prácticas contra Stockfish.

- **Validación con chess.js:**
  - Los ejercicios de «da mate» aceptan todas las jugadas que dan mate.
  - El de «salto de caballo» acepta todas las jugadas de dama a esas casillas.
  - Lo que dicen los textos: que Dg6 ahoga, que Dg7 es mate, que Dh2+ deja escapar al rey a g8, que la torre de e1 corta al rey, y qué casillas tiene el cuadrado de b5 y si el rey entra en él.
- **Revisión con Stockfish:**
  - Las jugadas únicas (oposición, Re4, a5, b6, c6, a6) son la única jugada que gana.
  - Las jugadas de espera con la torre dan el mate más rápido.
  - Tf1+ está entre las buenas. En la Lucena hay muchas jugadas que ganan, por eso la línea es guiada.
  - Lo que afirman las preguntas: victoria con e3, si el rey alcanza o no al peón, la Lucena ganada y la defensa en tablas.
- **Posiciones de rey y peón:** las encontró un programa que recorrió muchas posiciones y se quedó con las que tienen una sola jugada que gana o que salva.
- **Simulación de las prácticas:** Stockfish jugó por los dos lados con la misma lógica que la app.
  - Ninguna jugada buena se marcó como error, y todas cumplen el objetivo dentro de `maxMoves`.
  - Jugadas usadas: dama 8 de 20, torre 13 de 35, rey y peón 16 de 25, defensa 10 de 10 y Lucena 11 de 20.
- **Puzzles de Lichess:** 2 carreras de peones al final de «La regla del cuadrado» (xW6Ug, VEzBQ).

| # | id | Lección | Pasos |
|---|---|---|---|
| 1 | u5-l01 | Mate con dama | 8 |
| 2 | u5-l02 | Mate con torre | 8 |
| 3 | u5-l03 | La oposición | 8 |
| 4 | u5-l04 | La regla del cuadrado | 8 |
| 5 | u5-l05 | La posición de Lucena | 7 |

## Pendiente
- Revisión de redacción (los textos son una primera versión).
