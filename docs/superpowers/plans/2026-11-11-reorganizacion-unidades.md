# Reorganización de unidades y lecciones · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Disolver la Unidad 6 y reubicar sus tres lecciones, además de mover «Piezas sueltas» a la Unidad 3 y «Convertir una ventaja» a la Unidad 7, dejando la ruta en 9 unidades y 75 lecciones.

**Architecture:** Se mueven objetos `Lesson` completos entre los JSON de contenido y sus traducciones, conservando ids, pasos y textos. Se renumeran las unidades y el campo `order`. No se toca el progreso guardado ni el servidor de sincronización: las claves del progreso son los ids de lección y no cambian.

**Tech Stack:** TypeScript, tsx + node:test, JSON, Expo/React Native. No se agregan dependencias.

**Spec:** `docs/superpowers/specs/2026-11-09-temario-nuevo-design.md` y la decisión aprobada el 11-11-2026 (ver `docs/contenido-lecciones-aperturas.md`).

## Global Constraints

- El español de `src/data/unidad-*.json` es la referencia; las traducciones de `src/data/i18n/{en,de,it,fr}/` deben cubrir todas las lecciones y pasos.
- Los ids de lección y de paso **no** se renumeran: el progreso guardado usa el id.
- `order` es consecutivo de 1 a 75 y es el número que se muestra; `unit` debe coincidir con el número de la unidad.
- Cinco idiomas: es, en, de, it, fr.
- Al terminar cada tarea: `npx tsc --noEmit`, `npx expo lint` y `npm test` (o el subconjunto que indique la tarea).
- Commits en español, con el autor anónimo que ya usa el repositorio.
- No modificar `src/progress/` ni `workers/`.

## Review Focus

- Traducciones completas tras mover bloques: no falta ninguna lección ni paso y no sobran claves.
- Índices de `src/data/i18n/*/index.ts`: las claves 1-9 apuntan a los archivos correctos y no queda `unidad-10.json`.
- `order` global consecutivo y `unit` correcto en cada lección.
- Documentación sin conteos viejos (68 lecciones / 10 unidades).
- `lastUnit` guardado puede quedar desfasado al renumerar unidades; el progreso de lecciones no se pierde y se avisa en el mensaje final.

## Estructura final

| Unidad | Archivo | Lecciones | Órdenes |
|---|---|---|---|
| 1 · Lo básico | `unidad-1-lo-basico.json` | 12 | 1-12 |
| 2 · Reglas especiales | `unidad-2-reglas-especiales.json` | 6 | 13-18 |
| 3 · Táctica básica | `unidad-3-tactica-basica.json` | 10 | 19-28 |
| 4 · Apertura y estrategia | `unidad-4-apertura-y-estrategia.json` | 7 | 29-35 |
| 5 · Finales | `unidad-5-finales.json` | 7 | 36-42 |
| 6 · Táctica intermedia | `unidad-6-tactica-intermedia.json` | 9 | 43-51 |
| 7 · Finales intermedios | `unidad-7-finales-intermedios.json` | 9 | 52-60 |
| 8 · Piezas y peones | `unidad-8-piezas-y-peones.json` | 7 | 61-67 |
| 9 · Ataque y defensa | `unidad-9-ataque-y-defensa.json` | 8 | 68-75 |

Movimientos:

- `u9-l01` «Piezas sueltas»: de la Unidad 9 a la Unidad 3, antes de `u3-l08`.
- `u6-l01` «Zugzwang»: de la Unidad 6 a la Unidad 5, después de `u5-l03`.
- `u6-l03` «Sacrificio de calidad»: de la Unidad 6 a la nueva Unidad 6, antes de `u7-l07`.
- `u10-l06` «Convertir una ventaja»: de la Unidad 10 a la nueva Unidad 7, al final.
- `u6-l02` «Profilaxis»: de la Unidad 6 a la nueva Unidad 9, después de `u10-l04`.
- `u6-l04` «Repaso final»: se queda en la nueva Unidad 9, al final, con el mismo id.
- La vieja Unidad 6 (`unidad-6-conceptos-avanzados.json`) se elimina.

Orden final de las unidades tocadas:

- **U3:** `u3-l01, u3-l02, u3-l09, u3-l03, u3-l04, u3-l05, u3-l06, u3-l07, u9-l01, u3-l08`.
- **U5:** `u5-l06, u5-l01, u5-l02, u5-l03, u6-l01, u5-l04, u5-l05`.
- **U6:** `u7-l01, u7-l02, u7-l03, u7-l04, u7-l05, u7-l06, u6-l03, u7-l07, u7-l08`.
- **U7:** `u8-l01, u8-l02, u8-l03, u8-l04, u8-l05, u8-l06, u8-l07, u8-l08, u10-l06`.
- **U8:** `u9-l02, u9-l03, u9-l04, u9-l05, u9-l06, u9-l07, u9-l08`.
- **U9:** `u10-l01, u10-l02, u10-l03, u10-l04, u6-l02, u10-l05, u10-l07, u6-l04`.

Profesores:

- `ivo` suma `u6-l01` (la Unidad 5 sigue siendo toda de Ivo).
- `valentina` suma `u6-l03`.
- `lola` suma `u6-l02`.
- `camila` deja de enseñar `u6-l03` y `bruno` deja de enseñar `u6-l02`.
- `ada` queda con `u6-l04`.

---

### Task 1: Test de forma del currículo y contenido en español

**Files:**
- Create: `src/data/curriculum.test.ts`
- Modify: `src/data/units.ts`
- Modify: `src/data/teachers.ts`
- Modify: `src/data/teachers.test.ts`
- Create: `src/data/unidad-6-tactica-intermedia.json`, `src/data/unidad-7-finales-intermedios.json`, `src/data/unidad-8-piezas-y-peones.json`, `src/data/unidad-9-ataque-y-defensa.json`
- Delete: `src/data/unidad-6-conceptos-avanzados.json`, `src/data/unidad-7-tactica-intermedia.json`, `src/data/unidad-8-finales-intermedios.json`, `src/data/unidad-9-piezas-y-peones.json`, `src/data/unidad-10-ataque-y-defensa.json`
- Modify: `src/data/unidad-1..5` (solo `order` y `unit`)

**Interfaces:**
- Consumes: los JSON actuales de `src/data/` y la tabla «Estructura final».
- Produces: `units` con 9 unidades y 75 lecciones; `teacherForLesson` con los ids movidos en su nuevo profesor.

- [x] **Step 1: Write the failing test**

Create `src/data/curriculum.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { units } from './units';

const idsOf = (unitNumber: number) => {
  const unit = units.find((u) => u.unit === unitNumber);
  assert.ok(unit, `falta la unidad ${unitNumber}`);
  return unit.lessons.map((l) => l.id);
};

test('la ruta queda en 9 unidades y 75 lecciones', () => {
  assert.deepEqual(units.map((u) => u.unit), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(units.map((u) => u.lessons.length), [12, 6, 10, 7, 7, 9, 9, 7, 8]);
  assert.equal(units.flatMap((u) => u.lessons).length, 75);
});

test('order es consecutivo y unit coincide con su unidad', () => {
  const all = units.flatMap((u) => u.lessons);
  all.forEach((lesson, index) => assert.equal(lesson.order, index + 1, lesson.id));
  for (const unit of units) {
    for (const lesson of unit.lessons) assert.equal(lesson.unit, unit.unit, lesson.id);
  }
});

test('los ids de lección son únicos', () => {
  const ids = units.flatMap((u) => u.lessons.map((l) => l.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('las lecciones movidas quedan en su lugar', () => {
  assert.deepEqual(idsOf(3).slice(-3), ['u3-l07', 'u9-l01', 'u3-l08']);
  assert.equal(idsOf(5).indexOf('u6-l01'), idsOf(5).indexOf('u5-l03') + 1);
  assert.equal(idsOf(6).indexOf('u6-l03'), idsOf(6).indexOf('u7-l07') - 1);
  assert.equal(idsOf(7).at(-1), 'u10-l06');
  assert.equal(idsOf(9).indexOf('u6-l02'), idsOf(9).indexOf('u10-l04') + 1);
  assert.equal(idsOf(9).at(-1), 'u6-l04');
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/data/curriculum.test.ts`
Expected: FAIL — `units` todavía tiene 10 unidades.

- [x] **Step 3: Move the Spanish lesson objects**

Create a temporary script in `.superpowers/sdd/2026-11-11-reorganizacion-unidades/` that:
1. Reads the 10 `src/data/unidad-*.json` files.
2. Removes `u9-l01` from unit 9, `u6-l01`, `u6-l02`, `u6-l03` from unit 6, and `u10-l06` from unit 10.
3. Inserts them in the positions listed in «Estructura final».
4. Sets `unit` to the new number and `order` to the global consecutive position 1-75.
5. Writes the four new files and the modified `unidad-1..5` files with `JSON.stringify(data, null, 2) + '\n'`.
6. Deletes the five old files.

Run it with `npx tsx` from the repo root. Check with `git status` that the expected files appear and the old ones are gone.

- [x] **Step 4: Update `src/data/units.ts`**

Use the new imports and array:

```ts
import unit6Raw from './unidad-6-tactica-intermedia.json';
import unit7Raw from './unidad-7-finales-intermedios.json';
import unit8Raw from './unidad-8-piezas-y-peones.json';
import unit9Raw from './unidad-9-ataque-y-defensa.json';

export const unit6 = unit6Raw as unknown as Unit;
export const unit7 = unit7Raw as unknown as Unit;
export const unit8 = unit8Raw as unknown as Unit;
export const unit9 = unit9Raw as unknown as Unit;

export const units: Unit[] = [unit1, unit2, unit3, unit4, unit5, unit6, unit7, unit8, unit9];
```

Remove the old `unit6Raw` (concepts) and `unit10Raw` imports and the `unit10` export.

- [x] **Step 5: Update teachers and their test**

In `src/data/teachers.ts`: add `u6-l01` to `ivo`, `u6-l03` to `valentina`, `u6-l02` to `lola`; remove `u6-l03` from `camila`, `u6-l02` from `bruno`; leave `ada: ['u6-l04']`.

In `src/data/teachers.test.ts`, add:

```ts
assert.equal(teacherOfTitle('Zugzwang'), 'ivo');
assert.equal(teacherOfTitle('Sacrificio de calidad'), 'valentina');
assert.equal(teacherOfTitle('Profilaxis'), 'lola');
```

- [x] **Step 6: Run the tests and verify they pass**

Run: `npx tsx --test src/data/curriculum.test.ts src/data/teachers.test.ts`
Expected: PASS, incluida «la unidad 5 es toda de Maestro Ivo».

- [x] **Step 7: Commit**

```bash
git add src/data
git commit -m "Contenido: disuelve la Unidad 6 y reubica sus lecciones"
```

---

### Task 2: Traducciones de las cuatro lenguas

**Files:**
- Modify: `src/data/i18n/en/unidad-3.json`, `unidad-5.json`, `unidad-6.json`, `unidad-7.json`, `unidad-8.json`, `unidad-9.json`
- Modify: `src/data/i18n/de/…`, `src/data/i18n/it/…`, `src/data/i18n/fr/…` (los mismos archivos)
- Delete: `src/data/i18n/{en,de,it,fr}/unidad-10.json`
- Modify: `src/data/i18n/{en,de,it,fr}/index.ts`

**Interfaces:**
- Consumes: la estructura final de Task 1 y los bloques de traducción actuales.
- Produces: las claves 1-9 de cada `index.ts` apuntando a archivos con exactamente las lecciones del español.

- [x] **Step 1: Move the translation blocks**

For each language in `en, de, it, fr`, create a temporary script that:
1. Reads `unidad-1.json` a `unidad-10.json` en memoria.
2. Extrae `u9-l01` de `unidad-9.json`, `u6-l01`, `u6-l02` y `u6-l03` de `unidad-6.json`, y `u10-l06` de `unidad-10.json`.
3. Agrega `u9-l01` a `unidad-3.json`, `u6-l01` a `unidad-5.json`, `u6-l03` al contenido de la vieja `unidad-7.json`, `u10-l06` al de la vieja `unidad-8.json` y `u6-l02` al de la vieja `unidad-10.json`.
4. Escribe los archivos nuevos: `unidad-6.json` desde la vieja 7, `unidad-7.json` desde la vieja 8, `unidad-8.json` desde la vieja 9 y `unidad-9.json` desde la vieja 10 (con los bloques movidos). Reordena las claves de `lessons` según el orden del español.
5. Borra `unidad-10.json`.
6. En `index.ts`, elimina la línea `'10': require('./unidad-10.json'),`.

Run the script for the four languages.

- [x] **Step 2: Run the translation tests**

Run: `npx tsx --test src/data/translations.test.ts src/i18n/validate.test.ts`
Expected: PASS en los cuatro idiomas, sin faltantes ni sobrantes.

- [x] **Step 3: Check that no stale file remains**

Run: `ls src/data/i18n/en src/data/i18n/de src/data/i18n/it src/data/i18n/fr`
Expected: `unidad-1.json` a `unidad-9.json`, sin `unidad-10.json`.

- [x] **Step 4: Commit**

```bash
git add src/data/i18n
git commit -m "Traducciones: mueve los textos de las lecciones reubicadas"
```

---

### Task 3: Documentación

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/contenido-lecciones-aperturas.md`
- Modify: `docs/formato-lecciones.md`
- Modify: `README.md`
- Modify: `docs/tienda/ficha.md`
- Modify: `docs/superpowers/specs/2026-11-09-temario-nuevo-design.md`
- Modify: `docs/superpowers/plans/2026-11-11-reorganizacion-unidades.md` (marcar pasos)

**Interfaces:**
- Consumes: la estructura final de Tasks 1 y 2.
- Produces: documentación que describe 9 unidades y 75 lecciones, sin referencias a la vieja Unidad 6.

- [x] **Step 1: Update `CLAUDE.md`**

Rewrite the unit bullets (lines 49-58) with the new numbering, file names, lesson counts, step counts and moved lessons. Update the route line to 9 units / 75 lessons, and `unidad-1..6` to `unidad-1..9` in the languages bullet.

- [x] **Step 2: Update `docs/contenido-lecciones-aperturas.md`**

Change the Part 1 header to «9 unidades, 75 lecciones». Rewrite Units 3-10 as Units 3-9 with the moved lessons and current order. Remove the old Unit 6 concepts section and note that its lessons were redistributed. Update the final paragraph with the new order ranges.

- [x] **Step 3: Update `docs/formato-lecciones.md`**

Add `u9-l01` to the Unit 3 table, `u6-l01` to Unit 5, move the old Unit 6 validation notes into the new units, replace the old Unit 6 section with the new Unit 6 (old Unit 7), add `u10-l06` to Unit 7 (old Unit 8), remove `u9-l01` from Unit 8 (old Unit 9), and add `u6-l02`/remove `u10-l06` in Unit 9 (old Unit 10). Update the order ranges: U3 19-28, U4 29-35, U5 36-42, U6 43-51, U7 52-60, U8 61-67, U9 68-75.

- [x] **Step 4: Update public counts**

In `README.md`, change «68 lecciones» to «75 lecciones», «conceptos avanzados» to «ataque y defensa» and «28 cursos» to «29 cursos». In `docs/tienda/ficha.md`, update the five language lines (14, 34, 54, 74, 94): 68 → 75, 10 → 9, remove «conceptos avanzados» / its translations.

- [x] **Step 5: Add the decision note to the spec**

In `docs/superpowers/specs/2026-11-09-temario-nuevo-design.md`, add a short «Reorganización del 11-11-2026» section explaining that the route ended with 9 units and where each lesson went.

- [x] **Step 6: Run all checks**

Run: `npx tsc --noEmit` → expected no errors.
Run: `npx expo lint` → expected 0 errors, 0 warnings.
Run: `npm test` → expected all tests pass.

- [x] **Step 7: Commit**

```bash
git add CLAUDE.md README.md docs
git commit -m "Docs: ruta de 9 unidades y 75 lecciones"
```

---

### Task 4: Revisión final

**Files:** none (review only).

- [ ] **Step 1: Build the review package**

Run: `../subagent-driven-development/scripts/review-package docs/superpowers/plans/2026-11-11-reorganizacion-unidades.md $(git merge-base main HEAD) HEAD` desde el directorio del plugin, o el equivalente con la ruta absoluta.

- [ ] **Step 2: Dispatch a fresh reviewer**

Use `superpowers:requesting-code-review` with the package path, the plan and the spec. Ask for Critical/Important/Minor findings, especially translation coverage, order/unit consistency and stale docs.

- [ ] **Step 3: Fix Critical and Important findings**

For each fix, add or adjust a test first, watch it fail, make it pass and run the full suite. Record the result in the ledger.

- [ ] **Step 4: Final message**

Report the result, the deferred minors and the `lastUnit` caveat.

---

## Self-review

- **Spec coverage:** the plan implements every decision from the approved recommendation: dissolve Unit 6, move the three lessons, move Piezas sueltas and Convertir una ventaja, keep ids and order consecutive.
- **No placeholders:** every task names files, exact placements and test commands.
- **Type consistency:** `units`, `Unit`, `Lesson` and the teacher ids are the existing types; no new interfaces.
- **Review focus:** translations, i18n indexes, order/unit and docs are each covered by a task and by tests (`translations.test.ts`, `validate.test.ts`, `curriculum.test.ts`).
