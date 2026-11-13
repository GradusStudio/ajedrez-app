# Pantalla ancha, etapa 3 — Plan de implementación

> **Para quien implemente con agentes:** REQUIRED SUB-SKILL: usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para ejecutar este plan tarea por tarea. Los pasos usan casillas (`- [ ]`).

**Objetivo:** Completar la etapa 3 de la pantalla ancha de la web: grillas de dos columnas en Bots y Aperturas, y Aprender con la ruta a la izquierda y un panel fijo a la derecha, sin cambios en el celular.

**Arquitectura:** Se reutiliza el patrón de 960 px y dos columnas de las tiendas, centralizado en un hook `useWideGrid`. En Aprender, una fila centrada divide el contenido entre la ruta (scroll propio) y un panel fijo de 280 px; los anchos se calculan con funciones puras y probadas.

**Tecnología:** Expo, React Native, React Native Web, TypeScript, `tsx` + `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-12-pantalla-ancha-etapa-3-design.md`

## Restricciones globales

- Solo web y solo desde 960 px (`WIDE_MIN_WIDTH`). En el celular, en Expo Go y en ventanas angostas no cambia nada.
- Barra lateral: 232 px con etiquetas desde 1200 px (`SIDEBAR_LABELS_MIN_WIDTH`); 76 px con solo íconos entre 960 y 1199.
- Grilla: ancho máximo 960 px (`WIDE_GRID_COLUMN`), tarjetas al 48 %, separación `space.md` (12 px).
- Aprender: panel de 280 px, separación de 24 px (`space.xl`), ruta de 480 a 640 px.
- No se agregan textos ni claves de i18n. Se reutilizan `home.lessonCaption`, `common.continue`, `common.start`, `home.streakLabel` y `common.coinsLabel`.
- No se cambian colores, tipografía ni botones de `docs/design.md`.
- `npx tsc --noEmit`, `npx expo lint` y `npm test` tienen que pasar al final de cada tarea.
- Git solo desde Git Bash. El árbol de trabajo ya tiene cambios ajenos: borrados preparados de `LEEME-*.md` y de planes viejos en `docs/superpowers/plans/`, y `CLAUDE.md` modificado. **No los incluyas en los commits:** usa `git add <rutas exactas>` y `git commit -m "..." -- <rutas exactas>`. Nunca `git add -A`, `git add .` ni `git push --all`.
- Autor anónimo del repo: `Gradus Studio <349628194+GradusStudio@users.noreply.github.com>`. No cambies `user.name` ni `user.email`.
- Rama de trabajo: `web-pantalla-ancha-etapa3`, desde `main`.
- El servidor de desarrollo (`npx expo start --web`) sirve la app en `/`, no en `/app`.

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/components/useWideGrid.ts` (nuevo) | Hook con los estilos compartidos de grilla de dos columnas. |
| `src/components/wideLayout.ts` | Constantes de la barra lateral y `wideContentWidth`. |
| `src/components/wideHome.ts` (nuevo) | Cálculo puro de ruta y panel de Aprender. |
| `src/components/PieceSetPicker.tsx` | Migrar a `useWideGrid`. |
| `src/components/BoardThemePicker.tsx` | Migrar a `useWideGrid`. |
| `src/screens/CreditsScreen.tsx` | Migrar a `useWideGrid`. |
| `src/screens/BotGamesScreen.tsx` | Migrar a `useWideGrid`. |
| `src/app/(tabs)/bots.tsx` | Envolver en `WideListColumn` de 960. |
| `src/screens/BotsScreen.tsx` | Grilla de bots. |
| `src/app/(tabs)/aperturas.tsx` | Envolver en `WideListColumn` de 960. |
| `src/screens/OpeningsScreen.tsx` | Grilla de cursos. |
| `src/screens/HomeScreen.tsx` | Rama ancha de Aprender. |
| `src/components/WideSidebar.tsx` | Usar las constantes de ancho. |
| `src/components/wideLayout.test.ts` (nuevo) | Pruebas de `wideContentWidth`. |
| `src/components/wideHome.test.ts` (nuevo) | Pruebas de `homeWideColumns`. |
| `docs/superpowers/specs/2026-11-08-web-pantalla-ancha-design.md` | Sección 11 al terminar. |

## Review Focus

Los cinco puntos que más probablemente fallen y que las pruebas unitarias no cubren. Cada uno tiene su verificación en la tarea que lo posee.

1. **A 960 px la fila de Aprender desborda horizontalmente.** El total (884 px) coincide exacto con el contenido; un píxel de más agrega una barra horizontal. Verificación en la tarea 6, a 960×650.
2. **Bots y Aperturas no salen de los 640 px de las pestañas.** Si el `WideListColumn` anidado no pisa el `ColumnContext`, la grilla queda angosta. Verificación en las tareas 3 y 4, a 960 px.
3. **El panel de Aprender se mueve con el scroll de la ruta.** Pasa si la ruta y el panel comparten un solo `ScrollView`. Verificación en la tarea 6: scrollear la ruta hasta el final y ver el panel quieto.
4. **La ruta se recorta a 580 px.** Los nodos en zigzag y los títulos de hasta tres líneas tienen que entrar. Verificación en la tarea 6, a 960×650.
5. **La migración cambia las cuatro pantallas que ya tenían grilla.** Créditos, Piezas, Tableros e historial de bots tienen que verse igual que antes. Verificación en las tareas 1 y 2, a 1440 y 375 px.

---

### Task 1: Hook `useWideGrid` y migración de las dos tiendas

**Archivos:**
- Crear: `src/components/useWideGrid.ts`
- Modificar: `src/components/PieceSetPicker.tsx`, `src/components/BoardThemePicker.tsx`

**Interfaces:**
- Consume: `useWideLayout()`.
- Produce: `useWideGrid(): { wide: boolean; gridStyle: StyleProp<ViewStyle>; cardStyle: StyleProp<ViewStyle> }`. Las tareas 2, 3 y 4 lo consumen.

- [ ] **Paso 1: Crear la rama y commitear la spec y este plan.**

```bash
git switch -c web-pantalla-ancha-etapa3
git add docs/superpowers/specs/2026-11-12-pantalla-ancha-etapa-3-design.md docs/superpowers/plans/2026-11-12-pantalla-ancha-etapa-3.md
git commit -m "Docs: spec y plan de la etapa 3 de pantalla ancha" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>" -- docs/superpowers/specs/2026-11-12-pantalla-ancha-etapa-3-design.md docs/superpowers/plans/2026-11-12-pantalla-ancha-etapa-3.md
```

Resultado: el commit contiene solo esos dos documentos; `git status` sigue mostrando los cambios ajenos.

- [ ] **Paso 2: Crear `src/components/useWideGrid.ts`.**

```ts
import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { space } from '../theme';
import { useWideLayout } from './useWideLayout';

export type WideGrid = {
  wide: boolean;
  gridStyle: StyleProp<ViewStyle>;
  cardStyle: StyleProp<ViewStyle>;
};

/** Estilos de la grilla de dos columnas de pantalla ancha; undefined en el celular y en ventanas angostas. */
export function useWideGrid(): WideGrid {
  const wide = useWideLayout();
  return {
    wide,
    gridStyle: wide ? styles.grid : undefined,
    cardStyle: wide ? styles.cardWide : undefined,
  };
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space.md },
  cardWide: { width: '48%', marginBottom: 0 },
});
```

- [ ] **Paso 3: Migrar `PieceSetPicker.tsx`.**
  - Cambiar el import `useWideLayout` por `useWideGrid`.
  - Cambiar `const wide = useWideLayout();` por `const { gridStyle, cardStyle } = useWideGrid();`.
  - Cambiar `<View style={wide ? styles.grid : undefined}>` por `<View style={gridStyle}>`.
  - Cambiar `style={[styles.card, wide && styles.cardWide, selected && styles.cardSelected]}` por `style={[styles.card, cardStyle, selected && styles.cardSelected]}`.
  - Borrar `grid` y `cardWide` del `StyleSheet`.

- [ ] **Paso 4: Migrar `BoardThemePicker.tsx`** con los mismos cambios del paso 3.

- [ ] **Paso 5: Verificar TypeScript.**

Run: `npx tsc --noEmit`
Expected: sin salida.

- [ ] **Paso 6: Verificar lint.**

Run: `npx expo lint`
Expected: sin errores ni avisos.

- [ ] **Paso 7: Correr las pruebas.**

Run: `npm test`
Expected: todas pasan.

- [ ] **Paso 8: Verificar en el navegador.**
  - Levantar `npx expo start --web` y abrir la URL de la terminal (sirve en `/`).
  - A 1440×900: Perfil › Piezas (`/piezas`) y Perfil › Tableros (`/tableros`) muestran dos columnas, igual que antes.
  - A 375×812: una sola columna, sin desborde horizontal.

- [ ] **Paso 9: Commit.**

```bash
git add src/components/useWideGrid.ts src/components/PieceSetPicker.tsx src/components/BoardThemePicker.tsx
git commit -m "Web: hook compartido para las grillas de pantalla ancha" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>" -- src/components/useWideGrid.ts src/components/PieceSetPicker.tsx src/components/BoardThemePicker.tsx
```

---

### Task 2: Migrar Créditos e historial de bots

**Archivos:**
- Modificar: `src/screens/CreditsScreen.tsx`, `src/screens/BotGamesScreen.tsx`

**Interfaces:**
- Consume: `useWideGrid()` de la tarea 1.

- [ ] **Paso 1: Migrar `CreditsScreen.tsx`.**
  - Cambiar el import `useWideLayout` por `useWideGrid`.
  - Cambiar `const wide = useWideLayout();` por `const { gridStyle, cardStyle } = useWideGrid();`.
  - Cambiar `<View style={wide ? styles.grid : undefined}>` por `<View style={gridStyle}>`.
  - Cambiar `style={[styles.card, wide && styles.cardWide]}` por `style={[styles.card, cardStyle]}`.
  - Borrar `grid` y `cardWide` del `StyleSheet`.

- [ ] **Paso 2: Migrar `BotGamesScreen.tsx`** con los mismos cambios; la tarjeta conserva `styles.cardPressed` en el arreglo de estilos.

- [ ] **Paso 3: Verificar TypeScript, lint y pruebas.**

Run: `npx tsc --noEmit`
Expected: sin salida.

Run: `npx expo lint`
Expected: sin errores ni avisos.

Run: `npm test`
Expected: todas pasan.

- [ ] **Paso 4: Verificar en el navegador.**
  - A 1440×900: `/creditos` y `/historial-bots` muestran dos columnas.
  - A 375×812: una sola columna, sin desborde.

- [ ] **Paso 5: Commit.**

```bash
git add src/screens/CreditsScreen.tsx src/screens/BotGamesScreen.tsx
git commit -m "Web: migra Créditos e historial de bots al hook de grilla" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>" -- src/screens/CreditsScreen.tsx src/screens/BotGamesScreen.tsx
```

---

### Task 3: Grilla de Bots

**Archivos:**
- Modificar: `src/app/(tabs)/bots.tsx`, `src/screens/BotsScreen.tsx`

**Interfaces:**
- Consume: `useWideGrid()` de la tarea 1; `WideListColumn` y `WIDE_GRID_COLUMN` existentes.

- [ ] **Paso 1: Envolver la pestaña en la columna de 960.**

En `src/app/(tabs)/bots.tsx`:

```tsx
import { WideListColumn } from '../../components/WideListColumn';
import { WIDE_GRID_COLUMN } from '../../components/wideLayout';

export default function BotsTab() {
  return (
    <WideListColumn width={WIDE_GRID_COLUMN}>
      <BotsScreen
        onOpenBot={(bot) => router.push({ pathname: '/bot/[id]', params: { id: bot.id } })}
        onContinue={() => router.push({ pathname: '/partida', params: { continuar: '1' } })}
      />
    </WideListColumn>
  );
}
```

- [ ] **Paso 2: Poner las tarjetas en grilla.**

En `src/screens/BotsScreen.tsx`:
  - Importar `useWideGrid`.
  - Agregar `const { gridStyle, cardStyle } = useWideGrid();` junto a los otros hooks.
  - Envolver el `bots.map(...)` existente en `<View style={gridStyle}> ... </View>`.
  - En el `style` de cada `Pressable`, cambiar `[styles.card, pressed && {...}]` por `[styles.card, cardStyle, pressed && {...}]`.
  - No cambiar el contenido de la tarjeta ni la tarjeta «Continuar partida», que queda fuera de la grilla y a todo el ancho.

- [ ] **Paso 3: Verificar TypeScript, lint y pruebas.**

Run: `npx tsc --noEmit`
Expected: sin salida.

Run: `npx expo lint`
Expected: sin errores ni avisos.

Run: `npm test`
Expected: todas pasan.

- [ ] **Paso 4: Verificar en el navegador.**
  - A 1440×900, 1024×768 y 960×650: `/bots` muestra dos columnas; la tarjeta de partida en curso (si existe) ocupa todo el ancho; al tocar un bot se abre su ficha.
  - A 960, comprobar que la grilla usa el ancho de la pestaña (unos 884 px) y no la columna de 640.
  - A 375×812: una sola columna, como antes.

- [ ] **Paso 5: Commit.**

```bash
git add "src/app/(tabs)/bots.tsx" src/screens/BotsScreen.tsx
git commit -m "Web: grilla de bots en pantalla ancha" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>" -- "src/app/(tabs)/bots.tsx" src/screens/BotsScreen.tsx
```

---

### Task 4: Grilla de Aperturas

**Archivos:**
- Modificar: `src/app/(tabs)/aperturas.tsx`, `src/screens/OpeningsScreen.tsx`

**Interfaces:**
- Consume: `useWideGrid()` de la tarea 1; `WideListColumn` y `WIDE_GRID_COLUMN` existentes.

- [ ] **Paso 1: Envolver la pestaña en la columna de 960.**

En `src/app/(tabs)/aperturas.tsx`:

```tsx
import { WideListColumn } from '../../components/WideListColumn';
import { WIDE_GRID_COLUMN } from '../../components/wideLayout';

export default function OpeningsTab() {
  return (
    <WideListColumn width={WIDE_GRID_COLUMN}>
      <OpeningsScreen onOpenCourse={(course) => router.push({ pathname: '/apertura/[id]', params: { id: course.id } })} />
    </WideListColumn>
  );
}
```

- [ ] **Paso 2: Poner los cursos en grilla.**

En `src/screens/OpeningsScreen.tsx`:
  - Importar `useWideGrid`.
  - Agregar `const { gridStyle, cardStyle } = useWideGrid();` junto a los otros hooks.
  - Envolver el `list.map(...)` existente en `<View style={gridStyle}> ... </View>`.
  - En el `style` de cada `Pressable`, cambiar `[styles.card, pressed && {...}]` por `[styles.card, cardStyle, pressed && {...}]`.
  - El selector Blancas/Negras y la tarjeta guía del final quedan fuera de la grilla y a todo el ancho.

- [ ] **Paso 3: Verificar TypeScript, lint y pruebas.**

Run: `npx tsc --noEmit`
Expected: sin salida.

Run: `npx expo lint`
Expected: sin errores ni avisos.

Run: `npm test`
Expected: todas pasan.

- [ ] **Paso 4: Verificar en el navegador.**
  - A 1440×900, 1024×768 y 960×650: `/aperturas` muestra dos columnas; el selector y la guía ocupan todo el ancho; al tocar un curso se abre.
  - Cambiar entre Blancas y Negras: la grilla se rearma sin desborde.
  - A 375×812: una sola columna, como antes.

- [ ] **Paso 5: Commit.**

```bash
git add "src/app/(tabs)/aperturas.tsx" src/screens/OpeningsScreen.tsx
git commit -m "Web: grilla de aperturas en pantalla ancha" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>" -- "src/app/(tabs)/aperturas.tsx" src/screens/OpeningsScreen.tsx
```

---

### Task 5: Cálculos puros de ancho

**Archivos:**
- Modificar: `src/components/wideLayout.ts`, `src/components/WideSidebar.tsx`
- Crear: `src/components/wideLayout.test.ts`, `src/components/wideHome.ts`, `src/components/wideHome.test.ts`

**Interfaces:**
- Produce: `SIDEBAR_WIDTH = 232`, `SIDEBAR_ICON_WIDTH = 76`, `wideContentWidth(windowWidth: number): number`.
- Produce: `HOME_PANEL = 280`, `HOME_GAP = 24`, `HOME_MIN_ROUTE = 480`, `HomeColumns`, `homeWideColumns(contentWidth: number): HomeColumns | null`.
- Consume: `WIDE_LIST_COLUMN` y `space.xl`.
- La tarea 6 consume todo esto.

- [ ] **Paso 1: Escribir `src/components/wideLayout.test.ts`.**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { wideContentWidth } from './wideLayout';

test('el contenido descuenta la barra lateral de íconos', () => {
  assert.equal(wideContentWidth(960), 884);
  assert.equal(wideContentWidth(1199), 1123);
});

test('el contenido descuenta la barra lateral con etiquetas', () => {
  assert.equal(wideContentWidth(1200), 968);
  assert.equal(wideContentWidth(1440), 1208);
});
```

- [ ] **Paso 2: Correr la prueba para ver que falla.**

Run: `npx tsx --test src/components/wideLayout.test.ts`
Expected: FAIL porque `wideContentWidth` no existe.

- [ ] **Paso 3: Implementar en `src/components/wideLayout.ts`.**

Agregar después de `SIDEBAR_LABELS_MIN_WIDTH`:

```ts
/** Ancho de la barra lateral con etiquetas y solo con íconos (WideSidebar). */
export const SIDEBAR_WIDTH = 232;
export const SIDEBAR_ICON_WIDTH = 76;

/** Ancho disponible para el contenido de una pestaña, descontada la barra lateral. */
export function wideContentWidth(windowWidth: number): number {
  return windowWidth - (windowWidth >= SIDEBAR_LABELS_MIN_WIDTH ? SIDEBAR_WIDTH : SIDEBAR_ICON_WIDTH);
}
```

- [ ] **Paso 4: Usar las constantes en `WideSidebar.tsx`.**

Agregar `import { SIDEBAR_ICON_WIDTH, SIDEBAR_WIDTH } from './wideLayout';` y cambiar:

```ts
sideWide: { width: SIDEBAR_WIDTH },
sideCompact: { width: SIDEBAR_ICON_WIDTH, paddingHorizontal: space.sm },
```

- [ ] **Paso 5: Correr la prueba de nuevo.**

Run: `npx tsx --test src/components/wideLayout.test.ts`
Expected: PASS.

- [ ] **Paso 6: Escribir `src/components/wideHome.test.ts`.**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { homeWideColumns } from './wideHome';

test('a 960 de ventana la ruta es 580 y el total 884', () => {
  assert.deepEqual(homeWideColumns(884), { route: 580, panel: 280, gap: 24, total: 884 });
});

test('la ruta no pasa de 640 y el total es 944', () => {
  assert.deepEqual(homeWideColumns(948), { route: 640, panel: 280, gap: 24, total: 944 });
  assert.deepEqual(homeWideColumns(968), { route: 640, panel: 280, gap: 24, total: 944 });
  assert.deepEqual(homeWideColumns(1208), { route: 640, panel: 280, gap: 24, total: 944 });
});

test('respeta el mínimo de 480 y devuelve null si no entra', () => {
  assert.deepEqual(homeWideColumns(784), { route: 480, panel: 280, gap: 24, total: 784 });
  assert.equal(homeWideColumns(783), null);
});
```

- [ ] **Paso 7: Correr la prueba para ver que falla.**

Run: `npx tsx --test src/components/wideHome.test.ts`
Expected: FAIL porque el módulo `wideHome` no existe.

- [ ] **Paso 8: Crear `src/components/wideHome.ts`.**

```ts
import { space } from '../theme';
import { WIDE_LIST_COLUMN } from './wideLayout';

/** Columna derecha de Aprender y separación con la ruta. */
export const HOME_PANEL = 280;
export const HOME_GAP = space.xl;
export const HOME_MIN_ROUTE = 480;

export type HomeColumns = { route: number; panel: number; gap: number; total: number };

/** Anchos de la ruta y del panel de Aprender para el contenido disponible; null si no entra. */
export function homeWideColumns(contentWidth: number): HomeColumns | null {
  const route = Math.min(WIDE_LIST_COLUMN, contentWidth - HOME_PANEL - HOME_GAP);
  if (route < HOME_MIN_ROUTE) return null;
  return { route, panel: HOME_PANEL, gap: HOME_GAP, total: route + HOME_GAP + HOME_PANEL };
}
```

- [ ] **Paso 9: Correr la prueba de nuevo.**

Run: `npx tsx --test src/components/wideHome.test.ts`
Expected: PASS.

- [ ] **Paso 10: Verificar TypeScript, lint y todas las pruebas.**

Run: `npx tsc --noEmit`
Expected: sin salida.

Run: `npx expo lint`
Expected: sin errores ni avisos.

Run: `npm test`
Expected: todas pasan, incluidas las dos nuevas.

- [ ] **Paso 11: Verificar la barra lateral en el navegador.**
  - A 960×650: barra lateral de 76 px con solo íconos.
  - A 1200×800: barra lateral de 232 px con etiquetas.
  - Sin cambios visuales respecto de hoy.

- [ ] **Paso 12: Commit.**

```bash
git add src/components/wideLayout.ts src/components/wideLayout.test.ts src/components/wideHome.ts src/components/wideHome.test.ts src/components/WideSidebar.tsx
git commit -m "Web: cálculos de ancho para la pantalla ancha" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>" -- src/components/wideLayout.ts src/components/wideLayout.test.ts src/components/wideHome.ts src/components/wideHome.test.ts src/components/WideSidebar.tsx
```

---

### Task 6: Aprender en dos columnas

**Archivos:**
- Modificar: `src/screens/HomeScreen.tsx`

**Interfaces:**
- Consume: `useWideLayout()`, `wideContentWidth(windowWidth)`, `homeWideColumns(contentWidth)`.
- Produce: la rama ancha de `HomeScreen`; no la consume otra tarea.

- [ ] **Paso 1: Agregar los imports.**

- En el import de `react-native`, agregar `useWindowDimensions`.
- Agregar:
  - `import { useWideLayout } from '../components/useWideLayout';`
  - `import { wideContentWidth } from '../components/wideLayout';`
  - `import { homeWideColumns } from '../components/wideHome';`

- [ ] **Paso 2: Calcular las columnas y extraer el menú de unidades.**

Dentro de `HomeScreen`, después de `floatingWide`:

```ts
const wide = useWideLayout();
const { width } = useWindowDimensions();
const columns = wide ? homeWideColumns(wideContentWidth(width)) : null;
```

Antes del `return`, extraer el menú que hoy está en el árbol:

```tsx
const unitMenu = (
  <UnitMenu
    visible={menuOpen}
    selected={unit.unit}
    onSelect={(n) => {
      setChosen(n);
      setMenuOpen(false);
    }}
    onClose={() => setMenuOpen(false)}
  />
);
```

- [ ] **Paso 3: Agregar la rama ancha antes del `return` actual.**

```tsx
if (columns) {
  return (
    <View style={styles.screen}>
      <View style={[styles.wideRow, { width: columns.total, gap: columns.gap }]}>
        <ScrollView
          style={{ width: columns.route }}
          contentContainerStyle={[styles.wideRouteContent, { paddingTop: statusBarTop(space.md) }]}
        >
          {status.kind === 'recovering' && <RecoveryCard days={status.days} done={status.done} />}
          <UnitPath key={unit.unit} unit={unit} onStartLesson={startLesson} onOpenMenu={() => setMenuOpen(true)} />
        </ScrollView>

        <ScrollView
          style={{ width: columns.panel }}
          contentContainerStyle={[styles.widePanelContent, { paddingTop: statusBarTop(space.md) }]}
        >
          {suggested && (
            <View style={styles.panelCard}>
              <Text style={styles.panelCaption} numberOfLines={2}>
                {t('home.lessonCaption', { order: suggested.order, title: suggested.title })}
              </Text>
              <Button3D
                label={progress.drafts[suggested.id] ? t('common.continue') : t('common.start')}
                variant="primary"
                onPress={() => startLesson(suggested)}
                style={{ marginTop: space.sm }}
              />
            </View>
          )}
          <View style={[styles.panelCard, styles.panelStats]}>
            <View style={styles.stat} accessibilityLabel={t('home.streakLabel', { n: streak })}>
              <StatIcon name="streak" />
              <Text style={styles.statText}>{streak}</Text>
            </View>
            <View style={styles.stat} accessibilityLabel={t('common.coinsLabel', { n: progress.coins })}>
              <StatIcon name="coin" />
              <Text style={styles.statText}>{progress.coins}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
      {unitMenu}
    </View>
  );
}
```

- [ ] **Paso 4: Usar el menú extraído en la rama angosta.**

En el `return` actual, reemplazar el bloque `<UnitMenu ... />` completo por `{unitMenu}`. No cambiar nada más de la rama angosta: la fila de racha/monedas, la tarjeta flotante y sus estilos quedan igual.

- [ ] **Paso 5: Agregar los estilos.**

En el `StyleSheet` de `HomeScreen`:

```ts
wideRow: { flex: 1, flexDirection: 'row', alignSelf: 'center' },
wideRouteContent: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
widePanelContent: { gap: space.md, paddingBottom: space.lg },
panelCard: {
  backgroundColor: colors.surface,
  borderRadius: radius.control,
  borderWidth: 2,
  borderColor: colors.surfaceRaised,
  borderBottomWidth: 4,
  borderBottomColor: colors.surfaceShadow,
  padding: space.md,
},
panelCaption: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
panelStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
```

- [ ] **Paso 6: Verificar TypeScript, lint y pruebas.**

Run: `npx tsc --noEmit`
Expected: sin salida.

Run: `npx expo lint`
Expected: sin errores ni avisos.

Run: `npm test`
Expected: todas pasan.

- [ ] **Paso 7: Verificar en el navegador.**
  - A 1440×900, 1200×800, 1024×768 y 960×650: `/` muestra la ruta a la izquierda y el panel a la derecha. La barra de desplazamiento de la ruta queda entre la ruta y el panel.
  - A 960×650: no aparece barra horizontal; la ruta mide 580 px y el panel 280; los nodos y los títulos de hasta tres líneas no se recortan.
  - Scrollear la ruta hasta el final: el panel no se mueve.
  - Tocar el botón del próximo paso: abre la lección sugerida. Volver: la ruta sigue.
  - Abrir el menú de unidades y elegir otra: la ruta cambia.
  - A 375×812: la fila de racha/monedas arriba y la tarjeta flotante siguen exactamente como antes; no aparece el panel.

- [ ] **Paso 8: Commit.**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "Web: Aprender en dos columnas en pantalla ancha" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>" -- src/screens/HomeScreen.tsx
```

---

### Task 7: Validación final y cierre de la spec

**Archivos:**
- Modificar: `docs/superpowers/specs/2026-11-08-web-pantalla-ancha-design.md`

**Interfaces:**
- Consume: todo lo anterior. No produce código.

- [ ] **Paso 1: Correr la verificación completa.**

Run: `npx tsc --noEmit`
Expected: sin salida.

Run: `npx expo lint`
Expected: sin errores ni avisos.

Run: `npm test`
Expected: todas pasan.

- [ ] **Paso 2: Recorrer la matriz del navegador.**
  - 1440×900, 1200×800, 1024×768 y 960×650:
    - `/bots`: dos columnas; la tarjeta «Continuar partida», si existe, a todo el ancho; entrar a un bot.
    - `/aperturas`: dos columnas; selector y guía a todo el ancho; cambiar de color; entrar a un curso.
    - `/`: ruta y panel; el panel queda fijo al scrollear; el CTA abre la lección; el menú de unidades funciona; no hay desborde horizontal.
  - 375×812: Bots y Aperturas en una columna; Aprender con racha arriba y tarjeta flotante; capturas antes/después sin diferencias.

- [ ] **Paso 3: Actualizar la spec original.**

En `docs/superpowers/specs/2026-11-08-web-pantalla-ancha-design.md`:
  - Reemplazar la última línea de la sección 10 («Sigue pendiente de la etapa 3...») por: «Etapa 3 completada el 12-11-2026: ver la sección 11.»
  - Agregar al final:

```md
## 11. Etapa 3, hecha (12-11-2026)

- Bots y Aperturas usan `WideListColumn` de 960 px y una grilla de dos columnas; el patrón vive en `useWideGrid` y lo comparten seis pantallas: Créditos, Piezas, Tableros, historial de bots, Bots y Aperturas.
- Aprender usa una fila centrada: ruta con scroll propio (580 px a 960 de ventana, 640 desde 1024) y panel fijo de 280 px con próximo paso, racha y monedas. La tarjeta flotante no se muestra en ancho.
- La barra de desplazamiento de la ruta queda entre la ruta y el panel.
- `wideContentWidth` y `homeWideColumns` tienen pruebas puras; `tsc`, lint y `npm test` pasan.
- En el celular y en ventanas angostas no cambia nada.
```

- [ ] **Paso 4: Commit de la documentación.**

```bash
git add docs/superpowers/specs/2026-11-08-web-pantalla-ancha-design.md
git commit -m "Docs: cierra la etapa 3 de pantalla ancha" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>" -- docs/superpowers/specs/2026-11-08-web-pantalla-ancha-design.md
```

---

## Autorevisión del plan

- **Cobertura de la spec:** la grilla compartida está en la tarea 1; la migración de las cuatro pantallas en las tareas 1 y 2; Bots en la 3; Aperturas en la 4; los cálculos puros y sus pruebas en la 5; Aprender en dos columnas en la 6; la validación y la actualización de la spec original en la 7.
- **Pasos:** cada paso tiene un resultado comprobable. Las tareas visuales usan el navegador como verificación; las puras usan `node:test`.
- **Tipos:** `useWideGrid` devuelve `wide`, `gridStyle` y `cardStyle`; `homeWideColumns` devuelve `{ route, panel, gap, total }` o `null`; `wideContentWidth` devuelve un número. Las tareas posteriores usan exactamente esos nombres.
- **Review Focus:** las cinco líneas tienen su verificación en las tareas 1, 2, 3, 4 y 6.
- **Proporción:** el plan no transcribe las pantallas completas; solo los fragmentos que fijan la interfaz.
