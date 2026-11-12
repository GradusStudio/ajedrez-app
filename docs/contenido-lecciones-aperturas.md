# Contenido de la app · Ruta de lecciones y repertorio de aperturas

Notación en español: R rey, D dama, T torre, A alfil, C caballo. Todas las líneas deben validarse con un motor y una base de datos antes de convertirlas en lecciones.

---

## Parte 1 · Ruta rápida de lecciones (9 unidades, 75 lecciones, todas escritas)

Inspirada en la progresión de Lichess (piezas, fundamentos, intermedio, avanzado) y en los cuatro niveles de chess.com (nuevo, principiante, intermedio, avanzado). Los títulos son propios. La vieja Unidad 6 · Conceptos avanzados se disolvió el 11-11-2026: sus lecciones pasaron a Finales, Táctica intermedia y Ataque y defensa. Además, «Piezas sueltas» pasó a Táctica básica y «Convertir una ventaja» a Finales intermedios.

### Unidad 1 · Lo básico (12 lecciones, ya escritas en `unidad-1-lo-basico.json`)
1. El tablero y las coordenadas
2. La torre
3. El alfil
4. La dama
5. El rey
6. El caballo
7. El peón
8. Proteger piezas
9. Intercambios: cuándo conviene capturar
10. El jaque
11. Salir del jaque
12. Jaque mate en una jugada

«Capturar piezas» se quitó en la versión 2 del hito 1.

### Unidad 2 · Reglas especiales (6 lecciones, ya escritas en `src/data/unidad-2-reglas-especiales.json`)
13. El enroque
14. La captura al paso
15. El rey ahogado
16. Otras tablas: repetición y jaque perpetuo, material insuficiente, 50 jugadas
17. Coronar bien (sin ahogar y con caballo; lo básico ya está en «El peón» de la unidad 1)
18. Cómo se escriben las jugadas (notación)

### Unidad 3 · Táctica básica (10 lecciones, ya escritas en `src/data/unidad-3-tactica-basica.json`)
1. La horquilla
2. La clavada
3. La enfilada (agregada el 9-11-2026, id `u3-l09`)
4. El ataque a la descubierta
5. Jaque doble y ataque doble
6. Eliminar al defensor
7. La desviación
8. Mate del pasillo y mate del pastor (y cómo defenderse)
9. Piezas sueltas (movida de la Unidad 9 el 11-11-2026, id `u9-l01`)
10. Antes de mover: jaques, capturas y amenazas

«Valor de las piezas» se quitó: ya está en «Intercambios» (Unidad 1). Lo de piezas sin defensa se reparte entre «Proteger piezas» (Unidad 1) y «Piezas sueltas» (esta unidad); «Antes de mover» es la rutina final. Cada lección termina con puzzles reales de Lichess del mismo tema.

### Unidad 4 · Apertura y estrategia (7 lecciones, ya escritas en `src/data/unidad-4-apertura-y-estrategia.json`)
1. Principios de apertura: centro, desarrollo, enroque
2. Errores típicos de apertura (dama temprana, mover la misma pieza dos veces)
3. Trampas que vas a ver (agregada el 9-11-2026, id `u4-l07`): Blackburne-Shilling y gambito Englund
4. Estructura de peones: aislado, doblado, pasado
5. Columnas abiertas y torres activas
6. Casillas débiles y puestos avanzados para caballos
7. La pareja de alfiles

### Unidad 5 · Finales (7 lecciones, ya escritas en `src/data/unidad-5-finales.json`)
1. Mate en escalera (agregada el 9-11-2026, id `u5-l06`, va primera de la unidad)
2. Mate con dama y rey contra rey
3. Mate con torre y rey contra rey
4. Oposición entre reyes
5. Zugzwang: cuando mover es perder (incluye triangulación; movida de la vieja Unidad 6 el 11-11-2026, id `u6-l01`)
6. Regla del cuadrado y peón pasado
7. Posición de Lucena (torre y peón)

### Unidad 6 · Táctica intermedia (9 lecciones, escritas el 9-11-2026 en `src/data/unidad-6-tactica-intermedia.json`)
1. La atracción
2. La sobrecarga
3. La jugada intermedia
4. La interferencia
5. Mates de una sola pieza
6. Mates de dos piezas
7. Sacrificio de calidad (torre por pieza menor; movido de la vieja Unidad 6 el 11-11-2026, id `u6-l03`)
8. Sacrificar para abrir al rey
9. Calcular: mate en dos y en tres

Cada una usa posiciones de puzzles reales de Lichess y termina con puzzles propios del tema. La vieja Unidad 6 · Conceptos avanzados se disolvió: Zugzwang pasó a la Unidad 5, Sacrificio de calidad a esta unidad y Profilaxis a la Unidad 9. Propuesta completa en `docs/superpowers/specs/2026-11-09-temario-nuevo-design.md`.

### Unidad 7 · Finales intermedios (9 lecciones, completadas el 11-11-2026 en `src/data/unidad-7-finales-intermedios.json`)
El rey activo, El peón pasado alejado, Dama contra peón, La posición de Philidor, Cortar al rey con la torre, Alfiles de distinto color, Alfil contra caballo, Las dos debilidades y Convertir una ventaja (movida de la Unidad 10 el 11-11-2026, id `u10-l06`). Los puzzles de Lichess son de finales de peones; las demás posiciones se verificaron con Stockfish.

### Unidad 8 · Piezas y peones (7 lecciones, completadas el 11-11-2026 en `src/data/unidad-8-piezas-y-peones.json`)
Cuándo cambiar piezas, El espacio, Posiciones abiertas y cerradas, Alfil bueno y alfil malo, Peón retrasado y cadenas de peones, Torres activas y Rupturas y mayorías de peones. Piezas sueltas pasó a la Unidad 3 el 11-11-2026. Las respuestas de cada pregunta (peones bloqueados, casillas de espacio, piezas sin defensa, peones retrasados) se calculan con chess.js.

### Unidad 9 · Ataque y defensa (8 lecciones, completadas el 11-11-2026 en `src/data/unidad-9-ataque-y-defensa.json`)
El rey sin enrocar, Atacar con enroques del mismo lado, Enroques opuestos, Defender al rey (interponer una pieza protegida), Profilaxis (movida de la vieja Unidad 6 el 11-11-2026, id `u6-l02`), Defenderse con material de menos, Hacer un plan y el Repaso final con 16 puzzles de toda la ruta (`u6-l04`). Convertir una ventaja pasó a la Unidad 7.

La ruta va de la 1 a la 75. La numeración de cada unidad en esta lista es la de la app; `order` es global y consecutivo (Unidad 1: 1-12; Unidad 2: 13-18; Unidad 3: 19-28; Unidad 4: 29-35; Unidad 5: 36-42; Unidad 6: 43-51; Unidad 7: 52-60; Unidad 8: 61-67; Unidad 9: 68-75). Los ids de lección no se renumeran al mover o insertar una lección (el progreso guardado usa el id).

### Formato de cada lección
1. Explicación corta con tablero interactivo (máx. 3 pantallas).
2. 3 a 5 ejercicios guiados.
3. Drill final de repaso (se repite según errores).

### Estructura de datos
El formato definitivo de los pasos está en `formato-lecciones.md` y `src/data/lessonTypes.ts` (tipos `explain`, `move`, `select_squares`, `quiz`, `line` y `practice`). Las soluciones se escriben como origen+destino (`f3e5`), no en notación.

---

## Parte 2 · Repertorio de aperturas

**Estado actual:** el repertorio que se usa es el de `aperturas-v3.json`: 29 cursos (16 con blancas y 13 con negras, con la Defensa Holandesa agregada el 11-11-2026), con la lista completa en `formato-lecciones.md`. Las tablas de abajo son el plan original de 10 + 10. De ese plan, el **Gambito Budapest** quedó fuera de v3. Se sumaron Vienesa, Dragón, Ataque Indio de Rey, Moderna, Pirc, Blackmar-Diemer, Rossolimo, Alapin y Gambito de dama aceptado.

Cada apertura se divide en: idea principal, línea principal, una guía por cada línea o variante (desde el 1-11-2026 reemplazan a «trampas y errores típicos») y el drill de repaso al final. Orden sugerido: de menor a mayor dificultad.

### Con blancas
| # | Apertura | Primeras jugadas | Tipo | Idea principal | Bot sugerido |
|---|---|---|---|---|---|
| 1 | Sistema Londres | 1.d4 d5 2.Af4 | Sólida | Desarrollo simple y fácil de recordar | Tranquilo |
| 2 | Italiana | 1.e4 e5 2.Cf3 Cc6 3.Ac4 | Clásica | Desarrollo rápido y presión sobre f7 | Equilibrado |
| 3 | Escocesa | 1.e4 e5 2.Cf3 Cc6 3.d4 | Clásica | Abrir el centro pronto | Equilibrado |
| 4 | Gambito Danés | 1.e4 e5 2.d4 exd4 3.c3 | Gambito | Peones por desarrollo y ataque | Agresivo |
| 5 | Gambito de rey | 1.e4 e5 2.f4 | Gambito | Ataque directo por la columna f | Agresivo |
| 6 | Gambito Evans | 1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 | Gambito | Peón por centro y tiempo | Agresivo |
| 7 | Española (Ruy López) | 1.e4 e5 2.Cf3 Cc6 3.Ab5 | Clásica | Presión sobre el caballo defensor del centro | Posicional |
| 8 | Gambito de dama | 1.d4 d5 2.c4 | Gambito | Ofrecer un peón para dominar el centro | Posicional |
| 9 | Inglesa | 1.c4 | Flexible | Control de casillas centrales desde el flanco | Posicional |
| 10 | Catalana | 1.d4 Cf6 2.c4 e6 3.g3 | Posicional | Alfil en g2 y presión a larga distancia | Posicional |

### Con negras
| # | Apertura | Primeras jugadas | Tipo | Idea principal | Bot sugerido |
|---|---|---|---|---|---|
| 1 | Defensa Escandinava | 1.e4 d5 | Directa | Cuestionar el peón de e4 de inmediato | Tranquilo |
| 2 | Caro-Kann | 1.e4 c6 | Sólida | Estructura firme y alfil libre | Tranquilo |
| 3 | Defensa Francesa | 1.e4 e6 | Sólida | Contraataque contra el centro blanco | Equilibrado |
| 4 | Defensa Petrov | 1.e4 e5 2.Cf3 Cf6 | Simétrica | Igualar y contraatacar | Equilibrado |
| 5 | Gambito de dama declinado | 1.d4 d5 2.c4 e6 | Clásica | Mantener el centro con solidez | Equilibrado |
| 6 | India de rey | 1.d4 Cf6 2.c4 g6 | Hipermoderna | Dejar el centro y atacar después | Agresivo |
| 7 | Nimzoindia | 1.d4 Cf6 2.c4 e6 3.Cc3 Ab4 | Hipermoderna | Clavar el caballo y controlar e4 | Posicional |
| 8 | Siciliana | 1.e4 c5 | Dinámica | Asimetría y lucha por la victoria con negras | Agresivo |
| 9 | Gambito Albin | 1.d4 d5 2.c4 e5 | Gambito | Peón por iniciativa y trampas | Agresivo |
| 10 | Gambito Budapest | 1.d4 Cf6 2.c4 e5 | Gambito | Presión temprana sobre el centro | Agresivo |

### Cómo se conecta con los bots
El reparto definitivo de aperturas por bot está en `bots.json` y `bots.md`. La idea original era esta, por estilo:
- Tranquilo: Londres, Escandinava, Caro-Kann.
- Equilibrado: Italiana, Escocesa, Francesa, Petrov.
- Posicional: Española, Gambito de dama, Inglesa, Catalana, Nimzoindia.
- Agresivo: Danés, Gambito de rey, Evans, India de rey, Siciliana, Albin, Budapest.

Los bots deben jugar las aperturas que el usuario ya aprendió, para que cada partida sirva como práctica de lo estudiado.

---

## Pendiente
- Validar cada línea con Stockfish y una base de datos de partidas.
- Decidir variantes concretas por apertura (por ejemplo, qué línea de la Siciliana).
- Escribir los textos de cada lección siguiendo la voz definida en design.md.
- ~~Definir cuántas lecciones de apertura se desbloquean al inicio y cuáles después.~~ Decidido en el hito 3: los 28 cursos están abiertos y, dentro de cada curso, las lecciones se desbloquean de a una.
