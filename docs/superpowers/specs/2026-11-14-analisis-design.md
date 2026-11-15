# Pestaña Análisis nueva

Fecha: 14-11-2026 · Diseño: opus · **Referencia visual:** `prototipo-analisis.html` (raíz del repo, fuera de git; datos de ejemplo).

Hoy la pestaña (`AnalysisMenuScreen`) son dos tarjetas: «Análisis de partida» y «Análisis libre». Para revisar una partida hay que ir a otra pantalla (`ImportGameScreen`), elegir la fuente y escribir el usuario cada vez. Las partidas contra los bots, que ya están guardadas en el progreso, no aparecen ahí: solo se pueden revisar con el botón del final de cada partida.

## Pantalla ancha (columna de 1000 px)

«Análisis» y una línea: «Revisa tus partidas con un comentarista, practica tus errores o explora una posición.» Dos columnas (1,5 fr y 1 fr).

### Izquierda: Revisar una partida
- «REVISAR UNA PARTIDA» y «¿Qué partida quieres revisar?».
- Selector de **fuente**: **Contra los bots** (elegida por defecto si hay partidas), chess.com, Lichess y PGN.
- **Contra los bots:** las últimas partidas de `progress.games` (hasta 10), cada una en una fila con la cara del bot, «vs Camila», cómo terminó, las jugadas y cuándo («Jaque mate · 34 jugadas · ayer»), el resultado en una pastilla (Ganaste en dorado, Perdiste en gris, Tablas en gris claro) y el botón **«Revisar»**. Si esa partida ya se revisó, «Ver revisión» (secundario) abre la revisión guardada sin volver a analizar. Vacío: «Todavía no jugaste contra los bots» y «Ir a Bots».
- **chess.com / Lichess:** campo «Tu usuario en chess.com» con «Buscar», y debajo la lista de partidas recientes como hoy (mismas filas, con el rival en lugar del bot). **El usuario se recuerda** (en los ajustes) para la próxima vez y la búsqueda se hace sola al elegir la fuente.
- **PGN:** el área de texto y «Revisar partida».
- Así desaparece la pantalla intermedia `ImportGameScreen`: todo pasa acá. La ruta `/importar-partida` redirige a `/analisis`.

### Derecha
1. **Aprende de tus errores:** el número en grande (`gold`) de posiciones de tus partidas revisadas donde había una jugada mejor y todavía no las practicaste, y «Practicar mis errores» (abre el quiz de puntos de giro con todas las posiciones pendientes, no solo las de una partida). Se oculta si no hay ninguna.
2. **Análisis libre:** un tablero chico (110 px) con una barra de evaluación al costado, «Tablero libre», «Mueve las piezas y mira la evaluación y las mejores jugadas en vivo.» y «Abrir tablero».
3. **Cómo funciona la revisión:** una nota corta con las calidades de jugada y el comentarista.

## Datos

- **Revisiones guardadas:** hoy cada revisión se calcula y se pierde. Se guardan las últimas 10 en el dispositivo, aparte del progreso (clave propia, por ejemplo `@ajedrez/reviews`, como los ajustes; no se sincronizan porque pesan), con el id de la partida y el resultado del análisis. Sirven para «Ver revisión» y para contar los errores pendientes.
- **Errores pendientes:** las posiciones que `turningPoints.ts` elige de cada revisión guardada (errores y errores graves del usuario) menos las ya resueltas en `progress.turningPoints`.
- Usuario de chess.com y de Lichess: `settings.importUser` (`{ chesscom?: string; lichess?: string }`).

## Celular

Una columna: el título, «Revisar una partida» con el selector en dos filas si no entra (Bots y chess.com / Lichess y PGN), las partidas como lista, y después «Aprende de tus errores» y «Análisis libre».

## Fuera de alcance (siguiente paso)

La pantalla de revisión en sí (`GameReviewScreen`). Hay que verla funcionando antes de rediseñarla: es la más densa de la app (barra de evaluación, tablero, globo del comentarista, controles, lista de jugadas, gráfico y resumen). Ideas para entonces: el comentarista de cuerpo entero como en la lección, el resumen con la precisión en grande y las jugadas destacadas como tarjetas.

## Accesibilidad y textos

- Cada partida es una fila con etiqueta completa («Partida contra Camila, perdiste por jaque mate en 34 jugadas, ayer. Revisar»).
- El selector de fuente es un grupo de pestañas.
- Textos de tú, sin exclamaciones, en los cinco idiomas.

## Cómo se comprueba

- `npm test` (errores pendientes, guardado de revisiones con tope de 10, usuario recordado), `npx expo lint`, `npx tsc --noEmit`, `noHardcoded`.
- Navegador (`web-compilada`) a 1366 y 375 px: sin partidas contra bots, con partidas, revisar una y volver con «Ver revisión»; chess.com con usuario recordado; Lichess; PGN válido e inválido; «Practicar mis errores»; «Abrir tablero»; `/importar-partida` lleva a `/analisis`.
