# Formato de lecciones

Archivo de datos: `unidad-1-lo-basico.json`. Tipos TypeScript: `lessonTypes.ts`.
Cada lección tiene pasos; hay 6 tipos de paso. Todos llevan `fen` (la posición) y pueden llevar `orientation` y `highlight`.

## Archivos de traducción

La unidad en español (`src/data/unidad-N-*.json`, `aperturas-v3.json`) es la fuente. Cada idioma tiene `src/data/i18n/<lang>/unidad-1..6.json`, `aperturas.json`, `bots.json` e `index.ts`. Un archivo de traducción repite los ids de lecciones y pasos y solo lleva los campos de texto: títulos, `text`, `prompt`, `options`, `success`, `hint`, `explanations`, notas y frases de los bots. Nunca cambia `fen`, `solutions`, `squares`, `answer` ni las jugadas. Las listas (opciones, explicaciones) tienen el mismo largo que en español. `npm test` corre `findProblems` por idioma: ids, textos vacíos, marcadores, largos de lista, jugadas nombradas, letras de pieza y ausencia de `!`.

Si se corrige un texto en español, hay que corregirlo también en los cuatro idiomas. Las líneas de apertura corregidas también van en los archivos de traducción. `aperturas` en español tiene dos copias (`src/data/` y `docs/`).

Glosarios por idioma en `docs/traducciones/<lang>.md`. Las traducciones se hicieron con IA y no las revisaron hablantes nativos; los testers de la prueba cerrada avisan los errores.

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
- Al terminar la lección por primera vez, se suman `xp` monedas (15 por lección; el campo conserva el nombre de cuando era XP). Repetirla no suma monedas.

## Paso `line` (aperturas)

Archivos: `aperturas-v1.json` (4 cursos, ya no se usa) y `aperturas-v3.json` (28 cursos). La app usa la copia en `src/data/aperturas-v3.json`; si se corrige una línea, hay que cambiarla allí (y en `docs/` para que coincidan). Cada apertura es un curso con idea (`l01`), línea principal (`l02`), una guía por línea (`l05` en adelante) y repaso (`l04`, al final). Ver «Guías por línea» más abajo.

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

### Guías por línea (1-11-2026)
- **Qué cambió:** se quitó la lección «Claves y errores» (`l03`), porque repetía el Repaso, y se añadió una guía por cada línea o variante que menciona el archivo fuente de cada apertura. Son 286 guías en las 28 aperturas, de 5 a 18 por apertura. Cada guía es una lección con una explicación, una línea `guided` completa desde la posición inicial, al menos un quiz y a veces un paso `move`. El Repaso (`l04`) conserva sus pasos y suma al final de 2 a 4 (drills de las guías más importantes y quizzes).
- **Ids y orden:** `l03` desaparece y las guías empiezan en `l05`, para no perder el progreso guardado (es por id). `order` sí es consecutivo y el Repaso queda último. El progreso de `l03` ya guardado se ignora.
- **Gambito Blackmar-Diemer:** incluye ahora el Gambito Ryder (4 guías, además de 6 del BDG) y su `summary` lo menciona.
- **Ataque Indio de Rey:** no tenía archivo fuente en `C:\dev\aperturas`. Se redactó `ataque indio de rey.md` (sin transcripción de video, escrito por el modelo y sin contrastar con una base de partidas) y de ahí salieron 5 guías. Hay que revisarlas antes de publicar.
- **Fuentes y límites:** las fuentes son transcripciones automáticas de video, muchas con jugadas mal dictadas. Los textos de las guías no atribuyen consejos a ningún presentador. Donde la fuente no daba una jugada, el modelo completó con una jugada natural o teoría estándar. `docs/informe-lineas-aperturas.md` lista cada línea de cada fuente con su guía o el motivo del descarte.
- **Revisión con Stockfish:** 6.070 posiciones (primera línea `guided` de cada guía) a profundidad 12; las dudosas se confirmaron a 18. Se marcaron 6 guías. Eliminadas: `london-l07` (la «trampa» 7.Cxf7 pierde material; la mejor jugada era Cd2, +0,56) e `italian-l13` (caña de pescar: tras 8.hxg5 las negras tienen ventaja, +1,3). Recortadas: `caro-kann-l13` a 18 jugadas (ahí 10.Ae3 permite 10...Dxb2, +4,6), `kings-gambit-l14` a 21 (12.Cc3 desaprovechaba 12.Dxh4) y `modern-l11` a 16 (la evaluación se tuerce desde ...a5). Se deja `catalan-l11`: Aa5 es la idea de la guía y queda en +0,2, aunque el motor prefiere Cg5.
- **Bots:** `src/bots/book.ts` toma todas las líneas `line` desde la posición inicial, así que las guías nuevas amplían el repertorio de los bots.
- **Un error del español que encontró el validador de traducciones:** `Rxd8` (rey toma) donde la torre negra recaptura (`Txd8`), en `queens-gambit-declined-l10-s04`. Corregido en los cinco idiomas.

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

`src/data/unidad-3-tactica-basica.json`: 9 lecciones, 84 pasos. Sin «El valor de las piezas» (ya está en «Intercambios», Unidad 1) y con «Antes de mover» en lugar de «Piezas colgadas» (lo básico está en «Proteger piezas»).

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
| 9 | u3-l09 | La enfilada (va después de «La clavada») | 9 |

## Contenido de la Unidad 4 · Apertura y estrategia

`src/data/unidad-4-apertura-y-estrategia.json`: 7 lecciones, 55 pasos. En estrategia casi nunca hay una sola jugada correcta: hay más preguntas y casillas para tocar, y los ejercicios de jugada aceptan todas las que cumplen la idea.

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
| 7 | u4-l07 | Trampas que vas a ver (va después de «Errores típicos de apertura») | 8 |

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

`src/data/unidad-5-finales.json`: 6 lecciones, 47 pasos. Las lecciones de mates, oposición y Lucena terminan con prácticas contra Stockfish.

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
| 6 | u5-l06 | Mate en escalera (va primera de la unidad) | 8 |

## Contenido de la Unidad 6 · Conceptos avanzados

`src/data/unidad-6-conceptos-avanzados.json`: 4 lecciones, 40 pasos (órdenes 41 a 44). Cierra la ruta de Aprender con un repaso final de puzzles de todos los temas.

- **Validación con chess.js:**
  - Mate por zugzwang (Tg6): es el único mate en 2, no da jaque, la única respuesta negra es Ra8, Ta6 es el único mate y, si las negras pudieran pasar, no habría mate.
  - Trébuchet: con cualquier turno, solo se mueve el rey y cualquier jugada abandona su peón.
  - Triangulación: después de Re4, Rc5, Rd3, Rb6 y Rd4 se repite la posición con el turno de las negras.
  - Profilaxis: si las blancas pasan, Ag4 es posible y h3 controla g4. En el pasillo, Txb7 permite Te1 mate y, tras cada jugada aceptada, no hay mate en una. En h2, la amenaza es Dxh2 mate y g3 y h3 la impiden.
  - Los puzzles no se repiten entre sí ni con las unidades 1 a 5, y ninguno tiene otro mate posible en la última jugada.
- **Revisión con Stockfish (profundidad 16 a 24):**
  - Triangulación (posición hallada con un programa de búsqueda): con blancas solo ganan Re4, Re3 y Rd3; Rc3 y c5 dejan tablas. Con el turno de las negras, todas pierden.
  - h3 en la Italiana es la mejor jugada (+0,31). En el pasillo se aceptan las 7 jugadas que abren salida al rey o lo acercan (de +0,28 a +0,57) y Tc1 (−0,08). En h2 se aceptan g3 y h3; f4 queda en −1,53.
  - Lo que afirman los textos: el trébuchet lo pierde el que mueve, la triangulación gana y la Italiana tras h3 está equilibrada.
- **Simulación de la práctica:** triangulación, 13 de 25 jugadas, sin jugadas buenas marcadas como error.
- **Puzzles de Lichess:** zugzwang (dxvDC, FoRGt, 1Bee7), sacrificio de calidad (SjHwN, EkrEH, LTQbv, p4P0n) y repaso final (8PHlY, Z2PVU, to19k, 1gxnS, 9XWAR, d49wh, Kv9DA, 7CgP1). Los de calidad se eligieron con un programa: la primera jugada es una torre que captura un alfil o un caballo y el rival la recaptura.
- La lección de profilaxis no tiene puzzles de Lichess: los de los temas «jugada defensiva» y «jugada tranquila» casi siempre responden a un jaque o son finales de peones, y no muestran la idea de anticipar el plan rival.

| # | id | Lección | Pasos |
|---|---|---|---|
| 1 | u6-l01 | Zugzwang | 11 |
| 2 | u6-l02 | Profilaxis | 10 |
| 3 | u6-l03 | Sacrificio de calidad | 9 |
| 4 | u6-l04 | Repaso final | 10 |

## Contenido de la Unidad 7 · Táctica intermedia (bloque B del temario nuevo)

`src/data/unidad-7-tactica-intermedia.json`: 8 lecciones, 73 pasos (órdenes 45 a 52), escritas el 9-11-2026. Textos propios; las posiciones salen de puzzles reales de Lichess (CC0) de `lichess-puzzles.json`.

| # | id | Lección | Pasos | Profesor |
|---|---|---|---|---|
| 1 | u7-l01 | La atracción | 9 | Tomás |
| 2 | u7-l02 | La sobrecarga | 9 | Sofía |
| 3 | u7-l03 | La jugada intermedia | 9 | Tomás |
| 4 | u7-l04 | La interferencia | 9 | Sofía |
| 5 | u7-l05 | Mates de una sola pieza | 9 | Pipo |
| 6 | u7-l06 | Mates de dos piezas | 9 | Valentina |
| 7 | u7-l07 | Sacrificar para abrir al rey | 9 | Valentina |
| 8 | u7-l08 | Calcular: mate en dos y en tres | 10 | Sofía |

- **Estructura de cada lección:** dos explicaciones con las jugadas reproducidas sobre el tablero, un cuestionario, un paso de tocar casillas, dos ejercicios de una jugada y dos o tres puzzles con la línea completa (`line` en modo `drill`). Los profesores siguen la ficha de cada bot.
- **Cómo se eligieron los puzzles:** por tema de Lichess (atracción, jugada intermedia, interferencia, mate ahogado, mates con dos piezas, mate en dos y en tres) y rating de 500 a 1100. La sobrecarga no es un tema de Lichess: se buscaron puzzles cuya recapturadora era la única defensora de otra pieza (script con chess.js), para no mezclarla con «Eliminar al defensor» (Unidad 3).
- **Validación con chess.js:** cada posición, jugada reproducida y línea; el bando del usuario; que las explicaciones de mate terminen en mate; las respuestas legales que dicen los textos («el rey solo tiene una salida», «el rey tiene que ir a e1»).
- **Revisión con Stockfish 19 (lite, profundidad 14, todas las jugadas legales):** en cada ejercicio de una jugada, la del puzzle es la mejor, y se aceptan todas las que mantienen la evaluación (a 0,3 peones) o el mismo mate. En los ejercicios hay entre una y cuatro soluciones.
- **Cuestionarios con respuesta calculada:** en la lección 8 las respuestas («2 respuestas legales», «1 jugada del rey») salen de chess.js, no de memoria.
- **Traducciones:** inglés escrito a mano; alemán, italiano y francés con gemma4 vía Ollama (las frases de «Correcto. …» salen de plantillas con la notación de cada idioma) y revisadas a mano. Sin revisión de nativos. Términos nuevos en los glosarios de `docs/traducciones/`.

## Contenido de la Unidad 8 · Finales intermedios (bloque C del temario nuevo)

`src/data/unidad-8-finales-intermedios.json`: 6 lecciones, 41 pasos (órdenes 53 a 58), escritas el 9-11-2026. Todas las enseña Maestro Ivo.

| # | id | Lección | Pasos |
|---|---|---|---|
| 1 | u8-l01 | El rey activo | 9 |
| 2 | u8-l02 | El peón pasado alejado | 9 |
| 3 | u8-l03 | Dama contra peón | 6 |
| 4 | u8-l04 | La posición de Philidor | 5 |
| 5 | u8-l05 | Cortar al rey con la torre | 7 |
| 6 | u8-l06 | Alfiles de distinto color | 5 |

- **Puzzles de Lichess (CC0):** las lecciones 1 y 2 usan finales de peones reales (el rey que gana peones, las carreras de un peón alejado). Cada ejercicio de una jugada tiene una sola solución y un margen claro sobre la segunda mejor (Stockfish, profundidad 14).
- **Posiciones propias, verificadas con Stockfish 19 (profundidad 18 a 24):** dama contra peón central (mate en 10), dama contra peón de torre (0,00), Philidor (−0,27, tablas), torre que corta al rey por columna y por fila (mate en 13 y 11) y alfiles de distinto color con un peón de más (0,00). Las prácticas contra Stockfish se comprobaron contra los umbrales del paso `practice` (ganar: al menos +3; aguantar: más de −3).
- **Lo que no se hizo:** «Alfil contra caballo» y una lección aparte de «Las dos debilidades» (quedó dentro de la lección 2). Los puzzles de Lichess con alfil y caballo son horquillas, no enseñan la idea estratégica, y no se encontró una posición que Stockfish confirmara de forma inequívoca para un ejercicio de una jugada.
- **Traducciones:** inglés escrito a mano; alemán, italiano y francés con gemma4 vía Ollama (las frases «Correcto. …» salen de plantillas con la notación de cada idioma) y revisadas a mano. Sin revisión de nativos.

## Contenido de la Unidad 9 · Piezas y peones (bloque D del temario nuevo)

`src/data/unidad-9-piezas-y-peones.json`: 6 lecciones, 41 pasos (órdenes 59 a 64), escritas el 9-11-2026.

| # | id | Lección | Pasos | Profesor |
|---|---|---|---|---|
| 1 | u9-l01 | Piezas sueltas | 9 | Pipo |
| 2 | u9-l02 | Cuándo cambiar piezas | 6 | Bruno |
| 3 | u9-l03 | El espacio | 6 | Camila |
| 4 | u9-l04 | Posiciones abiertas y cerradas | 7 | Lola |
| 5 | u9-l05 | Alfil bueno y alfil malo | 6 | Ramiro |
| 6 | u9-l06 | Peón retrasado y cadenas de peones | 7 | Camila |

- **Qué se verificó y cómo:** la estrategia no se puede confirmar con un motor, así que las respuestas de las preguntas son hechos que calcula chess.js sobre las posiciones: las piezas sin defensa de un bando, las casillas del campo rival que controla cada bando (espacio), los peones bloqueados frente a un peón rival, los peones propios que están en casillas del color de un alfil, el peón retrasado y la base de una cadena de peones. Cada lección falla al armarse si algún dato no coincide con lo que dice el texto.
- **Posiciones:** salen de las líneas de los cursos de aperturas (Avance de la Francesa, Escocesa, India de Rey, Najdorf y Caro-Kann) y, para la lección 1, de puzzles reales de Lichess (CC0) con Stockfish a profundidad 14 (una sola solución por ejercicio).
- **Principios sin motor:** las preguntas de «qué suele convenir» (cambiar con ventaja de material, evitar cambios con más espacio, caballos en posiciones cerradas) enseñan reglas generales y están redactadas con «suele».
- **Lo que no se hizo:** «Torres activas» (conectar torres, séptima fila, torre levantada) y «Rupturas y mayorías de peones»: Stockfish no confirmó esas ideas con una jugada única en las posiciones de prueba (la torre en la séptima fila ni siquiera era la mejor jugada).
- **Traducciones:** inglés escrito a mano; alemán, italiano y francés con gemma4 vía Ollama y revisadas a mano (las frases «Correcto. …» salen de una plantilla con la notación de cada idioma). Sin revisión de nativos.

## Lecciones agregadas el 9-11-2026 (bloque A del temario nuevo)

Salen de la comparación con los libros de `C:devmaterial para lecciones` (propuesta en `docs/superpowers/specs/2026-11-09-temario-nuevo-design.md`). Textos escritos de cero, sin copiar de los libros. Se insertaron sin renumerar ids; `order` se recalculó para toda la ruta (1 a 44).

- **La enfilada** (`u3-l09`, después de «La clavada»): enfilada de rey y dama con torre, comparación con la clavada, identificar, dos ejercicios (torre contra rey y dama; alfil contra rey y torre), tocar las piezas enfiladas, cómo evitarla y dos puzzles de Lichess (DPWEJ y 43RQr).
- **Trampas que vas a ver** (`u4-l07`, después de «Errores típicos de apertura»): trampa Blackburne-Shilling (3...Cd4) y gambito Englund (la trampa es 6.Ac3, que clava el alfil al rey tras ...Ab4; lo correcto es 6.Cc3). Frente a 3...Cd4 se aceptan todas las jugadas con evaluación de +0,3 o más.
- **Mate en escalera** (`u5-l06`, primera de la Unidad 5): dos torres; pasos de jaque, jaque y mate, una posición con el rey cerca de las torres (todas las jugadas que dan mate en dos) y práctica contra Stockfish.
- **Validación:** cada posición, solución y jugada reproducida con chess.js; la línea de Blackburne-Shilling termina en mate real y la escalera también. Stockfish 19 (lite, profundidad 16 a 18, todas las jugadas legales): las soluciones únicas son claramente mejores que cualquier otra (Th5+ +4,7 contra -3,2; Ag2+ +7,7 contra -0,1; Cc3 +2,3 contra -2,7; Tb6+ mate en 4 contra mate en 5 o más); en los dos puzzles, la jugada del usuario es la mejor.
- **Profesores:** Sofía (enfilada), Tomás (trampas) e Ivo (mate en escalera), según lo que enseña cada uno en su ficha.

## Pendiente
- Revisión de redacción (los textos son una primera versión).
