# Plan de implementación · Tarea 28: tienda, tarjeta «Tu tablero» y Perfil abajo en la barra

Spec: `docs/superpowers/specs/2026-11-14-tienda-y-barra-design.md` · Prototipo: `prototipo-tienda.html` · Autor del plan: opus (14-11-2026) · Para: lingling.

Contexto ya revisado en el código:
- Compras: `useProgress()` expone `buyPieceSet(id, price)` y `buyBoardTheme(id, price)` (devuelven `true` si se pudo); los pickers actuales (`PieceSetPicker`, `BoardThemePicker`) ya arman el diálogo de compra.
- En uso: `usePieceSet()` (`src/settings/PieceSetContext.tsx`) y `settings.boardTheme` (`useSettings().update({ boardTheme })`); `useBoardTheme()` vuelve al verde si el tablero no se tiene.
- `Board` lee el tema con `useBoardTheme()` (línea 299) y las piezas con el contexto de `Piece.tsx`: para la vista previa hace falta poder **forzar** tema y set sin cambiar lo guardado.
- Rutas: `src/app/piezas.tsx` y `src/app/tableros.tsx` (Stack en `_layout.tsx:125-126`); pestañas en `src/app/(tabs)/_layout.tsx`, barra ancha en `src/components/WideSidebar.tsx`.
- Primeros pasos de la tarea 27: `src/start/firstSteps.ts` (`firstStepsDone`).

Cada paso termina con `npm test`, `npx expo lint` y `npx tsc --noEmit` en verde, y un commit con autor `Gradus Studio`.

## Paso 1 · Lógica pura de la tienda (con pruebas)

`src/pieces/shopView.ts` + `shopView.test.ts`:
- `shopItems(kind: 'board' | 'set', ctx)` → lista ordenada (gratis primero, después los de precio) con `{ id, price, state }`, donde `state` es `'inUse' | 'owned' | 'free' | 'affordable' | 'short'` y `short` trae `missing` (monedas que faltan). `ctx = { coins, boughtBoards, boughtSets, boardInUse, setInUse }`.
- `previewCombo(kind, selectedId, ctx)` → `{ board, set }` que muestra la vista previa (lo elegido + lo que ya se usa del otro tipo).
- `previewAction(kind, selectedId, ctx)` → `null` si está en uso; si no, `{ type: 'use' } | { type: 'buy', price, left } | { type: 'short', missing }`.
- `canAffordSomethingNew(ctx)` → para la etiqueta de Inicio.
- Pruebas: cada estado; comprar deja «en uso»; un tablero que no se tiene nunca aparece «en uso»; saldo justo (precio == monedas) es `affordable`.

Commit: «Tienda: lógica pura de estados, vista previa y acción».

## Paso 2 · Vista previa con tema y set forzados

- `Board`: prop opcional `themeOverride?: BoardThemeId`; si viene, se usa en lugar de `useBoardTheme()`. Nada más cambia.
- `PieceSetContext`: exportar un `PieceSetOverride` (provider que fija el set para sus hijos) o una prop equivalente en `Piece`. Usarlo solo en la vista previa y en las miniaturas.
- Prueba: si se puede sin React Native, una prueba del helper que elige el tema efectivo; si no, verificación visual en el paso 4.

Commit: «Tablero: tema y set forzados para vistas previas».

## Paso 3 · Pantalla `ShopScreen`

`src/screens/ShopScreen.tsx` (y `src/app/tienda.tsx`, que lee `?tab=tableros|piezas`):
- **Pantalla ancha** (`useWideLayout`): dos columnas como el prototipo. Izquierda 340 px, `position: sticky` en la web: `Board` no interactivo a 340 px con `PieceSetOverride` + `themeOverride` según `previewCombo`; leyenda «En uso: …» o «Vista previa: …»; botones según `previewAction` («Volver» secundario + «Usar» / «Comprar por {price}» / «Te faltan {n} monedas» desactivado); tarjeta de saldo. Derecha: `Segmented` Tableros / Piezas y grilla de 3 columnas (`useWideGrid` si encaja).
- **Celular:** una columna (vista previa a lo ancho, botones, saldo en la cabecera, selector, grilla de 2).
- **Tarjeta de ítem:** `Pressable` con miniatura (tablero: 2 × 4 casillas con `SquareTexture` o colores; piezas: rey, dama y caballo del set sobre el tablero en uso), nombre y estado (`✓ En uso` en `primary`, «Gratis», «Tuyo», precio dorado con `StatIcon coin`, «{price} · te faltan {n}» apagado). Seleccionada: borde `gold` de 2 px. Etiqueta de accesibilidad completa.
- **Comprar:** diálogo con `showDialog` (web) / `Alert` (nativo), como hoy en los pickers: «¿Comprar el tablero {name}?» / «Cuesta {price} monedas. Te quedan {left}. Se usa en todos tus tableros.». Al confirmar: `buyBoardTheme`/`buyPieceSet` y, si devolvió `true`, ponerlo en uso y limpiar la selección.
- Fondo: el `AppBackground` de la tarea 27 (pantalla transparente, tarjetas con `CardSurface`).
- El consejo `shop` de la tarea 20 pasa a esta pantalla (objetivo: la grilla).

Commit: «Tienda: pantalla única con vista previa, grilla y compra».

## Paso 4 · Rutas viejas

- `src/app/piezas.tsx` → `<Redirect href="/tienda?tab=piezas" />`; `src/app/tableros.tsx` → `<Redirect href="/tienda?tab=tableros" />`. Registrar `tienda` en el Stack de `_layout.tsx`.
- Perfil y Ajustes: los accesos «Piezas» y «Tableros» abren la tienda en su pestaña (o una sola fila «Tienda» en Perfil).
- Borrar `PieceSetScreen` y `BoardThemeScreen` si ya nada los usa; `PieceSetPicker`/`BoardThemePicker` quedan si Ajustes los sigue usando para elegir rápido.
- Verificar en el navegador que `/app/piezas` y `/app/tableros` terminan en la tienda.

Commit: «Tienda: /piezas y /tableros llevan a /tienda».

## Paso 5 · Barra lateral con Tienda y Perfil abajo

`src/components/WideSidebar.tsx`:
- Separar la ruta `perfil` del resto: las demás pestañas arriba como hoy; después un `View` con `flex: 1` (espaciador), una línea de 2 px (`rgba(255,255,255,0.06)`) y el grupo de abajo.
- **Tienda:** no es una pestaña; `Pressable` que hace `router.push('/tienda')`, ícono de bolsa (agregar a `TabIcon` o un `Svg` local), texto «Tienda» y, a la derecha, `StatIcon coin` 18 px + saldo (`gold`, 14 px). Resaltado como activo cuando la ruta actual es `/tienda`.
- **Perfil:** la pestaña `perfil` con el mismo `onPress` de siempre, pero dibujada como fila de 60 px: `BotAvatar` (o el avatar del usuario) en círculo de 40 px con canto dorado, «Perfil» (16 px) y la racha («Racha de {n} días», 13 px, `textMuted`, con plural).
- Versión compacta (`labels = false`): solo los íconos, mismo orden (Tienda y Perfil abajo).
- El objetivo del consejo de pestañas (`setTabBarTarget`) sigue siendo toda la barra.
- Celular: sin cambios en las pestañas de abajo.

Commit: «Barra lateral: Tienda y Perfil abajo».

## Paso 6 · Tarjeta «Tu tablero» en Inicio

`src/screens/StartScreen.tsx`:
- Tarjeta nueva (columna derecha en ancha, al final en el celular): `Board` no interactivo de 150 px con la posición de muestra y lo que está en uso; rótulo «TU TABLERO», nombre de la combinación («{tablero} · {piezas}»), «Cambia el tablero y las piezas, o compra nuevos con tus monedas.» y botón **secundario** «Ir a la tienda» → `/tienda`.
- Etiqueta dorada «Te alcanza para algo nuevo» si `canAffordSomethingNew`.
- No se muestra mientras la cuenta nueva no completó los primeros pasos (`firstStepsDone` falso).

Commit: «Inicio: tarjeta para personalizar el tablero».

## Paso 7 · Textos

Claves nuevas en `src/i18n/{es,en,de,it,fr}.ts` (tú, sin exclamaciones; de/it/fr con gemma4 vía Ollama si responde, si no a mano y anotarlo): `shop.title`, `shop.lead`, `shop.tab.boards`, `shop.tab.pieces`, `shop.inUse`, `shop.preview`, `shop.state.inUse/free/owned/short`, `shop.use`, `shop.buyFor`, `shop.short`, `shop.back`, `shop.balanceHow`, `shop.buy.title.board/set`, `shop.buy.message`, `nav.shop`, `nav.profileStreak` (plural), `start.board.title`, `start.board.text`, `start.board.cta`, `start.board.afford`. `noHardcoded` en verde.

## Paso 8 · Comprobación y publicación

1. `npm test`, `npx expo lint`, `npx tsc --noEmit`, `npm run build:web`.
2. `npx wrangler dev -c wrangler.local.jsonc --port 8788`, a 1366, 1100 (barra compacta) y 375 px:
   - barra con Tienda (saldo) y Perfil (avatar y racha) abajo;
   - tarjeta de Inicio con y sin saldo suficiente, y oculta en una cuenta nueva;
   - tienda: mirar, «Volver», usar algo gratis, comprar con saldo (baja el saldo y queda en uso), probar sin saldo;
   - `/app/piezas` y `/app/tableros` → tienda;
   - sin errores de consola.
3. Push según «Push a GitHub» y `npx wrangler deploy --name ajedrez-app` (autorizado por el autor el 14-11; si el clasificador lo bloquea, pedirle confirmación al autor en tu sesión, como en la 27).
4. Anotar en la fila 28: commits, versión desplegada y lo que quedó sin prueba visual.
