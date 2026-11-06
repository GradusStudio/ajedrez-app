# Comentarios tácticos en el análisis de partida: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada jugada del análisis de partida lleve una explicación concreta y verificada (táctica encontrada, táctica permitida, mate en N o plan de la jugada) en vez de una frase genérica.

**Architecture:** Dos detectores puros nuevos sobre chess.js (`tactics.ts`, `plans.ts`) alimentan `Facts` desde `factsFor`/`ratePly` (`build.ts`). `coachExplanation` (`coachText.ts`) convierte esos hechos en líneas con plantillas por idioma, con prioridad y tope de tres líneas. El motor solo aporta la mejor respuesta (`replyUci`) y el mate (`score`).

**Tech Stack:** TypeScript, chess.js 1.x, `tsx --test` (`npm test`), JSON de textos por idioma, Ollama (gemma4) para traducir.

**Spec:** `docs/superpowers/specs/2026-11-05-comentarios-tacticos-design.md`

## Global Constraints

- Lógica en `src/review/` sin React Native; se prueba con `npm test` (`tsx --test "src/**/*.test.ts"`).
- Toda afirmación sale de comprobarla en el tablero; si no hay certeza, no se dice. Nunca inventar tácticas.
- Los hechos nuevos se **suman** a `did` / `allows` / `missed`; no los reemplazan ni cambian su comportamiento.
- Máximo **3 líneas** de explicación por jugada; prioridad: mate > táctica > captura > jaque > plan.
- «Permite» solo mira la mejor respuesta inmediata (`replyUci`) y solo en imprecisión, error y error grave. Sin `replyUci`, no se dice nada.
- Mate en N: jugadas completas del bando que da el mate (UCI `mate n`; `score` = ±(10000 − n)).
- Cada texto existe en los cinco idiomas (es, en, de, it, fr) con la misma forma y los mismos marcadores `{...}` (`coachText.test.ts` lo exige). Nombres de tácticas iguales a los de las lecciones (`puzzleTheme.*` en `src/i18n/<lang>.ts`, glosarios en `docs/traducciones/`).
- Textos nuevos del comentarista (antislop, modo durante, R-02/R-16): sin raya larga (—) en ningún idioma, sin muletillas de relleno ni palabras de marketing; cada línea nombra piezas, casillas o la táctica concreta y no se repite idéntica en jugadas seguidas (dar al menos 2 variantes por táctica encontrada y por táctica permitida, elegidas con la misma semilla que `coachVoice`).
- Nada de texto español fijo en pantallas (`noHardcoded.test.ts`). No se rediseña `GameReviewScreen`.
- Git solo desde Git Bash. Un commit al terminar cada tarea, con `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` al final del mensaje.

## Review Focus

- Jugada de coronación (UCI de 5 letras, `e7e8q`) y captura al paso o enroque: los detectores no deben fallar ni dar falsos positivos.
- Posición terminada o `replyUci` vacío (mate, tablas): no se menciona nada de lo que «permite» y no se lanza error.
- Jugadas propias del usuario fuera de la partida (variantes en `GameReviewScreen`, que también pasan por `ratePly`): deben producir hechos igual que las de la partida.
- Orquilla con objetivo defendido por una pieza de menor valor (no vale): no debe contarse.
- Mate de las negras (`score` negativo) y mate propio frente a mate permitido: N y bando correctos.

---

## File Structure

- Create `src/review/tactics.ts`: tipos `TacticKind`, `Tactic`, `detectTactics`, `mateIn`.
- Create `src/review/plans.ts`: tipos `PlanKind`, `Plan`, `planFor`.
- Create `src/review/tactics.test.ts`, `src/review/plans.test.ts`.
- Modify `src/review/types.ts`: `Facts` suma `found`, `allowsTactic`, `mateIn`, `plan`.
- Modify `src/review/build.ts`: `factsFor` y `ratePly`.
- Modify `src/review/coachText.ts` y `src/review/coach/{es,en,de,it,fr}.json`.
- Modify `src/review/review.test.ts`, `src/review/coachText.test.ts`.
- Modify `CLAUDE.md` (párrafo «Análisis de partida»).

---

### Task 1: Detector de tácticas

**Files:**
- Create: `src/review/tactics.ts`
- Test: `src/review/tactics.test.ts`

**Interfaces:**
- Consumes: `PieceKind` de `./types`.
- Produces:
  - `type TacticKind = 'fork' | 'pin' | 'skewer' | 'discovered' | 'doubleCheck' | 'hanging' | 'backRank'`
  - `type Tactic = { kind: TacticKind; attacker: PieceKind; targets: PieceKind[] }` (`attacker` = pieza que ejerce la táctica; en `discovered`, la que quedó descubierta)
  - `detectTactics(fenBefore: string, uci: string): Tactic[]`: tácticas que crea esa jugada para quien la juega; `[]` si no es legal o no hay ninguna.
  - `mateIn(score: number): { by: 'w' | 'b'; n: number } | null`: null si `score` no es mate.

- [ ] **Step 1: Write the failing tests** en `src/review/tactics.test.ts` (`node:test` + `assert/strict`). Posiciones verificadas a mano:

```ts
const kinds = (fen: string, uci: string) => detectTactics(fen, uci).map((t) => t.kind);

test('orquilla: Cc6+ ataca rey y torre', () => {
  const t = detectTactics('1r6/4k3/8/8/3N4/8/8/6K1 w - - 0 1', 'd4c6');
  assert.ok(t.some((x) => x.kind === 'fork' && x.attacker === 'n' && x.targets.includes('k') && x.targets.includes('r')));
});
test('clavada: Ab5 clava el caballo de d7 al rey', () => {
  assert.ok(kinds('4k3/3n4/8/8/8/8/8/4KB2 w - - 0 1', 'f1b5').includes('pin'));
});
test('enfilada: Th8+ con la dama detrás del rey', () => {
  assert.ok(kinds('q3k3/8/8/8/8/8/8/4K2R w - - 0 1', 'h1h8').includes('skewer'));
});
test('ataque descubierto: Ad5 descubre la torre de e1 contra la dama de e7', () => {
  assert.ok(kinds('4k3/4q2p/8/8/4B3/8/8/4R1K1 w - - 0 1', 'e4d5').includes('discovered'));
});
test('jaque doble: Cf6+ con la torre detrás', () => {
  assert.ok(kinds('4k3/8/8/8/4N3/8/8/4R1K1 w - - 0 1', 'e4f6').includes('doubleCheck'));
});
test('pieza colgada: Txd5 captura una dama sin defensa', () => {
  assert.ok(kinds('4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1', 'd1d5').includes('hanging'));
});
test('mate del pasillo: Ta8#', () => {
  assert.ok(kinds('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1', 'a1a8').includes('backRank'));
});
test('una jugada tranquila no devuelve tácticas, y una ilegal tampoco', () => {
  assert.deepEqual(detectTactics('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'e2e4'), []);
  assert.deepEqual(detectTactics('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'e2e5'), []);
});
test('coronación (5 letras) y enroque no rompen el detector', () => {
  assert.doesNotThrow(() => detectTactics('4k3/P7/8/8/8/8/8/4K3 w - - 0 1', 'a7a8q'));
  assert.doesNotThrow(() => detectTactics('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'e1g1'));
});
test('una orquilla cuyo atacante puede ser capturado gratis por el rival no cuenta', () => {
  // El implementador arma una posición donde el caballo ataca dos piezas pero un peón o pieza rival lo captura,
  // la verifica a mano y aserta: assert.ok(!kinds(fen, uci).includes('fork'));
});
test('mateIn lee el bando y N', () => {
  assert.deepEqual(mateIn(9997), { by: 'w', n: 3 });
  assert.deepEqual(mateIn(-9998), { by: 'b', n: 2 });
  assert.equal(mateIn(120), null);
});
```

(El caso de la orquilla que no cuenta es obligatorio: debe terminar con una posición propia verificada y una aserción real, no quedar como comentario.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx tsx --test src/review/tactics.test.ts`
Expected: FAIL (`tactics` no existe).

- [ ] **Step 3: Implement `detectTactics` y `mateIn` en `src/review/tactics.ts`.** Aplicar la jugada con chess.js sobre una copia; comparar casillas atacadas por el bando que mueve antes y después. Reglas: `fork` = la pieza movida ataca ≥2 piezas rivales y alguna vale más que ella o está sin defensa (y ningún objetivo es capturable gratis por el rival); `pin`/`skewer` = deslizante (alfil, torre, dama) con una pieza rival en línea y otra de más valor (clavada) o el rey/pieza de más valor delante (enfilada) detrás; `discovered` = un deslizante propio que no es la pieza movida pasó a atacar una pieza rival de valor ≥ 3 (o jaque) y antes no la atacaba; `doubleCheck` = el rey rival recibe jaque de dos atacantes; `hanging` = la jugada captura una pieza de valor ≥ 3 sin defensores; `backRank` = la jugada da mate y el rey rival está en su fila de fondo con peones propios tapando la huida. `mateIn`: `Math.abs(score) >= 9000` → `n = 10000 - Math.abs(score)`, `by = score > 0 ? 'w' : 'b'`.

- [ ] **Step 4: Run to verify it passes**

Run: `npx tsx --test src/review/tactics.test.ts`
Expected: PASS (todos).

- [ ] **Step 5: Commit** (incluye el documento de diseño y este plan)

```bash
git add src/review/tactics.ts src/review/tactics.test.ts docs/superpowers
git commit -m "feat(review): detector de tácticas (orquilla, clavada, enfilada, descubierto, jaque doble, colgada, pasillo) y mate en N"
```

---

### Task 2: Detector de planes

**Files:**
- Create: `src/review/plans.ts`
- Test: `src/review/plans.test.ts`

**Interfaces:**
- Consumes: `PieceKind` de `./types`.
- Produces:
  - `type PlanKind = 'develop' | 'center' | 'rookFile' | 'pawnBreak' | 'pawnAdvance' | 'trade' | 'retreat' | 'kingActive' | 'plain'`
  - `type Plan = { kind: PlanKind; piece: PieceKind; from: string; to: string }`
  - `planFor(fenBefore: string, uci: string): Plan`: **siempre** devuelve un plan (`plain` es el último recurso: «la pieza va a la casilla»).

- [ ] **Step 1: Write the failing tests** (`src/review/plans.test.ts`), desde la posición inicial `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`:

```ts
test('g1f3 desarrolla el caballo', () => assert.equal(planFor(START, 'g1f3').kind, 'develop'));
test('e2e4 ocupa el centro', () => assert.equal(planFor(START, 'e2e4').kind, 'center'));
test('a2a3 es un avance de peón', () => assert.equal(planFor(START, 'a2a3').kind, 'pawnAdvance'));
test('torre a columna abierta', () => assert.equal(planFor('4k3/8/8/8/8/8/P7/R3K3 w - - 0 1', 'a1d1').kind, 'rookFile'));
test('retirada de una pieza ya desarrollada', () => {
  // El implementador arma una posición con una retirada clara (p. ej. un alfil que vuelve a su fila de origen),
  // la verifica y aserta: assert.equal(planFor(fen, uci).kind, 'retreat');
});
test('rey activo en el final', () => assert.equal(planFor('8/8/4k3/8/8/4K3/8/8 w - - 0 1', 'e3e4').kind, 'kingActive'));
test('una jugada sin plan reconocible cae a plain, con pieza y casillas', () => {
  const p = planFor('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'a1a2');
  assert.deepEqual([p.kind, p.piece, p.from, p.to], ['plain', 'r', 'a1', 'a2']);
});
test('una jugada ilegal no lanza error y da plain', () => assert.equal(planFor(START, 'e2e5').kind, 'plain'));
```

(El caso `retreat` también es obligatorio: posición propia verificada y aserción real.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx tsx --test src/review/plans.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `planFor` en `src/review/plans.ts`.** Orden de precedencia: `trade` (captura igual por igual) → `develop` (pieza menor sale de su fila inicial) → `center` (peón o pieza a d4/e4/d5/e5) → `rookFile` (torre a columna abierta o semiabierta) → `pawnBreak` (peón que ataca un peón rival) → `pawnAdvance` → `kingActive` (rey en finales, sin damas, se acerca al centro) → `retreat` (pieza menor retrocede hacia su lado) → `plain`.

- [ ] **Step 4: Run to verify it passes**

Run: `npx tsx --test src/review/plans.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/review/plans.ts src/review/plans.test.ts
git commit -m "feat(review): detector de planes de una jugada con último recurso verificado"
```

---

### Task 3: Hechos nuevos en `Facts`, `factsFor` y `ratePly`

**Files:**
- Modify: `src/review/types.ts` (`Facts`), `src/review/build.ts` (`factsFor` ~línea 36, llamada en `ratePly` ~línea 108)
- Test: `src/review/review.test.ts`

**Interfaces:**
- Consumes: `detectTactics`, `mateIn` (Tarea 1); `planFor`, `Plan` (Tarea 2).
- Produces, en `Facts` (todos opcionales):
  - `found?: Tactic[]` (tácticas que creó la jugada, máx. 2)
  - `allowsTactic?: { tactic: Tactic; san: string }` (táctica que crea la mejor respuesta del rival)
  - `mateIn?: { n: number; mover: boolean }` (`mover: true` = lo da quien jugó)
  - `plan?: Plan` (solo si no hay `did` ni `found`)
  - `factsFor(move, bestUci, replyUci, quality, scoreAfter?: number): Facts`: el 5.º parámetro es opcional para que las llamadas actuales sigan compilando.

- [ ] **Step 1: Write the failing tests** en `review.test.ts`:

```ts
test('factsFor: jugada buena que encuentra una orquilla trae found', () => {
  const move = mk('1r6/4k3/8/8/3N4/8/8/6K1 w - - 0 1', 'd4c6'); // helper con fenBefore/fenAfter y color
  const f = factsFor(move, 'd4c6', '', 'best');
  assert.equal(f.found?.[0].kind, 'fork');
});
test('factsFor: un error cuya mejor respuesta es una orquilla trae allowsTactic con su SAN', () => { /* posición de orquilla permitida; replyUci = la orquilla */ });
test('factsFor: sin replyUci no hay allowsTactic y no lanza error', () => {
  assert.equal(factsFor(move, 'd4c6', '', 'blunder').allowsTactic, undefined);
});
test('factsFor: mate en N con scoreAfter', () => {
  assert.deepEqual(factsFor(moveBlancas, best, '', 'best', 9996).mateIn, { n: 4, mover: true });
  assert.deepEqual(factsFor(moveBlancas, best, reply, 'blunder', -9997).mateIn, { n: 3, mover: false });
});
test('factsFor: toda jugada sin did ni found trae plan; con captura no', () => {
  assert.ok(factsFor(moveE4, '', '', 'best').plan);
  assert.equal(factsFor(moveConCaptura, '', '', 'best').plan, undefined);
});
test('factsFor conserva allows y missed existentes', () => { /* el caso ya cubierto sigue verde sin tocarlo */ });
```

Reglas del mate en N (a codificar en la implementación): con `scoreAfter` de mate para quien movió y calidad `best`/`excellent`/`book` → `{ n: k + 1, mover: true }` (k = `mateIn(scoreAfter).n`; k = 0 ya es `did.mate`); mate para el rival, con k ≥ 2 y calidad mala → `{ n: k, mover: false }` (con k = 1 ya lo cubre `allows.mate`).

- [ ] **Step 2: Run to verify it fails**

Run: `npx tsx --test src/review/review.test.ts`
Expected: FAIL en los casos nuevos.

- [ ] **Step 3: Implement.** Ampliar `Facts`. En `factsFor`: `found` = `detectTactics(move.fenBefore, move.uci)` (primeras 2) para cualquier calidad; `plan` = `planFor(...)` si no hay `facts.did` ni `found`; `allowsTactic` = primera de `detectTactics(move.fenAfter, replyUci)` solo si la calidad es mala y `replyUci` no está vacío; `mateIn` con las reglas de arriba. En `ratePly` pasar `after.score` como 5.º argumento.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS (todo el conjunto, incluidas las pruebas anteriores de la revisión).

- [ ] **Step 5: Commit**

```bash
git add src/review/types.ts src/review/build.ts src/review/review.test.ts
git commit -m "feat(review): hechos tácticos, mate en N y plan en cada jugada"
```

---

### Task 4: Textos y explicación (es y en)

**Files:**
- Modify: `src/review/coachText.ts` (`ExplKey`, `Texts`, `coachExplanation`), `src/review/coach/es.json`, `src/review/coach/en.json`
- Test: `src/review/coachText.test.ts`

**Interfaces:**
- Consumes: `Facts` ampliado (Tarea 3), `TacticKind`, `PlanKind`.
- Produces: `coachExplanation` con la misma firma, pero que además usa `facts.found`, `facts.allowsTactic`, `facts.mateIn` y `facts.plan`. Nuevas secciones del JSON:
  - `tact.found.you|opp.<TacticKind>` y `tact.allows.you|opp.<TacticKind>`: marcadores `{attacker}`, `{targets}`, `{san}`, `{move}`
  - `mateIn.foundYou|foundOpp|allowsYou|allowsOpp`: marcador `{n}`
  - `plan.<PlanKind>`: redacción neutra (sirve para el usuario y el rival): marcadores `{piece}`, `{from}`, `{to}`, `{move}`
  - `and`: conjunción para unir objetivos («y»), `pieceDef`: nombre con artículo definido por pieza («la torre»)

- [ ] **Step 1: Write the failing tests** en `coachText.test.ts`:

```ts
test('orquilla encontrada se explica con piezas reales', () => {
  const ex = coachExplanation({ lang: 'es', subject: 'you', quality: 'best', move: 'Nc6+', bestSan: 'Nc6+', fmt: (s) => s,
    facts: { found: [{ kind: 'fork', attacker: 'n', targets: ['k', 'r'] }] } });
  assert.ok(ex[0].includes('orquilla') && ex[0].includes('caballo') && ex[0].includes('torre'));
});
test('una táctica permitida nombra la jugada del rival', () => {
  const ex = coachExplanation({ lang: 'es', subject: 'you', quality: 'blunder', move: 'Qh5', bestSan: 'Nf3', fmt: (s) => s,
    facts: { allowsTactic: { tactic: { kind: 'fork', attacker: 'n', targets: ['q', 'r'] }, san: 'Nxe5' } } });
  assert.ok(ex.some((l) => l.includes('Nxe5') && l.includes('orquilla')));
});
test('mate en N permitido', () => { /* facts.mateIn {n:3, mover:false} → alguna línea incluye "3" */ });
test('jugada sin hechos tácticos ni did explica el plan', () => { /* facts.plan develop → una línea; nunca vacío */ });
test('tope de 3 líneas y prioridad: el mate gana a la captura y al plan', () => { /* varios hechos juntos → ex.length <= 3 y la primera es la del mate */ });
test('todos los idiomas rellenan todos los marcadores de lo nuevo', () => { /* recorre los TacticKind, PlanKind y mateIn en los 5 idiomas: sin '{' */ });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx tsx --test src/review/coachText.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement.** Extender `Texts` y `coachExplanation`: ordenar los candidatos por prioridad (mate → táctica encontrada → táctica permitida → `did` → `allows`/`missed` existentes → plan) y devolver los 3 primeros; unir `targets` con `and` y `pieces`. Escribir el texto en español (con los nombres de las lecciones: orquilla, clavada, enfilada, ataque descubierto, jaque doble, pieza colgada, mate del pasillo) y en inglés (fork, pin, skewer, discovered attack, double check, hanging piece, back-rank mate), con variantes `you` y `opp` en tácticas y mate en N. Ejemplos de redacción pedidos por el usuario: «Esa jugada habilita a tu rival a realizar una orquilla con {san}.», «¡Encontraste el ataque descubierto!», «Esa jugada habilita a tu rival a realizar un mate en {n}.». Para de, it y fr, copiar por ahora los textos en inglés (la Tarea 5 los traduce) para que el test de forma siga en verde.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/review/coachText.ts src/review/coachText.test.ts src/review/coach/es.json src/review/coach/en.json src/review/coach/de.json src/review/coach/it.json src/review/coach/fr.json
git commit -m "feat(review): explicaciones tácticas y de plan en el comentarista (es y en)"
```

---

### Task 5: Traducciones, documentación y verificación final

**Files:**
- Modify: `src/review/coach/de.json`, `it.json`, `fr.json`; `CLAUDE.md`

**Interfaces:**
- Consumes: textos nuevos de `es.json`/`en.json` (Tarea 4) y glosarios `docs/traducciones/<lang>.md`.
- Produces: los cinco idiomas con la misma forma y marcadores.

- [ ] **Step 1: Traducir con gemma4** (Ollama en `http://localhost:11434`, `POST /api/generate`, `"stream": false`, `"think": false`, cuerpo en UTF-8) solo las claves nuevas (`tact`, `mateIn`, `plan`, `and`, `pieceDef`) de `es.json` a de, it y fr, pasando el glosario de cada idioma para los nombres de las tácticas. Conservar los marcadores `{...}` intactos. Si Ollama no responde, traducir a mano y avisarlo.
- [ ] **Step 2: Run the whole suite**

Run: `npm test`
Expected: PASS (el test de forma confirma mismos marcadores en los cinco idiomas).

- [ ] **Step 3: Lint and types**

Run: `npx expo lint` y `npx tsc --noEmit`
Expected: 0 errores y 0 avisos (el proyecto está en 0 hoy).

- [ ] **Step 4: Probar con una partida real** (resultado a revisar por una persona): importar una partida de Lichess en el celular o un PGN de prueba, recorrer las jugadas y comprobar que ninguna queda con una frase genérica, que el texto cabe en el globo y que no hay tácticas falsas. Anotar en el informe cualquier jugada dudosa.
- [ ] **Step 5: Documentar y commit.** En el párrafo «Análisis de partida» de `CLAUDE.md` sumar una frase: los comentarios usan `tactics.ts` y `plans.ts` (orquilla, clavada, enfilada, descubierto, jaque doble, colgada, pasillo, mate en N, plan de la jugada), con tope de 3 líneas; traducciones de IA sin revisión de nativos.

```bash
git add src/review/coach CLAUDE.md
git commit -m "feat(review): traducciones de los comentarios tácticos y documentación"
```

---

## Self-review

- **Cobertura del diseño:** detector (T1), planes y último recurso (T2), «permite» con `replyUci`, mate en N, convivencia con `allows`/`missed` (T3), textos en cinco idiomas, prioridad y tope de 3 líneas (T4/T5), ambos bandos (variantes `you`/`opp` en T4), sin cambios de pantalla (nada en `GameReviewScreen`). Sin huecos.
- **Consistencia de tipos:** `Tactic`, `Plan`, `Facts.found/allowsTactic/mateIn/plan` y `factsFor(..., scoreAfter?)` se usan igual en las tareas 3 y 4.
- **Proporción:** el plan fija nombres, firmas, pruebas y reglas; los cuerpos los escribe quien implemente.
