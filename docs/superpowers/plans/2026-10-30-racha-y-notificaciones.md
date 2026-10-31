# Racha con recuperación y notificaciones: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir recuperar la racha tras fallar un día haciendo las tres acciones, y convertir el recordatorio en un aviso útil que no molesta si ya se practicó.

**Architecture:** Las reglas viven en dos módulos puros y sin React Native (`src/progress/streak.ts` y `src/settings/reminderPlan.ts`), probados con `node:test`. `progressStore` y las pantallas solo los usan. Un hook en la raíz reprograma los avisos cuando cambian la racha o el recordatorio, o cuando la app vuelve a primer plano.

**Tech Stack:** Expo Router, React Native, TypeScript, expo-notifications, AsyncStorage; `tsx` + `node:test` para las pruebas.

**Spec:** `docs/superpowers/specs/2026-10-30-racha-y-notificaciones-design.md`

## Global Constraints

- Trabajar en la rama nueva `racha-notificaciones`, creada desde `correcciones-revision`. Git solo desde Git Bash.
- Textos en español, sin exclamaciones en mensajes del sistema (`docs/design.md`).
- Sin subir `version` de `Progress` y sin cambiar claves de AsyncStorage.
- Sin vidas ni bloqueos: la racha nunca impide usar la app.
- Notificaciones solo locales, compatibles con Expo Go.
- Las funciones `with...` siguen puras, con la fecha como parámetro.
- `npx tsc --noEmit` y `npx expo lint` sin errores nuevos al cerrar cada tarea. Los 4 avisos actuales de lint son conocidos.
- Cada commit termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- El reloj del teléfono retrocede un día o más: la racha no se reinicia ni se rompe.
- Una racha guardada antes de esta versión, sin `actions`, con hueco 2: entra en recuperación sin acciones marcadas.
- La misma acción repetida el día de recuperación: no completa las tres.
- El permiso de notificaciones se revoca desde el teléfono con el recordatorio encendido: no hay error y no se programa nada.
- Se abre la app después de la hora del aviso: no se programa nada para el pasado.

---

### Task 1: Reglas de la racha

**Files:**
- Create: `src/progress/streak.ts`
- Test: `src/progress/streak.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces, en `src/progress/streak.ts`:
  - `todayKey(now?: Date): string`
  - `type StreakAction = 'lesson' | 'puzzle' | 'bot'`
  - `type DayActions = { date: string; lesson: boolean; puzzle: boolean; bot: boolean }`
  - `type Streak = { current: number; best: number; lastActiveDate: string | null; actions?: DayActions }`
  - `type StreakStatus = { kind: 'none' | 'active' | 'safe' | 'recovering'; days: number; done: Record<StreakAction, boolean> }`
  - `streakStatus(s: Streak, today: string): StreakStatus`
  - `withStreakAction(s: Streak, action: StreakAction, today: string): { streak: Streak; recovered: boolean }`
  - `puzzleCountsForStreak(result: 'clean' | 'solved' | 'failed'): boolean`
  - `gameCountsForStreak(quit: boolean, plies: number): boolean`

- [ ] **Step 1: Instalar `tsx` y agregar el comando de pruebas**

Crear la rama. Ejecutar `npm install --save-dev tsx` y agregar a `package.json` el script `"test": "tsx --test \"src/**/*.test.ts\""`.

- [ ] **Step 2: Escribir las pruebas**

Con `test` de `node:test` y `assert` de `node:assert/strict`. Helper: `const s = (current, lastActiveDate, actions?) => ({ current, best: current, lastActiveDate, actions })`.

```ts
const all = (date: string) => ({ date, lesson: true, puzzle: true, bot: true });

test('hueco 1 suma con una acción', () => {
  const r = withStreakAction(s(10, '2026-10-29'), 'puzzle', '2026-10-30');
  assert.equal(r.streak.current, 11);
  assert.equal(r.streak.lastActiveDate, '2026-10-30');
  assert.equal(r.recovered, false);
});
test('hoy ya activo no vuelve a sumar', () => {
  assert.equal(withStreakAction(s(10, '2026-10-30'), 'bot', '2026-10-30').streak.current, 10);
});
test('hueco 2 con racha de 10 pide recuperación', () => {
  const st = streakStatus(s(10, '2026-10-28'), '2026-10-30');
  assert.equal(st.kind, 'recovering');
  assert.equal(st.days, 10);
  assert.deepEqual(st.done, { lesson: false, puzzle: false, bot: false });
});
test('las tres acciones recuperan sin sumar, y el día siguiente suma', () => {
  let x = s(10, '2026-10-28');
  x = withStreakAction(x, 'puzzle', '2026-10-30').streak;
  x = withStreakAction(x, 'lesson', '2026-10-30').streak;
  assert.equal(x.lastActiveDate, '2026-10-28');
  const r = withStreakAction(x, 'bot', '2026-10-30');
  assert.equal(r.recovered, true);
  assert.equal(r.streak.current, 10);
  assert.equal(r.streak.lastActiveDate, '2026-10-30');
  assert.equal(withStreakAction(r.streak, 'puzzle', '2026-10-31').streak.current, 11);
});
test('la misma acción repetida no completa la recuperación', () => {
  let x = s(10, '2026-10-28');
  for (let i = 0; i < 3; i++) x = withStreakAction(x, 'puzzle', '2026-10-30').streak;
  assert.equal(streakStatus(x, '2026-10-30').kind, 'recovering');
});
test('recuperación incompleta: al otro día es una racha nueva de 1', () => {
  const x = withStreakAction(s(10, '2026-10-28'), 'puzzle', '2026-10-30').streak;
  const st = streakStatus(x, '2026-10-31');
  assert.equal(st.kind, 'active');
  assert.equal(st.days, 1);
  assert.equal(withStreakAction(x, 'lesson', '2026-10-31').streak.current, 2);
});
test('recuperación incompleta y otro día sin practicar: se pierde', () => {
  const x = withStreakAction(s(10, '2026-10-28'), 'puzzle', '2026-10-30').streak;
  assert.equal(streakStatus(x, '2026-11-01').kind, 'none');
});
test('hueco 2 con racha de 1 se pierde', () => {
  assert.equal(streakStatus(s(1, '2026-10-28'), '2026-10-30').kind, 'none');
  assert.equal(withStreakAction(s(1, '2026-10-28'), 'bot', '2026-10-30').streak.current, 1);
});
test('hueco 3 se pierde y empieza en 1', () => {
  assert.equal(streakStatus(s(10, '2026-10-27'), '2026-10-30').days, 0);
  assert.equal(withStreakAction(s(10, '2026-10-27'), 'bot', '2026-10-30').streak.current, 1);
});
test('cambio de mes', () => {
  assert.equal(streakStatus(s(5, '2026-10-30'), '2026-11-01').kind, 'recovering');
});
test('reloj atrasado no reinicia la racha', () => {
  const st = streakStatus(s(10, '2026-10-30'), '2026-10-25');
  assert.equal(st.kind, 'safe');
  assert.equal(st.days, 10);
});
test('hoy con las tres acciones de ayer no marca nada', () => {
  assert.equal(streakStatus({ ...s(5, '2026-10-29'), actions: all('2026-10-29') }, '2026-10-30').done.lesson, false);
});
test('puzzle con solución vista no cuenta', () => {
  assert.equal(puzzleCountsForStreak('failed'), false);
  assert.equal(puzzleCountsForStreak('solved'), true);
});
test('abandonar cuenta solo con 10 jugadas o más', () => {
  assert.equal(gameCountsForStreak(true, 9), false);
  assert.equal(gameCountsForStreak(true, 10), true);
  assert.equal(gameCountsForStreak(false, 2), true);
});
```

- [ ] **Step 3: Ejecutar las pruebas y ver que fallan**

Run: `npm test`. Expected: FAIL, no existe `./streak`.

- [ ] **Step 4: Implementar `src/progress/streak.ts`**

Sin imports de React Native. Mover aquí `todayKey` desde `progressStore.ts`. El hueco se calcula con `Date.UTC` sobre año, mes y día, para no depender del horario de verano.

Una recuperación incompleta se resuelve al leer: si `actions.date` es `lastActiveDate` + 2, es anterior a `today`, `current >= 2` y faltan acciones, antes de cualquier cálculo la racha se trata como `{ current: 1, best, lastActiveDate: actions.date }`.

Estados según hueco tras ese paso: `<= 0` es `safe`; `1` es `active`; `2` con `current >= 2` es `recovering`; el resto es `none` con `days: 0`. `done` solo refleja `actions` si `actions.date === today`.

`withStreakAction` marca la acción de hoy y actúa según el estado: `safe` no cambia nada más; `active` suma 1 y mueve `lastActiveDate`; `none` deja `current` en 1 y mueve `lastActiveDate`; `recovering` solo mueve `lastActiveDate` y da `recovered: true` al completar las tres. `best` nunca baja.

- [ ] **Step 5: Ejecutar las pruebas y ver que pasan**

Run: `npm test`. Expected: PASS, todas. También `npx tsc --noEmit`.

- [ ] **Step 6: Commit**

`git add package.json package-lock.json src/progress/streak.ts src/progress/streak.test.ts` y commit «Reglas de racha con recuperación».

### Task 2: Conectar la racha con el progreso y los mensajes

**Files:**
- Modify: `src/progress/progressStore.ts`, `src/progress/ProgressContext.tsx`
- Modify: `src/app/leccion/[id].tsx`, `src/app/resultado.tsx`, `src/screens/LessonResultScreen.tsx`
- Modify: `src/screens/PuzzleScreen.tsx`, `src/screens/GameScreen.tsx`

**Interfaces:**
- Consumes: todo lo de la tarea 1.
- Produces:
  - `Progress.streak: Streak`
  - `Earned = { coins: number; goalBonus: number; streakRecovered: boolean }`
  - `finishReview(r: ReviewFinish): boolean` (devuelve si recuperó la racha)
  - `finishGame(game, seconds, botElo, countsForStreak: boolean): Earned`
  - `streakStatusNow(p: Progress, today?: string): StreakStatus` en `progressStore.ts`

- [ ] **Step 1: Cambiar `progressStore.ts`**

Eliminar `withActiveDay` y `dayBefore`. Reexportar `todayKey` desde `./streak`. `currentStreak` pasa a ser `streakStatus(p.streak, today).days`. Agregar `streakStatusNow`, que llama a `streakStatus` con `today = todayKey()` por defecto. `withLessonFinished` y `withReviewFinished` usan la acción `'lesson'`. `withPuzzleFinished` usa `'puzzle'` solo si `puzzleCountsForStreak(result)`. `withGameFinished` recibe `countsForStreak: boolean` antes de `now` y usa `'bot'` solo si es true. Las cuatro devuelven también `streakRecovered`; `withReviewFinished` pasa a devolver `{ progress, streakRecovered }`.

- [ ] **Step 2: Cambiar `ProgressContext.tsx`**

Agregar `streakRecovered` a `Earned` y a `commitEarned`. `finishReview` devuelve el booleano.

- [ ] **Step 3: Lección y resultado**

En `leccion/[id].tsx`, pasar el parámetro `recuperada: '1'` si hubo recuperación. En `resultado.tsx`, enviar `streakRecovered={params.recuperada === '1'}` a `LessonResultScreen`, que muestra «Recuperaste tu racha.» junto a la racha.

- [ ] **Step 4: Puzzle y partida**

En `coinsMessage` de `PuzzleScreen.tsx`, sumar ` Recuperaste tu racha.` si corresponde. En `GameScreen.tsx`, `end(r, quit = false)`; pasar `quit = true` en rendirse y abandonar; llamar a `finishGame` con `gameCountsForStreak(quit, chess.history().length)`; guardar `streakRecovered` en `Finished` y mostrar el mismo texto en el panel. Al abandonar se sale sin mensaje, como pide el diseño.

- [ ] **Step 5: Verificar**

Run: `npm test`, `npx tsc --noEmit`, `npx expo lint`. Expected: pasan.

- [ ] **Step 6: Commit**

Commit «La racha usa las nuevas reglas en lecciones, puzzles y partidas».

### Task 3: Tarjeta de recuperación en Aprender

**Files:**
- Create: `src/components/RecoveryCard.tsx`
- Modify: `src/screens/HomeScreen.tsx`

**Interfaces:**
- Consumes: `streakStatusNow`, `StreakStatus`.
- Produces: `RecoveryCard({ days, done }: { days: number; done: Record<StreakAction, boolean> })`

- [ ] **Step 1: Crear `RecoveryCard`**

Texto «Recupera tu racha de {days} días hoy» y tres casillas en este orden: Puzzle, Lección, Bot. Cada una muestra ✓ al cumplirse y tiene `accessibilityLabel`, por ejemplo «Puzzle: hecho» o «Puzzle: pendiente». Usar `colors`, `fonts`, `radius` y `space`, con el aspecto de tarjeta de `ProfileScreen`.

- [ ] **Step 2: Mostrarla en `HomeScreen`**

Debajo de `statsRow`, solo si `kind === 'recovering'`.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit`, `npx expo lint`. Expected: pasan.

- [ ] **Step 4: Commit**

Commit «Tarjeta de recuperación de racha en Aprender».

### Task 4: Avisos que dependen de la racha

**Files:**
- Create: `src/settings/reminderPlan.ts`, `src/settings/useReminderSync.ts`
- Test: `src/settings/reminderPlan.test.ts`
- Modify: `src/settings/reminders.ts`, `src/screens/SettingsScreen.tsx`, `src/app/_layout.tsx`

**Interfaces:**
- Consumes: `Streak`, `streakStatus`, `todayKey`.
- Produces:
  - `type PlannedReminder = { date: Date; title: string; body: string }`
  - `planReminders(s: Streak, hour: number, now: Date): PlannedReminder[]`
  - `ensureReminderPermission(): Promise<boolean>`
  - `syncReminders(s: Streak, hour: number): Promise<void>`
  - `cancelDailyReminder(): Promise<void>` (ya existe)
  - `useReminderSync(): void`

- [ ] **Step 1: Escribir las pruebas**

`now` fijo: `new Date(2026, 9, 30, 10, 0)`, hora del aviso 19. Helper: `const streak = (current, lastActiveDate) => ({ current, best: current, lastActiveDate })`.

```ts
test('programa 7 días, uno por día, a la hora elegida', () => {
  const r = planReminders(streak(0, null), 19, now);
  assert.equal(r.length, 7);
  assert.equal(new Set(r.map((x) => x.date.getDate())).size, 7);
  assert.ok(r.every((x) => x.date.getHours() === 19));
});
test('si hoy ya practicó, el primer aviso es mañana', () => {
  assert.equal(planReminders(streak(5, '2026-10-30'), 19, now)[0].date.getDate(), 31);
});
test('racha en juego', () => {
  const r = planReminders(streak(5, '2026-10-29'), 19, now);
  assert.equal(r[0].title, 'Tu racha de 5 días sigue en juego');
  assert.equal(r[0].body, 'Una lección, un puzzle o una partida alcanza para mantenerla.');
});
test('día de recuperación, aun con una acción hecha', () => {
  const s = { ...streak(5, '2026-10-28'), actions: { date: '2026-10-30', lesson: true, puzzle: false, bot: false } };
  const r = planReminders(s, 19, now);
  assert.equal(r[0].date.getDate(), 30);
  assert.equal(r[0].title, 'Todavía puedes recuperar tu racha');
  assert.equal(r[0].body, 'Resuelve un puzzle, haz una lección y juega contra un bot hoy.');
});
test('sin racha', () => {
  const r = planReminders(streak(0, null), 19, now);
  assert.equal(r[0].title, 'Hora de practicar ajedrez');
  assert.equal(r[0].body, 'Una lección o un puzzle corto alcanza para empezar.');
});
test('racha de 1 no usa el texto de racha en juego', () => {
  assert.equal(planReminders(streak(1, '2026-10-29'), 19, now)[0].title, 'Hora de practicar ajedrez');
});
test('con la hora ya pasada, nada para el pasado', () => {
  const tarde = new Date(2026, 9, 30, 20, 0);
  assert.ok(planReminders(streak(0, null), 19, tarde).every((x) => x.date > tarde));
});
```

- [ ] **Step 2: Ejecutar las pruebas y ver que fallan**

Run: `npm test`. Expected: FAIL, no existe `./reminderPlan`.

- [ ] **Step 3: Implementar `planReminders`**

Recorrer hoy y los 6 días siguientes a `hour`:00. Saltear fechas `<= now`. Calcular `streakStatus` para cada día, sin suponer práctica futura: `safe` no genera aviso; `recovering` usa el texto de recuperación; `active` con `days >= 2` usa racha en juego; el resto usa el texto general. Días con hora ya pasada no se reemplazan por otra fecha, así que el total puede ser 6.

- [ ] **Step 4: Cambiar `reminders.ts`**

Reemplazar `scheduleDailyReminder` por `ensureReminderPermission` (canal + permiso, igual que hoy) y `syncReminders`. `syncReminders` cancela todo; si `getPermissionsAsync` no da permiso, termina; si lo da, asegura el canal y programa cada aviso con `{ type: SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID }`. El cancelar inicial también borra el aviso diario de versiones anteriores.

- [ ] **Step 5: Crear `useReminderSync` y usarlo**

Efecto que, si `settings.reminder.enabled`, llama a `syncReminders(progress.streak, settings.reminder.hour)` y atrapa errores. Se ejecuta al cambiar `progress.streak`, `enabled` u `hour`, y con `AppState` en `active`. Usarlo dentro de `AppStack`, solo con `ready` en true.

En `SettingsScreen.setReminder`, reemplazar `scheduleDailyReminder(hour)` por `ensureReminderPermission()`. El hook programa los avisos al cambiar el ajuste.

- [ ] **Step 6: Verificar**

Run: `npm test`, `npx tsc --noEmit`, `npx expo lint`. Expected: pasan.

- [ ] **Step 7: Commit**

Commit «Los recordatorios dependen del estado de la racha».

### Task 5: Oferta del recordatorio, documentación y prueba final

**Files:**
- Modify: `src/settings/SettingsContext.tsx`, `src/app/resultado.tsx`, `src/screens/LessonResultScreen.tsx`
- Modify: `CLAUDE.md`, `docs/mapa-de-pantallas.md`

**Interfaces:**
- Consumes: `ensureReminderPermission`, `useSettings`.
- Produces: `Settings.reminderOffered: boolean` (por defecto `false`); prop `reminderOffer?: { onAccept: () => void; onDecline: () => void }` en `LessonResultScreen`.

- [ ] **Step 1: Agregar el ajuste y la tarjeta**

Tarjeta en `LessonResultScreen` con «¿Quieres que te recuerde practicar?» y los botones «Sí, a las 19:00» y «Ahora no».

- [ ] **Step 2: Decidir cuándo se ofrece en `resultado.tsx`**

Pasar `reminderOffer` solo si `params.modo !== 'repaso'`, `!settings.reminderOffered` y `!settings.reminder.enabled`.

«Ahora no»: `update({ reminderOffered: true })`. «Sí»: con permiso, `update({ reminderOffered: true, reminder: { enabled: true, hour: 19 } })`; sin permiso, `update({ reminderOffered: true })` y el mismo `Alert` de `SettingsScreen` («Sin permiso para avisarte»).

- [ ] **Step 3: Actualizar la documentación**

En `CLAUDE.md`: reglas de la racha, `npm test` y los módulos nuevos. En `docs/mapa-de-pantallas.md`: la tarjeta de recuperación, la oferta y el recordatorio.

- [ ] **Step 4: Verificar**

Run: `npm test`, `npx tsc --noEmit`, `npx expo lint`. Expected: pasan.

- [ ] **Step 5: Commit**

Commit «Oferta del recordatorio al terminar una lección y documentación».

- [ ] **Step 6: Prueba en el celular con el usuario**

Con `npx expo start -c`: terminar una lección y aceptar la oferta; adelantar la fecha del teléfono dos días y ver la tarjeta; completar las tres acciones y ver el mensaje; comprobar que llega un aviso a la hora elegida.
