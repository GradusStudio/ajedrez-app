# Perfil nuevo: resumen, camino, nivel de puzzles, bots y logros

Fecha: 14-11-2026 · Diseño: opus · **Referencia visual:** `prototipo-perfil.html` (raíz del repo, fuera de git; datos de ejemplo).

## Decisiones del autor (14-11-2026)

- **Sin identidad propia:** no hay avatar ni nombre; el perfil es el progreso.
- **Contenido:** las cuatro secciones propuestas: tu camino en Aprender, nivel de puzzles con gráfico, récord contra los bots y logros.

Hoy el Perfil es una fila de cuatro números, una lista de aperturas con barras y una lista de accesos. Lo nuevo cuenta la historia del usuario de un vistazo y le da motivos para volver.

## Estructura (pantalla ancha, columna de 1000 px)

Encima del fondo con luz cálida y con las tarjetas con relieve de la tarea 27.

### 1. Resumen
Cuatro tarjetas en fila, cada una con ícono de 36 a 40 px, número grande (26 px, 900) y rótulo (14 px, `textMuted`):
- **Racha:** la llama nueva (`StreakFlame`, con su estado) · «días de racha · mejor: 9».
- **Monedas:** número en `gold`.
- **Lecciones:** «34/75».
- **Nivel de puzzles:** número en `gold` (oculto si el ajuste «Mostrar mi nivel de puzzles» está apagado; en ese caso, «puzzles resueltos»).

### 2. Tu camino en Aprender
Tarjeta con «34 de 75 lecciones» a la derecha del título y una grilla de 3 columnas con las nueve unidades. Cada unidad:
- **Tablero de progreso** chico (64 px), con la posición de `progressPosition` para esa unidad. Es la misma partida que avanza en Aprender, así se ve cuánto falta.
- Rótulo «UNIDAD 3» (12 px, verde); si está completa, «· completa», y si es la actual, «· en curso». Nombre (15 px, 900).
- Barra fina de progreso: verde, o **dorada** si está completa. Debajo, «2 de 7 lecciones».
- La unidad en curso lleva el borde en verde. Una unidad cerrada (nivel «nuevo», tarea 21) va al 50 % con un candado chico.
- Tocar una unidad abre Aprender en esa unidad.

### 3. Nivel de puzzles (columna izquierda de una fila de dos)
- Nivel actual en grande (44 px, `gold`) y, al lado, el cambio de los últimos 7 días («▲ 62 en 7 días» en verde, «▼ 18» en `textMuted`; nunca en rojo, para no castigar).
- **Gráfico de línea** de los últimos 40 puzzles con nivel: línea dorada de 2,5 px, área degradada debajo, dos líneas guía con su valor y un punto en el último valor. Sin ejes ni leyendas extra.
- Pie: «Resueltos 33 · Sin errores 21 · Mejor nivel 1371».
- **Dato nuevo:** hoy solo se guarda el nivel actual. Se suma `puzzleRating.history: { at: string; rating: number }[]` (los últimos 60), agregado en `applyRating`. Es un campo opcional, sin subir `PROGRESS_VERSION`. Al sincronizar se juntan las dos listas por `at`, se ordenan y se cortan a 60.
- **Vacío:** con menos de 3 puntos, en lugar del gráfico: «Resuelve unos puzzles más para ver cómo cambia tu nivel» y un botón secundario «Ir a Puzzles».
- Respeta el ajuste que oculta el nivel: si está apagado, la tarjeta muestra solo los resueltos, sin número ni gráfico.

### 4. Contra los bots (columna derecha)
- «5 de 10 vencidos» junto al título.
- Grilla de 5 × 2 con la cara de cada bot (56 px) en orden de nivel, el nombre y el récord («3 – 0»):
  - **Vencido** (al menos una victoria): círculo dorado con canto, récord en `gold`.
  - **Jugado sin vencer:** círculo gris.
  - **Sin jugar:** cara en gris apagado y «sin jugar».
  - **Próximo rival:** el bot de menor nivel que todavía no venciste, con anillo verde.
- Debajo: «Próximo rival: Camila (nivel 1500) · la llevas 0 – 3». Tocarlo abre su ficha.
- Datos: `progress.games` (victorias, derrotas y tablas por bot). Tocar un bot abre su ficha.

### 5. Logros
Tarjeta con «9 de 18» y una grilla de 6 columnas. Cada logro es una **medalla** (64 × 68 px: cinta roja, disco de color con canto, aro claro y un número o símbolo), con nombre (13 px, 900) y descripción (11 px). Si no se tiene, en gris y, si corresponde, el avance en verde («6/7»). Uno recién ganado lleva la etiqueta dorada «Nuevo» hasta que se ve el Perfil.

**Los 18 logros iniciales.** Todos se calculan con datos que ya existen, así que los usuarios de hoy los reciben al instante:

| Logro | Condición | Color | Dato |
|---|---|---|---|
| Primer paso | 1 lección | verde | `progress.lessons` |
| Lo básico · Las reglas · Táctico | Unidad 1, 2 y 3 completas | verde | lecciones por unidad |
| Sin errores | 5 lecciones seguidas con 0 errores (por fecha de la primera vez) | verde | `lessons[*].errors`, `completedAt` |
| Encendido · Una semana · Constancia | racha de 3, 7 y 30 días (la mejor) | naranja | `streak.best` |
| Resolutor · Cazador | 10 y 100 puzzles resueltos | dorado | `progress.puzzles` |
| Nivel 1500 | llegar a 1500 en puzzles | dorado | `puzzleRating` (y `history` para el mejor) |
| Primera victoria · Mitad del camino | ganarle a 1 y a 5 bots distintos | azul | `progress.games` |
| Ganarle a Ada | vencer a Ada | azul | `progress.games` |
| Aperturista · Repertorio | 1 y 3 cursos de apertura completos | violeta | lecciones por curso |
| Aprendiste de tu partida | resolver un punto de giro del quiz | violeta | `progress.turningPoints` |
| Coleccionista | comprar algo en la tienda | rojo | `pieceSets`, `boardThemes` comprados |

- Lógica pura en `src/progress/achievements.ts`: `achievements(progress, content)` devuelve cada logro con `earned` y `progress?: { value, goal }`. Con pruebas para cada condición.
- «Nuevo»: `settings.seenAchievements: string[]` (aparte del progreso, como `seenTips`); al abrir el Perfil se marcan como vistos.
- Más adelante (fuera de alcance): avisar el logro en la pantalla de resultado, y logros por cada unidad de la 4 a la 9.

### 6. Accesos
Tres tarjetas en fila: «Partidas contra bots» (todas tus partidas y revisiones), «Repasar errores» («4 ejercicios pendientes», solo si hay) y «Ajustes». **Créditos** pasa a Ajustes, al final. La tienda ya no aparece acá: está en la barra lateral y en Inicio (tarea 28).

## Celular

Una columna: resumen en 2 × 2, el camino como lista (una unidad por fila), nivel de puzzles, bots (grilla de 5 × 2 con caras de 48 px), logros en 3 columnas y los accesos como lista.

## Accesibilidad y textos

- Cada unidad, bot y logro es un botón o un texto con etiqueta completa («Unidad 3, Táctica básica, completa, 10 de 10 lecciones»; «Logro Una semana, sin conseguir, 6 de 7 días»).
- El gráfico lleva una etiqueta que resume los datos («Nivel de puzzles: de 1180 a 1349 en los últimos 40 puzzles»).
- Textos de tú, sin exclamaciones, en los cinco idiomas (de, it y fr con gemma4).

## Cómo se comprueba

- `npm test` (pruebas de `achievements.ts` y del historial de nivel con su fusión), `npx expo lint`, `npx tsc --noEmit`, `noHardcoded`.
- Navegador (`web-compilada`) a 1366 y 375 px, con una cuenta nueva (todo vacío, sin gráfico, ningún logro) y con una cuenta con progreso; con el ajuste del nivel de puzzles apagado.
