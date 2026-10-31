# Personajes: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que los 10 bots enseñen las lecciones con caras que cambian y escriban las notificaciones.

**Architecture:** Un archivo de datos asigna cada lección a un bot, y `bots.json` suma las voces. Un proveedor de contexto en `LessonPlayer` da a cada paso el profesor y su expresión, y `TeacherBubble` los muestra. Las imágenes se registran en un archivo generado, porque Metro falla con un `require` de un archivo inexistente: sin imágenes, el mapa queda vacío y se ve el avatar actual.

**Tech Stack:** Expo Router, React Native, TypeScript, `tsx` + `node:test`; `sharp` solo para desarrollo.

**Spec:** `docs/superpowers/specs/2026-10-30-personajes-design.md`

## Global Constraints

- Trabajar en la rama `personajes`, que parte de `racha-notificaciones`. Git solo desde Git Bash.
- Textos en español, sin exclamaciones en mensajes del sistema ni en las frases nuevas.
- El tablero sigue arriba, en la misma posición y con el mismo tamaño.
- No cambiar el contenido de ajedrez de las lecciones ni agregar pasos.
- `docs/bots.json` y `src/data/bots.json` deben quedar iguales.
- Sin subir `version` de `Progress` y sin cambiar claves de AsyncStorage.
- `sharp` va en `devDependencies` y ningún archivo de `src/` lo importa.
- `npm test`, `npx tsc --noEmit` y `npx expo lint` sin errores nuevos al cerrar cada tarea. Los 4 avisos de lint son conocidos.
- Cada commit termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- Una lección abierta con un id desconocido: usa a Don Ramiro y no falla.
- Una lección retomada a mitad de camino: no repite la bienvenida.
- Un bot con solo algunas expresiones: esas se ven, y las demás usan su avatar.
- Texto largo con letra grande en un teléfono chico: el globo crece y se desplaza con la página, sin recortar nada.
- Fecha muy lejana o cambio de año: la rotación de bots siempre da un bot válido.

---

### Task 1: Profesores y voces

**Files:**
- Create: `src/data/teachers.ts`
- Test: `src/data/teachers.test.ts`
- Modify: `docs/bots.json`, `src/data/bots.json`, `src/data/bots.ts`, `docs/bots.md`

**Interfaces:**
- Produces:
  - `Bot.teaching: { welcome: string[]; close: string[]; reminder: { risk: string; recovery: string; general: string } }`
  - `teacherForLesson(lessonId: string): Bot`
  - `pickPhrase(list: string[], previous?: string, random?: () => number): string`

- [ ] **Step 1: Escribir las pruebas**

```ts
test('cada lección tiene un profesor conocido', () => {
  for (const l of [...units, ...openings].flatMap((g) => g.lessons)) assert.ok(teacherForLessonOrNull(l.id), l.id);
});
test('los 10 bots enseñan', () => {
  const ids = new Set([...units, ...openings].flatMap((g) => g.lessons).map((l) => teacherForLesson(l.id).id));
  assert.equal(ids.size, 10);
});
test('asignaciones de ejemplo', () => {
  assert.equal(teacherOfTitle('La horquilla'), 'sofia');
  assert.equal(teacherOfTitle('Casillas débiles y puestos avanzados'), 'bruno');
  assert.equal(teacherOfTitle('Repaso final'), 'ada');
  assert.equal(teacherOfCourse('caro-kann'), 'bruno');
});
test('lección desconocida usa a Don Ramiro', () => {
  assert.equal(teacherForLesson('no-existe').id, 'ramiro');
});
test('voces completas y sin exclamaciones', () => {
  for (const b of bots) {
    assert.equal(b.teaching.welcome.length, 3);
    assert.equal(b.teaching.close.length, 3);
    assert.ok(b.teaching.reminder.risk.includes('{n}'));
    assert.ok(!JSON.stringify(b.teaching).includes('!'));
  }
});
test('pickPhrase no repite la anterior', () => {
  assert.equal(pickPhrase(['a', 'b'], 'a', () => 0), 'b');
});
```

`teacherForLessonOrNull`, `teacherOfTitle` y `teacherOfCourse` son helpers del archivo de prueba o exportados solo para probar, según convenga.

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npm test`. Expected: FAIL, no existe `./teachers`.

- [ ] **Step 3: Implementar `teachers.ts`**

Copiar las dos tablas del diseño: un mapa de id de lección a id de bot para la ruta y un mapa de id de curso a bot para aperturas. La ruta se identifica por los ids reales de los JSON de unidad. Un curso cubre todas sus lecciones.

- [ ] **Step 4: Escribir las frases en `bots.json`**

Agregar `teaching` a los 10 bots según la personalidad de `docs/bots.md`. Las de `recovery` deben nombrar puzzle, lección y bot. `docs/bots.json` y la copia quedan iguales. Documentar `teaching` en `docs/bots.md`.

- [ ] **Step 5: Ejecutar y ver que pasan**

Run: `npm test`, `npx tsc --noEmit`. Expected: PASS.

- [ ] **Step 6: Commit**

Commit «Profesores por lección y voces de los bots».

### Task 2: Expresiones y script de imágenes

**Files:**
- Create: `scripts/build-avatars.js`, `src/components/botFace.ts`, `src/components/botExpressions.generated.ts`
- Test: `src/components/botFace.test.ts`
- Modify: `src/components/BotAvatar.tsx`, `package.json`

**Interfaces:**
- Produces:
  - `type BotExpression = 'explica' | 'piensa' | 'acierto' | 'pista'`
  - `expressionSource<T>(map: Partial<Record<string, Partial<Record<BotExpression, T>>>>, botId: string, expression: BotExpression | undefined, fallback: T): T`
  - Export `BOT_EXPRESSIONS` en `botExpressions.generated.ts`
  - `BotAvatar({ bot, size, expression }: { bot: Bot; size?: number; expression?: BotExpression })`

- [ ] **Step 1: Escribir las pruebas**

```ts
const map = { pipo: { explica: 'e' } };
test('usa la expresión si existe', () => assert.equal(expressionSource(map, 'pipo', 'explica', 'a'), 'e'));
test('sin esa expresión usa el avatar', () => assert.equal(expressionSource(map, 'pipo', 'pista', 'a'), 'a'));
test('sin bot usa el avatar', () => assert.equal(expressionSource(map, 'ada', 'explica', 'a'), 'a'));
test('sin expresión usa el avatar', () => assert.equal(expressionSource(map, 'pipo', undefined, 'a'), 'a'));
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npm test`. Expected: FAIL, no existe `./botFace`.

- [ ] **Step 3: Implementar `botFace.ts` y usarlo en `BotAvatar`**

`botFace.ts` no importa React Native. La expresión conserva la `scale` del bot en `AVATARS`.

- [ ] **Step 4: Crear `scripts/build-avatars.js`**

Instalar `sharp` con `npm install --save-dev sharp`. Agregar `"build:avatars": "node scripts/build-avatars.js"`.

Lee `assets/fuente/expresiones/<id>-<expresion>.{png,webp}`, escribe `assets/bots/expresiones/<id>-<expresion>.webp` a 256 × 256, calidad 80, y regenera `botExpressions.generated.ts`, con un aviso de archivo generado como `stockfishAssets.ts`. Los nombres que no correspondan a un bot o a una expresión detienen el script con un error claro.

- [ ] **Step 5: Verificar**

Run: `npm run build:avatars`. Expected: sin imágenes, genera `BOT_EXPRESSIONS = {}`. Después `npm test`, `npx tsc --noEmit` y `npx expo lint`.

- [ ] **Step 6: Commit**

Commit «Expresiones de los bots con avatar de respaldo».

### Task 3: El profesor en la lección

**Files:**
- Create: `src/lesson/TeacherContext.tsx`, `src/lesson/TeacherBubble.tsx`, `src/lesson/teacherExpression.ts`
- Test: `src/lesson/teacherExpression.test.ts`
- Modify: `src/lesson/LessonPlayer.tsx`, los 6 archivos de `src/lesson/steps/`, `src/app/resultado.tsx`, `src/screens/LessonResultScreen.tsx`

**Interfaces:**
- Consumes: `teacherForLesson`, `pickPhrase`, `BotAvatar`, `BotExpression`.
- Produces:
  - `teacherExpression(stepType: Step['type'], status: 'idle' | 'correct' | 'wrong', guided: boolean): BotExpression`
  - `useTeacher(): { bot: Bot; expression: BotExpression; welcome?: string }`
  - `TeacherBubble({ children }: { children: string })`
  - prop `teacher?: { bot: Bot; phrase: string }` en `LessonResultScreen`

- [ ] **Step 1: Escribir las pruebas**

```ts
test('explain explica', () => assert.equal(teacherExpression('explain', 'idle', false), 'explica'));
test('esperando piensa', () => assert.equal(teacherExpression('move', 'idle', false), 'piensa'));
test('línea guiada explica', () => assert.equal(teacherExpression('line', 'idle', true), 'explica'));
test('acierto gana', () => assert.equal(teacherExpression('quiz', 'correct', false), 'acierto'));
test('error da pista', () => assert.equal(teacherExpression('practice', 'wrong', false), 'pista'));
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npm test`. Expected: FAIL, no existe `./teacherExpression`.

- [ ] **Step 3: Implementar la expresión y el contexto**

`LessonPlayer` recibe el `lessonId` real como prop, porque en un repaso `lesson.id` es igual al de la lección. El contexto envuelve el `ScrollView`. Paso `line` guiado: `guided` sale de `step.mode === 'guided'`.

`welcome` solo existe si la lección empezó sin avance guardado y `index === 0`.

- [ ] **Step 4: Implementar `TeacherBubble` y usarlo en los pasos**

Cara de 52 px y globo con `colors.surfaceRaised`, como la opción A del boceto. Sobre el globo, si hay `welcome`, se ve el nombre del bot y la frase. Reemplazar el `Text` de `step.text` o `step.prompt` en `ExplainStep`, `MoveStep`, `QuizStep`, `SelectSquaresStep`, `LineStep` y `PracticeStep`. Conservar `FadeIn` donde existe. El grupo es `accessible` con etiqueta `{nombre}: {texto}`.

- [ ] **Step 5: Resultado**

`resultado.tsx` calcula una sola vez, con `useState` diferido, `{ bot: teacherForLesson(params.id), phrase: pickPhrase(bot.teaching.close) }`. `LessonResultScreen` muestra `BotAvatar` con `acierto` y la frase. La frase cambia solo al abrir otra vez.

- [ ] **Step 6: Verificar**

Run: `npm test`, `npx tsc --noEmit`, `npx expo lint`. Expected: pasan.

- [ ] **Step 7: Commit**

Commit «Los bots explican las lecciones».

### Task 4: Los bots escriben los avisos

**Files:**
- Modify: `src/settings/reminderPlan.ts`, `src/settings/reminderPlan.test.ts`

**Interfaces:**
- Consumes: `bots`, `Bot.teaching.reminder`.
- Produces: `reminderBot(date: Date): Bot`. `planReminders` conserva su firma.

- [ ] **Step 1: Cambiar las pruebas**

Mantener las de fechas. Reemplazar las de textos por:

```ts
test('escribe un bot distinto cada día y todos aparecen', () => {
  const ids = Array.from({ length: 10 }, (_, i) => reminderBot(new Date(2026, 9, 30 + i)).id);
  assert.equal(new Set(ids).size, 10);
});
test('la rotación funciona en otro año', () => {
  assert.ok(bots.includes(reminderBot(new Date(2031, 0, 1))));
});
test('racha en juego: título con el bot y días en el cuerpo', () => {
  const [r] = planReminders(streak(5, '2026-10-29'), 19, now);
  assert.equal(r.title, reminderBot(r.date).name);
  assert.ok(r.body.includes('5'));
  assert.ok(!r.body.includes('{n}'));
});
test('recuperación nombra las tres acciones', () => {
  const [r] = planReminders(streak(5, '2026-10-28'), 19, now);
  assert.match(r.body, /puzzle/i);
  assert.match(r.body, /lección/i);
  assert.match(r.body, /bot/i);
});
test('sin racha usa la frase general del bot', () => {
  const [r] = planReminders(streak(0, null), 19, now);
  assert.equal(r.body, reminderBot(r.date).teaching.reminder.general);
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npm test`. Expected: FAIL.

- [ ] **Step 3: Implementar**

`reminderBot` usa la cantidad de días desde el 1 de enero de 1970, calculada con `Date.UTC` sobre año, mes y día locales, módulo `bots.length`. `planReminders` reemplaza los títulos y cuerpos fijos, sin cambiar qué días hay aviso. `{n}` se reemplaza por los días.

- [ ] **Step 4: Verificar**

Run: `npm test`, `npx tsc --noEmit`, `npx expo lint`. Expected: pasan.

- [ ] **Step 5: Commit**

Commit «Los bots escriben las notificaciones».

### Task 5: Créditos, documentación y prueba final

**Files:**
- Modify: `src/screens/CreditsScreen.tsx`, `CLAUDE.md`, `docs/mapa-de-pantallas.md`, `docs/design.md`

- [ ] **Step 1: Actualizar Créditos**

Sumar las expresiones a la mención de los avatares hechos con ChatGPT.

- [ ] **Step 2: Actualizar la documentación**

`CLAUDE.md`: profesores (`src/data/teachers.ts`), expresiones, `npm run build:avatars` y dónde dejar las imágenes (`assets/fuente/expresiones/`). `docs/mapa-de-pantallas.md`: el profesor en la lección y el resultado. `docs/design.md`: el globo de diálogo.

- [ ] **Step 3: Verificar**

Run: `npm test`, `npx tsc --noEmit`, `npx expo lint`. Expected: pasan.

- [ ] **Step 4: Commit**

Commit «Créditos y documentación de los personajes».

- [ ] **Step 5: Prueba en el celular con el usuario**

Con `npx expo start -c`: abrir un paso de cada tipo, fallar y acertar para ver las expresiones, retomar una lección, probar con letra grande y comprobar el peso de la app.
