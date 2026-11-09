# Nivel de puzzles: plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDA: superpowers:subagent-driven-development (recomendada) o superpowers:executing-plans, tarea por tarea. Los pasos usan casillas (`- [ ]`).

**Objetivo:** un nivel de puzzles tipo Elo que se mueve con cada puzzle y una práctica «Automático» que elige puzzles cerca de ese nivel, con opción de ocultar el número.

**Arquitectura:** cálculo puro en `src/progress/puzzleRating.ts`; el progreso guarda `puzzleRating` (campo opcional, versión 4 sin cambios) y lo combina en `merge.ts`; la elección cerca del nivel es pura (`puzzles.ts`) y la usan las dos fuentes (`listSource` y `createChunkSource`) mediante un método nuevo `nextNear` de `PuzzleSource`; las pantallas solo leen el nivel y llaman a la fuente.

**Tecnología:** Expo + React Native + TypeScript, `node:test` con tsx (`npm test`).

**Spec:** `docs/superpowers/specs/2026-11-09-nivel-de-puzzles-design.md` (leerla entera antes de empezar; la sección «Diseño visual» manda en las pantallas).

## Restricciones globales

- Elo: `E = 1 / (1 + 10^((ratingPuzzle − nivel) / 400))`; cambio `round(K × (resultado − E))`; K = 40 en los primeros 20 puzzles con nivel (`rated < 20`), 20 después; nivel entre 400 y 3000.
- Resultado 1 solo con `clean`; 0 con cualquier error, pista o «Ver solución». El fallo se cobra en el momento (primera jugada mala, pista o «Ver solución»), una sola vez por puzzle.
- Solo la primera vez: un puzzle que ya está en `progress.puzzles` o en `puzzleRating.pending` no mueve el nivel.
- Nivel inicial: `nuevo` 800, `basico` 1100, `casual` 1400, sin nivel 1000.
- Elección automática: objetivo = nivel + entero al azar en [−100, +100]; ventanas ±100, ±200, ±400 alrededor del objetivo; si no hay pendientes ahí, lo de siempre (pendiente del nivel de dificultad del objetivo, después repetido).
- `pending`: tope 500 ids, se descartan los más viejos; un id sale de `pending` al terminar el puzzle.
- Mezcla: gana el `puzzleRating` con más `rated`; empate, el `at` más reciente; `pending` se une (sin los ids que ya están en `puzzles`, tope 500). `withReset` lo borra.
- Ajustes nuevos: `showPuzzleRating` (true), `puzzleMode` 'auto' | 'manual' ('auto'), `puzzleLevel` Level | null (null).
- Monedas, racha y la forma de `progress.puzzles` no cambian. `PROGRESS_VERSION` sigue en 4.
- Textos en los cinco idiomas; de, it y fr con gemma4 vía Ollama (`POST http://localhost:11434/api/generate`, `stream:false`, `think:false`, cuerpo UTF-8), revisando términos ("Puzzles" en alemán) y puntuación. Sin exclamaciones ni guiones largos. `noHardcoded.test.ts` tiene que pasar.
- Colores y componentes según la sección «Diseño visual» de la spec: número del nivel en `colors.gold`, 20px, 800; línea del cambio en el color del panel (sin color propio); signo menos `−` (U+2212).
- Git solo desde Git Bash; un commit por tarea, autor Gradus Studio (ya configurado), con la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Foco de revisión

1. Salir del puzzle después de un error sin terminar: el nivel ya bajó y volver a abrir ese puzzle no lo vuelve a mover (prueba en la tarea 2).
2. Error y después «Ver solución» en el mismo puzzle: se cobra una sola vez (prueba en la tarea 2 y comprobación en la tarea 5).
3. Tema con pocos puzzles cerca del nivel (Experto o «Mate del pasillo» lejos del nivel) en Automático: tiene que dar un puzzle igual (pruebas en la tarea 3).
4. Celular con nivel por encima de 2500 (no hay Experto en la lista de 50.000): Automático da puzzles de Difícil (prueba en la tarea 3).
5. Copia vieja (sin `puzzleRating`) o con `puzzleRating` roto al cargar o importar: se usa el nivel inicial, sin errores (pruebas en la tarea 2).

---

### Tarea 1: Cálculo del nivel

**Archivos:**
- Crear: `src/progress/puzzleRating.ts`
- Prueba: `src/progress/puzzleRating.test.ts`

**Interfaces:**
- Produce:
  - `type PuzzleRating = { rating: number; rated: number; at: string | null; pending: string[] }`
  - `const RATING_MIN = 400, RATING_MAX = 3000, MAX_PENDING = 500`
  - `initialRating(level?: PlayerLevel): number`
  - `currentRating(p: { puzzleRating?: PuzzleRating; profile: { level?: PlayerLevel } }): number`
  - `ratingDelta(rating: number, rated: number, puzzleRating: number, score: 0 | 1): number`
  - `applyRating(state: PuzzleRating, puzzleRating: number, score: 0 | 1, now: Date): { state: PuzzleRating; delta: number }` (suma `rated`, pone `at`, recorta a 400–3000; `delta` es el cambio real tras recortar)
  - `formatDelta(delta: number): string` → `"+8"`, `"−18"` (U+2212), `"0"`

- [ ] **Paso 1: pruebas que fallan** en `puzzleRating.test.ts`:
  - `initialRating`: `'nuevo'` 800, `'basico'` 1100, `'casual'` 1400, `undefined` 1000.
  - `currentRating({ profile: { level: 'casual' } })` 1400; con `puzzleRating.rating` 1234 da 1234.
  - `ratingDelta(1000, 0, 1000, 1)` 20; `ratingDelta(1000, 20, 1000, 0)` −10; `ratingDelta(1500, 5, 1100, 1)` 4; `ratingDelta(1500, 19, 1900, 0)` −4.
  - `applyRating` desde `{ rating: 2995, rated: 30, at: null, pending: [] }` con puzzle 3300 y score 1: `state.rating` 3000, `delta` 5, `rated` 31, `at` igual a `now.toISOString()`; desde 405 con puzzle 300 y score 0 queda en 400.
  - `formatDelta(8)` `'+8'`, `formatDelta(-18)` `'−18'`.
- [ ] **Paso 2:** `npx tsx --test src/progress/puzzleRating.test.ts` falla (módulo inexistente).
- [ ] **Paso 3:** implementar las funciones (puro, sin React Native; `PlayerLevel` se importa como tipo de `progressStore`).
- [ ] **Paso 4:** la misma orden pasa.
- [ ] **Paso 5:** commit «Nivel de puzzles: cálculo tipo Elo».

### Tarea 2: El nivel en el progreso

**Archivos:**
- Modificar: `src/progress/progressStore.ts` (tipo `Progress`, `withPuzzleFinished`, función nueva, `withReset`), `src/progress/structure.ts` (validar `puzzleRating`), `src/progress/merge.ts`, `src/progress/ProgressContext.tsx`
- Pruebas: `src/progress/progressStore.test.ts`, `src/progress/merge.test.ts`

**Interfaces:**
- Consume: tarea 1.
- Produce:
  - `Progress.puzzleRating?: PuzzleRating` (no va en `emptyProgress`; `KNOWN_FIELDS` lo tiene que incluir: sumarlo a la lista junto a `'lastUnit'`).
  - `withPuzzleFailedNow(p: Progress, id: string, puzzleRating: number, now?: Date): { progress: Progress; delta: number | null }`: si el id no está en `puzzles` ni en `pending`, aplica score 0 y agrega el id a `pending` (tope 500); si no, devuelve `p` y `null`.
  - `withPuzzleFinished(p, id, result, seconds, puzzleRating: number, now?)` devuelve además `ratingChange: { rating: number; delta: number } | null`: con `clean` y el id nuevo (ni en `puzzles` ni en `pending`), aplica score 1; con `solved`/`failed` y el id nuevo, aplica score 0 (por si la pantalla no llegó a cobrarlo); el id sale de `pending` siempre. Monedas y racha como hoy.
  - `ProgressContext`: `failPuzzle(id: string, puzzleRating: number): number | null` (delta o null) y `finishPuzzle(id, result, seconds, puzzleRating)`; `Earned` suma `rating?: { rating: number; delta: number } | null` (solo lo llena `finishPuzzle`).
  - `merge.ts`: `mergePuzzleRating(a: PuzzleRating | undefined, b: PuzzleRating | undefined, puzzles: Record<string, PuzzleRecord>): PuzzleRating | undefined` exportada, usada en `mergeProgress`.

- [ ] **Paso 1: pruebas que fallan** (en los archivos de prueba existentes):
  - Fallo en el momento: progreso con nivel `casual`; `withPuzzleFailedNow(p, 'x', 1400)` da `delta` −20, `rating` 1380, `pending` `['x']`; repetirlo da `delta` null y no cambia nada.
  - Abandonar y volver: después del fallo, `withPuzzleFinished(p, 'x', 'clean', 10, 1400)` da `ratingChange` null, `pending` `[]`, `puzzles.x.result` `'clean'` y las monedas de siempre (2).
  - Acierto limpio nuevo: `withPuzzleFinished(empty, 'y', 'clean', 10, 1000)` da `ratingChange` `{ rating: 1020, delta: 20 }`; un segundo `withPuzzleFinished` del mismo id da `null`.
  - `solved` sin fallo previo cobrado: baja (score 0).
  - Tope: con 500 ids en `pending`, un fallo nuevo deja 500 y descarta el más viejo.
  - `withReset` deja `puzzleRating` sin definir.
  - Carga: `migrate` de una versión 4 sin `puzzleRating` no lo inventa; `repairStructure` descarta un `puzzleRating` con `rating: 'abc'` o `pending: 5` (y lo informa en `repaired`).
  - Mezcla: gana el de más `rated`; con igual `rated`, el `at` más reciente; `pending` unido sin los ids que están en `puzzles`; un lado sin nivel → el otro; los dos sin nivel → `undefined`. `mergeProgress(a, a)` sigue siendo idempotente.
- [ ] **Paso 2:** `npx tsx --test src/progress/progressStore.test.ts src/progress/merge.test.ts` falla.
- [ ] **Paso 3:** implementar. En `ProgressContext`, `failPuzzle` hace `commit` solo si `delta !== null`; actualizar la única llamada actual a `finishPuzzle` (`PuzzleScreen`) pasando `puzzle.rating`, para que compile (la pantalla se completa en la tarea 5).
- [ ] **Paso 4:** pasan esas pruebas y `npm test` entero; `npx tsc --noEmit -p .` sin errores.
- [ ] **Paso 5:** commit «Nivel de puzzles: guardado, fallo en el momento y mezcla».

### Tarea 3: Elegir puzzles cerca del nivel

**Archivos:**
- Modificar: `src/puzzles/puzzles.ts`, `src/puzzles/source.ts`, `src/puzzles/chunks.ts`
- Pruebas: `src/puzzles/puzzles.test.ts`, `src/puzzles/chunks.test.ts`

**Interfaces:**
- Produce:
  - `puzzles.ts`: `NEAR_WINDOWS = [100, 200, 400]`; `autoTarget(rating: number, random?: () => number): number` (entero en [rating−100, rating+100]); `levelOf(rating: number): Level` (según `LEVELS`); `pickNear(list: Puzzle[], target: number, done: (id: string) => boolean, seen: ReadonlySet<string>, random?: () => number): Puzzle | undefined` (pendiente en la primera ventana que tenga alguno; undefined si ninguna).
  - `PuzzleSource.nextNear(rating: number, theme: string | null, done, seen): Promise<Puzzle | undefined>`.
  - `listSource.nextNear`: pool = puzzles del tema (todos los niveles); `pickNear(pool, autoTarget(rating))` y, si no, `pickPending(pool)` y después `pickAny(pool)`.
  - `createChunkSource(...).nextNear`: nivel = `levelOf(objetivo)`; si ese nivel no tiene puzzles del grupo, el nivel más cercano que sí tenga. Usa los mismos trozos, memoria, reintentos (3), prefetch y búsqueda sin conexión que `next`, pero eligiendo dentro de cada trozo con `pickNear`; si en 3 trozos no hay pendiente cerca, devuelve lo que daría `next(nivel, theme, ...)`. Refactorizar `next` para compartir el recorrido en vez de copiarlo (parámetro con la función de elección).

- [ ] **Paso 1: pruebas que fallan:**
  - `autoTarget(1000, () => 0)` 900, `() => 0.5` 1000, `() => 0.999999` 1100.
  - `levelOf(399)` facil, `levelOf(1200)` medio, `levelOf(2600)` experto.
  - `pickNear`: lista con ratings 1000, 1150, 1390 y objetivo 1000 → el de 1000; si 1000 está resuelto → 1150 (ventana ±200); si los dos → 1390 (±400); si los tres → undefined; respeta `seen`.
  - `listSource([...]).nextNear(2700, null, ...)` con una lista que llega a 2499 devuelve un puzzle (foco 4); con tema `fork` devuelve uno con `fork`.
  - `createChunkSource` con el índice de prueba de `chunks.test.ts` (sumar ratings variados a las filas): `nextNear(1300, null, ...)` pide un trozo de `medio/todos`; `nextNear(2700, 'fork', ...)` usa `medio/fork` porque `experto` no tiene puzzles (foco 3); sin red y con un trozo de `medio/todos` guardado, `nextNear(1300, 'pin', ...)` da el de `pin`.
- [ ] **Paso 2:** `npx tsx --test src/puzzles/puzzles.test.ts src/puzzles/chunks.test.ts` falla.
- [ ] **Paso 3:** implementar.
- [ ] **Paso 4:** pasan, y `npm test` entero.
- [ ] **Paso 5:** commit «Puzzles: elección cerca del nivel en el celular y en la web».

### Tarea 4: Ajustes

**Archivos:**
- Modificar: `src/settings/sanitize.ts`, `src/screens/SettingsScreen.tsx`, `src/i18n/{es,en,de,it,fr}.ts`
- Prueba: `src/settings/settingsSanitize.test.ts`

**Interfaces:**
- Produce: `Settings.showPuzzleRating: boolean`, `Settings.puzzleMode: 'auto' | 'manual'`, `Settings.puzzleLevel: Level | null` (tipo `Level` importado de `../puzzles/puzzles`); claves `settings.showPuzzleRating` («Mostrar mi nivel de puzzles») y `settings.showPuzzleRating.description` («Aunque esté oculto, los puzzles se ajustan a tu nivel.»).

- [ ] **Paso 1: prueba que falla:** valores por defecto (`true`, `'auto'`, `null`); `sanitizeSettings({ showPuzzleRating: 'x', puzzleMode: 'otro', puzzleLevel: 'imposible' })` vuelve a los valores por defecto; `puzzleLevel: 'experto'` se conserva.
- [ ] **Paso 2:** falla.
- [ ] **Paso 3:** implementar el saneado y la fila: `SettingRow` con interruptor dentro de la sección «Práctica» de Ajustes, que hoy solo existe si `REMINDERS_SUPPORTED`; el título de sección se muestra siempre y el recordatorio queda condicionado como ahora. Textos en los cinco idiomas (de/it/fr con gemma4).
- [ ] **Paso 4:** `npm test` pasa (incluye `noHardcoded`).
- [ ] **Paso 5:** commit «Ajustes: mostrar u ocultar el nivel de puzzles».

### Tarea 5: Pantalla del puzzle

**Archivos:**
- Modificar: `src/screens/PuzzleScreen.tsx`, `src/app/puzzle.tsx`, `src/i18n/{es,en,de,it,fr}.ts`

**Interfaces:**
- Consume: `failPuzzle`, `finishPuzzle` y `Earned.rating` (tarea 2), `PuzzleSource.nextNear` (tarea 3), `currentRating`/`formatDelta` (tarea 1), `settings.showPuzzleRating` (tarea 4).
- Produce: ruta `/puzzle?modo=practica&nivel=auto&tema=...` (también sin `nivel`) = Automático; clave `puzzles.mode.auto` («Automático»), `puzzles.ratingChange` («Nivel {rating} ({delta})»).

- [ ] **Paso 1:** `PuzzleScreen`: un `ref` `charged` y un estado `failDelta: number | null`. La primera vez que pasa una de estas tres cosas: jugada equivocada (en el bloque `!correct`), `hint()` o `showSolution()` (antes de `finish('failed')`), llama a `failPuzzle(puzzle.id, puzzle.rating)` y guarda el delta. `finish` pasa `puzzle.rating`.
- [ ] **Paso 2:** en los dos `FeedbackPanel`, si `settings.showPuzzleRating` y hay cambio (`earned?.rating` o `failDelta`), sumar al mensaje `t('puzzles.ratingChange', { rating, delta: formatDelta(delta) })`, con `rating` = nivel actual del progreso. Sin color propio (va dentro del mensaje del panel).
- [ ] **Paso 3:** `app/puzzle.tsx`: `nivel` ausente o `'auto'` → Automático: `source.nextNear(currentRating(progressRef.current), theme, solved, seen)`, tanto al montar como en «Siguiente»; chip «Práctica · Automático · Tema». `nivel` válido → como hoy.
- [ ] **Paso 4:** `npm test`, `npx tsc --noEmit -p .` y `npx expo lint` sin errores.
- [ ] **Paso 5:** commit «Puzzle: el nivel se cobra en el momento y se muestra al terminar».

### Tarea 6: Sección «Dificultad» en Práctica

**Archivos:**
- Modificar: `src/screens/PuzzlesScreen.tsx`, `src/app/(tabs)/puzzles.tsx`, `src/i18n/{es,en,de,it,fr}.ts`

**Interfaces:**
- Consume: tareas 1, 4 y 5.
- Produce: `onPractice(level: Level | 'auto', theme: string | null)`; claves `puzzles.mode.manual` («Elegir dificultad») y `puzzles.myRating` («Tu nivel de puzzles:»).

- [ ] **Paso 1:** debajo de la etiqueta «Dificultad», el selector de dos opciones (mismo componente/estilo que el de niveles de esta pantalla) con `puzzles.mode.auto` / `puzzles.mode.manual`, `accessibilityRole="radio"`. Valor y cambios desde `settings.puzzleMode`.
- [ ] **Paso 2:** Automático: si `showPuzzleRating`, tarjeta según «Diseño visual» de la spec (`surface`, borde 2px `surfaceRaised`, borde inferior 4px `surfaceShadow`, radio 16, padding 12/14) con `puzzles.myRating` en cuerpo y el número en `colors.gold` 20px 800; `accessibilityLabel` con el texto entero. Sin el texto de cantidad. Elegir dificultad: los botones de nivel de hoy y el texto de cantidad. El nivel manual sale de `settings.puzzleLevel` o, si es null, `levelOf(currentRating(progress))` limitado a `levelsWithPuzzles`; tocar un nivel lo guarda en `settings.puzzleLevel`.
- [ ] **Paso 3:** «Practicar» llama a `onPractice(puzzleMode === 'auto' ? 'auto' : nivel, tema)`; `(tabs)/puzzles.tsx` arma la ruta con `nivel=auto`.
- [ ] **Paso 4:** `npm test`, `tsc` y lint sin errores.
- [ ] **Paso 5:** commit «Práctica: dificultad automática o elegida».

### Tarea 7: Comprobación, documentos y compuerta de antislop

**Archivos:**
- Modificar: `docs/puzzles.md`, `CLAUDE.md`, estado de la spec («implementada»)

- [ ] **Paso 1:** `EXPO_PUBLIC_PUZZLES_URL=http://localhost:8789/ npm run build:web` (Git Bash) y levantar las configuraciones `puzzles-trozos` y `web-compilada`.
- [ ] **Paso 2:** recorrido, anotando cada resultado: Automático y Elegir dificultad (cambia lo de abajo), cada nivel, cada tema, interruptor de Ajustes (el recuadro aparece y desaparece), Practicar en Automático (chip «Automático», rating del puzzle cerca del nivel), acierto limpio (sube, línea «Nivel N (+x)»), error y salir con la ✕ (al volver, el nivel ya bajó), error y «Ver solución» (baja una sola vez), Siguiente puzzle, sin conexión (servidor de trozos apagado). A 375px y en escritorio; consola sin errores.
- [ ] **Paso 3:** compuerta de entrega de antislop (cuatro bloques, cada PASS con su evidencia) en el mensaje final.
- [ ] **Paso 4:** documentar en `docs/puzzles.md` (sección del nivel: fórmula, valores, solo la primera vez, fallo en el momento, `pending`, Automático) y una línea en `CLAUDE.md`; marcar la spec como implementada.
- [ ] **Paso 5:** compilar sin la variable (`npm run build:web`) para confirmar los controles de producción y commit «Nivel de puzzles: documentos».
