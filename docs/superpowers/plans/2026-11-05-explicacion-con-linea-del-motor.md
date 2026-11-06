# Explicación con la línea del motor y en la voz del bot: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el análisis de partida explique cómo aprovechar un error del rival (o qué permitió el usuario) con la línea completa del motor, nombrando el concepto («eliminar al defensor») y con todo el texto dicho en la voz del bot elegido.

**Architecture:** `PositionEval` guarda la variante completa (`pv`). Un detector puro nuevo (`lines.ts`) reproduce la variante con chess.js y devuelve solo lo que el tablero prueba (eliminar al defensor, material neto). `factsFor` lo suma a `Facts`. `coachExplanation` compone un único párrafo con un marco de voz por estilo del bot, una escalera de prioridad y un tope de largo.

**Tech Stack:** TypeScript, chess.js 1.x, `tsx --test` (`npm test`), JSON de textos por idioma, Ollama (gemma4) para traducir.

**Spec:** `docs/superpowers/specs/2026-11-05-explicacion-con-linea-del-motor-design.md` (continúa `2026-11-05-comentarios-tacticos-design.md`, ya implementado en esta rama).

## Global Constraints

- Lógica en `src/review/` sin React Native; se prueba con `npm test` (`tsx --test "src/**/*.test.ts"`). Hoy son 211 pruebas y deben seguir en verde (las que cambien de significado se reescriben, nunca se borran sin reemplazo).
- Toda afirmación sale de reproducir la variante con chess.js y comprobarla; sin `pv`, variante ilegal o truncada que no pruebe la ganancia, no se dice nada nuevo. Nunca inventar.
- `PositionEval.pv` es **opcional**; sin ella el comportamiento anterior no cambia (salvo orden y plan).
- «Eliminar al defensor» solo si: la 1.ª jugada captura una pieza que defendía a otra (pieza o peón, nunca el rey) en la posición previa; la 3.ª jugada captura ese objetivo en su casilla; el número de defensores del objetivo baja tras la 2.ª jugada; y la ganancia neta de material de las 3 jugadas es de al menos 1 punto.
- Material neto: sobre como mucho las 4 primeras jugadas; una captura final de quien gana solo se cuenta si esa pieza no puede ser capturada gratis después (sin defensa, o por una pieza de menos valor); si puede, se descuenta. Frases de material solo si el neto es de al menos 2 puntos.
- Escalera (una cosa destacada primero, como mucho 2 hechos en el texto): mate > eliminar al defensor > otras tácticas (`found`, `allowsTactic`) > material de la línea > lo que hizo la jugada (`did`) > `allows`/`missed` existentes > plan o intención.
- «Aprovechar» y «qué permite» usan las mismas jugadas que hoy tienen `allows`/`missed` (imprecisión, error, error grave); sin umbrales nuevos.
- Voz: tres situaciones por estilo (`exploit`: el rival se equivocó; `allows`: el usuario se equivocó; `good`: jugada sin problema). Los 4 estilos son `tranquilo`, `equilibrado`, `posicional`, `agresivo` (ya están en `bots.json`). Las frases `opp` pasan a tener estilo; las 6 antiguas se eliminan.
- En jugadas malas el plan se dice como intención solo para `develop`, `center`, `rookFile`, `pawnBreak`, `pawnAdvance`, `kingActive` y `retreat`; `trade` y `plain` se omiten. En jugadas buenas se mantiene el plan positivo.
- Largo: texto de la explicación de como mucho 220 caracteres (constante exportada `EXPLANATION_CAP`); primero se acorta la secuencia (3, 2, 1 jugadas), después se quita lo de menor prioridad; el concepto nunca se quita. Se comprueba con pruebas en es y en.
- Cada texto existe en es, en, de, it y fr con la misma forma y los mismos marcadores `{...}` (la prueba de `coachText.test.ts` lo exige). Nombre del concepto: el de la app (`puzzleTheme.capturingDefender` en `src/i18n/<idioma>.ts`; en español «Eliminar al defensor»).
- Antislop (modo durante): sin raya larga (—) en ningún texto ni comentario, sin relleno ni palabras de marketing; cada línea nombra piezas y casillas reales; al menos 2 variantes por texto de línea y por lead; la elección usa la misma semilla que `coachVoice`.
- No se rediseña `GameReviewScreen`: solo cambia lo que se le pasa a `coachExplanation`. No se persiste ningún dato nuevo.
- Sigue la rama `feat/comentarios-tacticos`. Git solo desde Git Bash. Un commit por tarea, con `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` al final.

## Review Focus

- Variante vacía, con una primera jugada ilegal, o cortada a mitad del intercambio: ninguna afirmación y ningún error.
- Coronación, captura al paso y enroque dentro de la variante: el detector no falla ni da falsos positivos.
- Quien mueve primero es negro: el signo y el bando del material y de los textos («ganas» frente a «gana el rival») son correctos.
- El rival no recaptura, o el objetivo se mueve: no es «eliminar al defensor».
- El párrafo nunca queda vacío ni muestra un marcador sin rellenar, para ningún estilo, idioma ni combinación de hechos, y respeta el tope en es y en.
- Una captura final que el rival puede devolver gratis no cuenta como ganancia.

---

## File Structure

- Create `src/review/lines.ts`, `src/review/lines.test.ts`.
- Modify `src/review/types.ts` (`PositionEval.pv`, `Facts.line`, `Facts.missedLine`).
- Modify `src/review/analyze.ts` (guardar `pv`) y su prueba.
- Modify `src/review/build.ts` (`factsFor`, `ratePly`) y `src/review/review.test.ts`.
- Modify `src/review/coachText.ts`, `src/review/coach/{es,en,de,it,fr}.json`, `src/review/coachText.test.ts`.
- Modify `src/screens/GameReviewScreen.tsx` (una línea: pasar `style`).
- Modify `CLAUDE.md` (párrafo «Análisis de partida»).

---

### Task 1: Guardar la variante completa del motor

**Files:**
- Modify: `src/review/types.ts` (`PositionEval`), `src/review/analyze.ts` (`evaluatePosition`)
- Test: `src/review/analyze.test.ts` (nuevo)

**Interfaces:**
- Produces: `PositionEval = { score: number; best: string; pv?: string[] }` (`pv` en UCI, como mucho 8 jugadas, sin la jugada vacía).

- [ ] **Step 1: Write the failing tests** en `analyze.test.ts`, con un motor falso (`{ search: async () => ({ bestmove, lines }) } as unknown as UciEngine`):
  - `evaluatePosition` devuelve `pv` con la variante de `lines[0]` recortada a 8 jugadas.
  - Sin líneas (`lines: []`) devuelve `pv: []` y no falla.
  - Una posición terminada (mate) devuelve `best: ''` y `pv` ausente o vacía.
  - `score` y `best` no cambian respecto de hoy (se afirma con los valores del motor falso para blancas y para negras).
- [ ] **Step 2: Run to verify it fails:** `npx tsx --test src/review/analyze.test.ts` → FAIL.
- [ ] **Step 3: Implement** el campo opcional `pv` en `PositionEval` y rellenarlo en `evaluatePosition` desde `r.lines[0]?.pv?.slice(0, 8) ?? []`.
- [ ] **Step 4: Run** `npx tsx --test src/review/analyze.test.ts` y `npm test` → PASS.
- [ ] **Step 5: Commit** (`feat(review): conservar la variante completa del motor en cada evaluación`), incluyendo este plan y el diseño nuevo.

---

### Task 2: Detector de líneas (eliminar al defensor y material)

**Files:**
- Create: `src/review/lines.ts`
- Test: `src/review/lines.test.ts`

**Interfaces:**
- Consumes: `PieceKind` de `./types`.
- Produces:
  - `type RemoveDefender = { capturer: PieceKind; removed: PieceKind; removedSq: string; target: PieceKind; targetSq: string }`
  - `type LineFacts = { sans: string[]; material: number; removeDefender?: RemoveDefender }` (`sans`: SAN en inglés de las jugadas reproducidas, como mucho 4; `material`: puntos netos para **quien mueve primero**)
  - `analyzeLine(fen: string, pv: string[]): LineFacts | null`: `null` si `pv` está vacía o su primera jugada es ilegal; si una jugada posterior es ilegal, se analiza el prefijo legal. Nunca lanza.

- [ ] **Step 1: Write the failing tests** (`node:test`, FEN verificados a mano; los de puzzle salen de `src/puzzles/puzzles.json`: el FEN es la posición ANTES de la jugada del rival y `moves[0]` es del rival; la línea de prueba es la posición tras `moves[0]` y `pv = moves.slice(1)`):
  - Puzzle `fXWxU` (`8/5p2/2k1p3/1p1r2p1/1P5p/2K1BR2/5P2/8 b - - 2 50`, jugadas `d5f5 f3f5 e6f5 e3g5`): `removeDefender` = `{ capturer: 'r', removed: 'r', removedSq: 'f5', target: 'p', targetSq: 'g5' }` y `material === 1`.
  - Puzzle `XRAot` (`4Q3/4n1pk/5p1p/3pq3/8/6NP/5PPK/8 b - - 8 34`, jugadas `e7f5 e8e5 f6e5 g3f5`): `removeDefender` con `removed: 'q'`, `target: 'n'`, `targetSq: 'f5'` y `material === 3`.
  - Negativo: un cambio igual por igual sin objetivo defendido por la pieza capturada → `removeDefender` indefinido y `material === 0`.
  - Negativo: la 2.ª jugada de la variante mueve el objetivo, o la 3.ª no lo captura → indefinido.
  - Negativo (truncada): la variante de `fXWxU` cortada tras `e6f5` → sin `removeDefender`, `material === 0`.
  - Negativo (captura final gratis): `4k3/8/2p5/3p4/8/8/8/3QK3 w - - 0 1` con `pv = ['d1d5']` (la dama toma un peón defendido por un peón): el peón capturado no se cuenta, `material === 0`.
  - Bando negro: una versión con colores invertidos de `fXWxU` (espejo del tablero con negras mueven primero, armada con chess.js y verificada) da el mismo `material` positivo para quien mueve primero y el mismo `removeDefender` espejado.
  - `analyzeLine(fen, [])` y una primera jugada ilegal → `null`; coronación (`e7e8q`) y enroque dentro de la variante no lanzan error.
- [ ] **Step 2: Run to verify it fails:** `npx tsx --test src/review/lines.test.ts` → FAIL.
- [ ] **Step 3: Implement `analyzeLine`.** Reproduce hasta 4 jugadas sobre una copia con chess.js; suma capturas con los valores de pieza (p 1, n 3, b 3, r 5, q 9) con signo según quién mueve primero. `removeDefender`: se evalúa en la posición previa a la 1.ª jugada con `attackers()` (quien defiende, objetivo ≠ rey, casilla distinta de la capturada) más las condiciones de las restricciones globales. La captura final de quien gana se descuenta si la pieza puede ser capturada gratis (misma idea que `capturableForFree` de `tactics.ts`; si conviene, exportarla en lugar de duplicarla).
- [ ] **Step 4: Run** `npx tsx --test src/review/lines.test.ts` y `npm test` → PASS.
- [ ] **Step 5: Commit** (`feat(review): detector de líneas: eliminar al defensor y material neto`).

---

### Task 3: Hechos de la línea en `Facts`

**Files:**
- Modify: `src/review/types.ts`, `src/review/build.ts` (`factsFor` ~línea 39, `ratePly` ~línea 96)
- Test: `src/review/review.test.ts`

**Interfaces:**
- Consumes: `analyzeLine`, `LineFacts` (Tarea 2); `PositionEval.pv` (Tarea 1).
- Produces:
  - `Facts.line?: LineFacts` (línea del motor tras la jugada; quien mueve primero es el rival de quien jugó; solo en jugadas malas y solo si `removeDefender` existe o `material >= 2`)
  - `Facts.missedLine?: LineFacts` (línea del motor antes de la jugada; quien mueve primero es quien jugó; mismas condiciones)
  - `factsFor(move, bestUci, replyUci, quality, scoreAfter?, prevTo?, pvs?: { reply?: string[]; best?: string[] }): Facts` (el 7.º parámetro es opcional: todas las llamadas actuales siguen compilando)
  - `ratePly` pasa `{ reply: after.pv, best: before.pv }`.

- [ ] **Step 1: Write the failing tests** en `review.test.ts` (helpers propios sobre chess.js; posiciones de `fXWxU` y `XRAot` como jugadas del rival que permiten la táctica):
  - Error del rival (jugada mala) con `pvs.reply` de `fXWxU` → `facts.line.removeDefender` definido.
  - Mismo caso con jugada buena → `facts.line` indefinido.
  - `pvs.best` con una línea que gana ≥ 2 puntos de material → `facts.missedLine.material >= 2`.
  - Sin `pvs`, con `pvs.reply` vacía o ilegal → ni `line` ni `missedLine`, y todo lo demás igual que antes (los tests existentes de `factsFor` siguen verdes sin tocarlos).
  - Una línea que gana menos de 2 puntos y sin `removeDefender` → `facts.line` indefinido.
  - `ratePly` conecta `after.pv`/`before.pv` (una prueba a través de `ratePly` y otra de `buildReview` con `PositionEval` que traen `pv`).
- [ ] **Step 2: Run to verify it fails:** `npx tsx --test src/review/review.test.ts` → FAIL.
- [ ] **Step 3: Implement** los campos en `Facts`, el parámetro `pvs` en `factsFor` (solo dentro del bloque de jugadas malas, junto a `allows` y `missed`) y el paso de datos en `ratePly`.
- [ ] **Step 4: Run** `npx tsx --test src/review/review.test.ts`, `npm test` y `npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** (`feat(review): línea del motor y oportunidad perdida en los hechos de la jugada`).

---

### Task 4: Composición en la voz del bot (es y en)

**Files:**
- Modify: `src/review/coachText.ts` (`Texts`, `coachVoice`, `coachExplanation`), `src/review/coach/es.json`, `en.json` (y copia del inglés en `de.json`, `it.json`, `fr.json` para las claves nuevas), `src/screens/GameReviewScreen.tsx` (una línea)
- Test: `src/review/coachText.test.ts`

**Interfaces:**
- Consumes: `Facts` con `line`, `missedLine`, `found`, `allowsTactic`, `mateIn`, `plan`, `did`, `allows`, `missed`.
- Produces:
  - `export const EXPLANATION_CAP = 220`
  - `coachExplanation(o: { lang; subject; quality; facts; move; bestSan; fmt; seed?; style: BotStyle }): string[]` → `[]` solo si no hay nada que decir; si no, **un único párrafo** (arreglo de 1 elemento) compuesto por: lead de estilo + como mucho 2 hechos (escalera) + tail opcional, recortado al tope.
  - `coachVoice` usa `opp[style]`.
  - Textos nuevos (todas las hojas con variantes son `string[]` de al menos 2):
    - `frame.<estilo>.<exploit|allows|good>.lead` y `.tail` (el `tail` solo en `exploit` y `allows`)
    - `opp.<estilo>.<ok|inaccuracy|mistake|blunder|mate>`
    - `line.removeDefender.<exploit|allows|missed>`, `line.material.<exploit|allows|missed>` con marcadores `{first}`, `{capturer}`, `{removed}`, `{target}`, `{targetSq}`, `{seq}`, `{n}`
    - `intent.<develop|center|rookFile|pawnBreak|pawnAdvance|kingActive|retreat>` con `{Piece}`, `{piece}`, `{from}`, `{to}`
  - `GameReviewScreen.tsx` pasa `style: coach.style` (única línea nueva).

- [ ] **Step 1: Write the failing tests** (reescribir las que asumían varias líneas y añadir las nuevas, todas con aserciones reales):
  - Caso del usuario (rival se equivoca, `facts.line.removeDefender` + `allows` captura + `missed` + `plan` de desarrollo): un solo párrafo que contiene «Eliminar al defensor», la jugada que captura, la pieza que defendía y la casilla del objetivo; la intención («quería desarrollar…») aparece después o se omite por el tope; **no** aparece el plan en forma positiva.
  - El mismo caso en los 4 estilos tiene leads distintos entre sí (al menos 2 de los 4 difieren).
  - Error propio (`subject: 'you'`) con `facts.line.removeDefender` → usa el texto `allows`, no el de `exploit`.
  - `missedLine` con material ≥ 2 → usa el texto `missed`.
  - Mate y táctica: con `mateIn` y `removeDefender` a la vez, el mate va primero y solo hay 2 hechos.
  - Jugada buena con plan positivo y sin hechos: párrafo con lead `good` y el plan positivo; nunca solo el lead.
  - Plan malo: `trade` y `plain` se omiten; `develop` se dice como intención.
  - Tope: en es y en, para una muestra amplia de combinaciones de hechos, el párrafo ≤ `EXPLANATION_CAP` salvo que el concepto con 1 jugada ya no entre; la secuencia se acorta antes de quitar hechos; el concepto nunca desaparece.
  - Variantes: dos semillas distintas pueden dar dos párrafos distintos en al menos un caso.
  - Marcadores: para todo estilo, situación, `TacticKind`, `PlanKind` y clave nueva, el texto sale sin `{` ni dobles espacios, en los 5 idiomas; la prueba de marcadores por familia de `coachText.test.ts` se extiende a `frame.`, `line.`, `intent.` y `opp.<estilo>`, y comprueba que cada marcador usado lo suministra el código.
  - Forma: los 5 idiomas tienen la misma forma y los mismos marcadores (prueba existente) con las claves nuevas.
  - `coachVoice` con subject opponent devuelve una frase distinta según el estilo.
- [ ] **Step 2: Run to verify it fails:** `npx tsx --test src/review/coachText.test.ts` → FAIL.
- [ ] **Step 3: Implement** la composición en `coachText.ts` (los constructores de líneas de hecho actuales se reutilizan; añadir los de `line.*` e `intent.*`; elegir variantes que quepan en lo que queda del tope; escalera y tope según las restricciones globales). Escribir los textos en español (autoridad) y en inglés con la voz propia de cada estilo (`tranquilo`: pausado; `equilibrado`: claro y neutro; `posicional`: razona sobre estructura y casillas; `agresivo`: directo y con empuje), nunca burlón cuando el error es del usuario. En de, it y fr copiar el inglés por ahora para que las pruebas de forma sigan verdes. Pasar `style: coach.style` en `GameReviewScreen.tsx`.
- [ ] **Step 4: Run** `npx tsx --test src/review/coachText.test.ts`, `npm test` y `npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** (`feat(review): explicación en la voz del bot con la línea del motor (es y en)`).

---

### Task 5: Traducciones, documentación y verificación final

**Files:**
- Modify: `src/review/coach/de.json`, `it.json`, `fr.json`; `CLAUDE.md`

**Interfaces:**
- Consumes: textos nuevos de `es.json`/`en.json` (Tarea 4) y los glosarios `docs/traducciones/<idioma>.md`.
- Produces: los 5 idiomas con la misma forma y marcadores.

- [ ] **Step 1: Traducir con gemma4** (Ollama en `http://localhost:11434`, `POST /api/generate`, `"stream": false`, `"think": false`, cuerpo en UTF-8) solo las claves nuevas (`frame`, `opp` por estilo, `line`, `intent`) de `es.json` a de, it y fr, con el glosario de cada idioma y el nombre oficial del concepto (`puzzleTheme.capturingDefender` en `src/i18n/<idioma>.ts`). Los marcadores `{...}` no se tocan. Revisar a mano los casos gramaticales (alemán: casos tras preposición; italiano y francés: artículos y contracciones). Si Ollama no responde, traducir a mano y decirlo.
- [ ] **Step 2: Run** `npm test`, `npx tsc --noEmit` y `npx expo lint` → todo en verde (lint 0 errores y 0 avisos).
- [ ] **Step 3: Verificación con entrada realista:** un script descartable en la carpeta temporal (fuera del repo) que arma una revisión con una partida corta que incluya un error del rival explotable con eliminar al defensor, un error propio y una jugada tranquila, usando las variantes de los puzzles `fXWxU` y `XRAot` como `pv`, e imprime titular y explicación de cada jugada en es y en más otro idioma y para los 4 estilos. Incluir una muestra en el informe para que una persona la lea. Ninguna jugada con explicación vacía ni con marcador sin rellenar.
- [ ] **Step 4: Documentar y commit.** En el párrafo «Análisis de partida» de `CLAUDE.md`: los comentarios usan la variante completa del motor (`pv`), `src/review/lines.ts` (eliminar al defensor y material) y se componen en la voz del bot con tope de largo (`EXPLANATION_CAP`); traducciones de de/it/fr con gemma4 sin revisión de nativos. Sin reestructurar el archivo.

```bash
git add src/review/coach CLAUDE.md
git commit -m "feat(review): traducciones de la explicación con la línea del motor y documentación"
```

---

## Self-review

- **Cobertura del diseño:** variante completa (T1), detector de líneas y material (T2), hechos y oportunidad perdida (T3), voz del bot en un texto, escalera, intención del plan, tope y `opp` con estilo (T4), idiomas y verificación (T5). Fuera de alcance respetado (etapas 2 y 3, sin cambios de pantalla ni de motor).
- **Consistencia de tipos:** `LineFacts`, `RemoveDefender`, `Facts.line`/`missedLine`, `pvs` y `EXPLANATION_CAP` se usan igual en las tareas 3, 4 y 5.
- **Proporción:** el plan fija firmas, pruebas con valores reales y reglas; los cuerpos los escribe quien implemente.
