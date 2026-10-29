# Contenido de la app · Ruta de lecciones y repertorio de aperturas

Notación en español: R rey, D dama, T torre, A alfil, C caballo. Todas las líneas deben validarse con un motor y una base de datos antes de convertirlas en lecciones.

---

## Parte 1 · Ruta rápida de lecciones (6 unidades, 41 lecciones)

Inspirada en la progresión de Lichess (piezas, fundamentos, intermedio, avanzado) y en los cuatro niveles de chess.com (nuevo, principiante, intermedio, avanzado). Los títulos son propios.

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
15. Coronar bien (sin ahogar y con caballo; lo básico ya está en «El peón» de la unidad 1)
16. El rey ahogado
17. Otras tablas: repetición y jaque perpetuo, material insuficiente, 50 jugadas
18. Cómo se escriben las jugadas (notación)

### Unidad 3 · Táctica básica (8 lecciones, ya escritas en `src/data/unidad-3-tactica-basica.json`)
19. La horquilla
20. La clavada
21. El ataque a la descubierta
22. Jaque doble y ataque doble
23. Eliminar al defensor
24. La desviación
25. Mate del pasillo y mate del pastor (y cómo defenderse)
26. Antes de mover: jaques, capturas y amenazas

«Valor de las piezas» se quitó: ya está en «Intercambios» (Unidad 1). «Piezas colgadas» pasó a ser «Antes de mover», porque lo básico ya está en «Proteger piezas». Cada lección termina con puzzles reales de Lichess del mismo tema.

### Unidad 4 · Apertura y estrategia (6 lecciones, ya escritas en `src/data/unidad-4-apertura-y-estrategia.json`)
28. Principios de apertura: centro, desarrollo, enroque
29. Errores típicos de apertura (dama temprana, mover la misma pieza dos veces)
30. Estructura de peones: aislado, doblado, pasado
31. Columnas abiertas y torres activas
32. Casillas débiles y puestos avanzados para caballos
33. La pareja de alfiles

### Unidad 5 · Finales (5 lecciones)
34. Mate con dama y rey contra rey
35. Mate con torre y rey contra rey
36. Oposición entre reyes
37. Regla del cuadrado y peón pasado
38. Posición de Lucena (torre y peón)

### Unidad 6 · Conceptos avanzados (3 lecciones)
39. Zugzwang: cuando mover es perder
40. Profilaxis: anticipar el plan del rival
41. Sacrificio posicional y calidad (torre por pieza menor)

### Formato de cada lección
1. Explicación corta con tablero interactivo (máx. 3 pantallas).
2. 3 a 5 ejercicios guiados.
3. Drill final de repaso (se repite según errores).

### Estructura de datos
El formato definitivo de los pasos está en `formato-lecciones.md` y `src/data/lessonTypes.ts` (tipos `explain`, `move`, `select_squares`, `quiz` y `line`). Las soluciones se escriben como origen+destino (`f3e5`), no en notación.

---

## Parte 2 · Repertorio de aperturas

**Estado actual:** el repertorio que se usa es el de `aperturas-v3.json`: 28 cursos (16 con blancas y 12 con negras), con la lista completa en `formato-lecciones.md`. Las tablas de abajo son el plan original de 10 + 10. De ese plan, el **Gambito Budapest** quedó fuera de v3. Se sumaron Vienesa, Dragón, Ataque Indio de Rey, Moderna, Pirc, Blackmar-Diemer, Rossolimo, Alapin y Gambito de dama aceptado.

Cada apertura se divide en 4 lecciones: idea principal, línea principal, trampas y errores típicos, drill. Orden sugerido: de menor a mayor dificultad.

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
- ~~Definir cuántas lecciones de apertura se desbloquean al inicio y cuáles después.~~ Decidido en el hito 3: los 28 cursos están abiertos y, dentro de cada curso, las 4 lecciones se desbloquean de a una.
