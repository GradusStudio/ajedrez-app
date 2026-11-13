# Pantalla ancha, etapa 3

Fecha: 12-11-2026. Estado: **aprobada el 12-11-2026**.
Completa la spec `2026-11-08-web-pantalla-ancha-design.md`, que dejó hechas las etapas 1 y 2. Sigue el flujo SDD de Gradus.

## 1. Contexto y problema

La web en pantalla ancha (960 px o más) ya tiene barra lateral, tablero con panel al costado y las pantallas de juego adaptadas (etapas 1 y 2, 8-11-2026). El 11-11-2026 se completó parte de la etapa 3: Ajustes, Créditos, Piezas y Tableros usan columnas de 640/960 px y grillas de dos columnas.

Quedan tres pantallas en la columna angosta de 640 px:

- **Bots:** 10 tarjetas en una sola columna; en una ventana de 1440 px sobran dos tercios a los costados.
- **Aperturas:** 29 cursos en una sola columna; pasa lo mismo.
- **Aprender:** la ruta, la racha y las monedas viven en 640 px; la tarjeta flotante del próximo paso tapa parte de la ruta y no se usa el espacio lateral.

## 2. Objetivo

Completar la etapa 3 con el mismo lenguaje de las etapas anteriores: listas en grilla de dos columnas y una columna derecha fija en Aprender. En el celular y en ventanas angostas no cambia nada.

## 3. Alcance

### Entra

- Grilla de dos columnas, ancho máximo 960 px, para Bots y Aperturas.
- Extraer el patrón de grilla que hoy está copiado en cuatro pantallas a un hook compartido, y usarlo en las seis.
- Aprender en pantalla ancha: ruta con scroll propio a la izquierda y columna derecha fija de 280 px con el próximo paso, la racha y las monedas.
- Cálculos de ancho puros y probados.
- Actualizar la spec original con la etapa 3 terminada.

### No entra

- Meta diaria: se decidió el 12-11-2026 dejar solo lo que existe (racha y monedas). Una meta diaria configurable es otra spec.
- Grillas de tres columnas o cambios en las tiendas ya hechas.
- Colores, tipografía, botones, textos o traducciones.
- La app nativa y las tabletas.
- Otras pantallas (Perfil, Puzzles, Análisis, detalle de bot, detalle de apertura).
- Atajos de teclado.

## 4. Enfoques considerados

### A. Reusar el patrón de las tiendas y panel fijo (elegido)

Bots y Aperturas usan la columna de 960 px y la grilla de dos columnas de Piezas/Tableros. Aprender usa una fila centrada: ruta a la izquierda con scroll propio, panel fijo de 280 px a la derecha. Es el mismo lenguaje de las etapas 1 y 2, no agrega textos ni componentes visuales nuevos y mantiene el CTA siempre visible.

### B. Tres columnas en ventanas muy anchas

Descartado: las tarjetas de bots y cursos tienen avatar, resumen y chips; a unos 300 px se aprietan. Además rompe la consistencia con las tiendas y agrega otro breakpoint sin beneficio claro entre 960 y 1440 px.

### C. Aprender con un solo scroll (panel que acompaña)

Descartado: la ruta tiene 12 lecciones por unidad; el próximo paso y la racha se irían hacia arriba al bajar. En una pantalla de escritorio el valor está en que el panel quede fijo.

## 5. Diseño

### 5.1 Grilla compartida

- Nuevo hook `useWideGrid()` en `src/components/useWideGrid.ts`:
  - Devuelve `{ wide, gridStyle, cardStyle }`.
  - `wide` es `useWideLayout()`.
  - `gridStyle`: `{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space.md }` cuando `wide`; `undefined` si no.
  - `cardStyle`: `{ width: '48%', marginBottom: 0 }` cuando `wide`; `undefined` si no.
- Migrar a `PieceSetPicker`, `BoardThemePicker`, `CreditsScreen` y `BotGamesScreen`: se borran sus estilos locales `grid`/`cardWide` y su uso de `useWideLayout` si no hace falta para otra cosa.
- Las pantallas nuevas (`BotsScreen`, `OpeningsScreen`) usan el mismo hook.
- La tarjeta base conserva su `marginBottom` en el celular; en la grilla el `cardStyle` lo pone en 0 y el `gap` separa.
- El orden de lectura se mantiene: fila por fila, el mismo orden de la lista de hoy.

### 5.2 Bots

- `src/app/(tabs)/bots.tsx` envuelve `BotsScreen` en `WideListColumn width={WIDE_GRID_COLUMN}`.
- `BotsScreen`: título, subtítulo y tarjeta «Continuar partida» a todo el ancho. Las 10 tarjetas de bots van dentro de un `View` con `gridStyle`; cada tarjeta suma `cardStyle`. El contenido de la tarjeta no cambia (avatar, nombre, estilo, rasgos, chips).
- A 960 px de ventana el área de contenido mide unos 884 px; cada tarjeta queda en unos 409 px. A 1200 px o más, unos 449 px. Entran las dos columnas.

### 5.3 Aperturas

- `src/app/(tabs)/aperturas.tsx` envuelve `OpeningsScreen` en `WideListColumn width={WIDE_GRID_COLUMN}`.
- `OpeningsScreen`: título, subtítulo y selector Blancas/Negras a todo el ancho. Los 29 cursos van en la grilla de dos columnas. La tarjeta guía del final queda fuera de la grilla, a todo el ancho.
- El resumen de dos líneas, la barra de progreso y los chips se mantienen; a unos 409 px de tarjeta entran sin recortes.

### 5.4 Aprender en pantalla ancha

- Nuevo módulo puro `src/components/wideHome.ts`:
  - `HOME_PANEL = 280`, `HOME_GAP = 24` (`space.xl`), `HOME_MIN_ROUTE = 480` y `HOME_SCROLLBAR = 20`.
  - `homeWideColumns(contentWidth)` devuelve `{ route, panel, gap, total }` o `null`:
    - `route = min(WIDE_LIST_COLUMN, contentWidth - HOME_SCROLLBAR - HOME_PANEL - HOME_GAP)`.
    - Si `route < HOME_MIN_ROUTE`, devuelve `null`.
    - `total = route + gap + panel`.
  - Casos: 884 px de contenido pasan a ruta 560 y total 864; 948 pasa a 624/928; 968 y 1208 pasan a 640/944; 804 pasa a 480/784 y 803 da `null`. Los 20 px de `HOME_SCROLLBAR` quedan a la derecha para la barra.
- En `wideLayout.ts`:
  - Exportar `SIDEBAR_WIDTH = 232` y `SIDEBAR_ICON_WIDTH = 76`; `WideSidebar` los usa en vez de los números sueltos.
  - `wideContentWidth(windowWidth) = windowWidth - (windowWidth >= SIDEBAR_LABELS_MIN_WIDTH ? SIDEBAR_WIDTH : SIDEBAR_ICON_WIDTH)`.
  - Pruebas de `wideContentWidth`: 960 pasa a 884; 1199 a 1123; 1200 a 968; 1440 a 1208.
- `HomeScreen`:
  - `const wide = useWideLayout(); const columns = wide ? homeWideColumns(wideContentWidth(width)) : null;`
  - Si `columns` es `null` (celular o ventana angosta), se renderiza **exactamente** el árbol actual: fila de racha/monedas arriba, `ColumnScrollView` con `RecoveryCard` y `UnitPath`, `UnitMenu` y tarjeta flotante.
  - Si `columns` existe, se renderiza:
    - Un `ScrollView` a todo el ancho de la pantalla, con su contenido centrado en una fila de `columns.total` y `gap: columns.gap`; la barra de desplazamiento queda contra el borde derecho de la pantalla.
    - Dentro de esa fila, la ruta ocupa `columns.route` con `paddingTop: statusBarTop(space.md)`, `paddingHorizontal: space.lg` y `paddingBottom: space.xxl`; adentro van `RecoveryCard` si corresponde y `UnitPath`. A la derecha se reserva un espacio de `columns.panel` para que la ruta no quede debajo del panel.
    - El panel derecho de ancho `columns.panel` es una columna más de la fila con `position: 'sticky'` y `alignSelf: 'flex-start'`: queda pegado arriba mientras la ruta se desplaza, pero vive dentro del mismo scroll, así la rueda sobre el panel también desplaza la página. Su alto máximo es el de la ventana; si el tamaño de letra no alcanza, se desplaza por dentro y al llegar al final sigue la página. Contiene dos tarjetas:
      1. **Próximo paso:** el mismo texto de `home.lessonCaption` con la lección sugerida y un `Button3D` primario con `common.continue` o `common.start`, que llama a `startLesson(suggested)`. Si no hay `suggested`, no se muestra.
      2. **Racha y monedas:** la misma fila de hoy (dos `StatIcon` con el número en dorado), dentro de una tarjeta. Se mantienen los `accessibilityLabel` `home.streakLabel` y `common.coinsLabel`.
    - `UnitMenu` queda en la raíz de la pantalla, como hoy.
  - En ancho no se renderizan la fila de estadísticas de arriba ni la tarjeta flotante. `RecoveryCard` sigue en la columna de la ruta.
  - No se agregan textos ni traducciones: se reutilizan `home.lessonCaption`, `common.continue`, `common.start`, `home.streakLabel` y `common.coinsLabel`.
  - La lógica de `chosen`, `lastUnit`, `suggested`, `startLesson` y `UnitMenu` no cambia; se comparte entre las dos ramas.

### 5.5 Breakpoints y tamaños

- Ancho = 960 px o más (`WIDE_MIN_WIDTH`), igual que las etapas 1 y 2.
- Barra lateral: 76 px con solo íconos entre 960 y 1199; 232 px con etiquetas desde 1200 (`SIDEBAR_LABELS_MIN_WIDTH`).
- El contenido disponible se calcula con `wideContentWidth` a partir del ancho de la ventana y de esos dos anchos.
- La fila de Aprender se centra dentro del ancho disponible menos los 20 px de la barra. A 960 la ruta mide 560 y la fila 864; a 1024, 624 y 928; desde 1200, 640 y 944. A 1440 la fila deja 122 px por lado dentro del área de scroll. El ancho máximo de la ruta es 640 y el del conjunto 944.
- En Bots y Aperturas la columna máxima es 960; a 960 de ventana el contenido disponible es 884, así que la grilla usa ese ancho.

### 5.6 Accesibilidad

- Las tarjetas de la grilla conservan sus `accessibilityRole`, `accessibilityLabel` y `accessibilityState`.
- El foco de teclado de la barra lateral no cambia y las tarjetas se recorren con Tab en el orden visual.
- El panel derecho mantiene los textos accesibles de racha y monedas; el botón del próximo paso es un `Button3D` (Pressable) con su etiqueta.
- El scroll de la ruta y el del panel son independientes; el foco no queda atrapado.

## 6. Archivos previstos

Nuevos:

- `src/components/useWideGrid.ts`
- `src/components/wideHome.ts`
- `src/components/wideHome.test.ts`
- `src/components/wideLayout.test.ts`
- `docs/superpowers/specs/2026-11-12-pantalla-ancha-etapa-3-design.md` (este documento)

Modificados:

- `src/components/wideLayout.ts` (constantes de la barra lateral y `wideContentWidth`)
- `src/components/WideSidebar.tsx` (usar las constantes)
- `src/components/PieceSetPicker.tsx`
- `src/components/BoardThemePicker.tsx`
- `src/screens/CreditsScreen.tsx`
- `src/screens/BotGamesScreen.tsx`
- `src/app/(tabs)/bots.tsx`
- `src/app/(tabs)/aperturas.tsx`
- `src/screens/BotsScreen.tsx`
- `src/screens/OpeningsScreen.tsx`
- `src/screens/HomeScreen.tsx`
- `docs/superpowers/specs/2026-11-08-web-pantalla-ancha-design.md` (sección 11, al terminar)

No se tocan `src/i18n/*` ni `src/data/i18n/*`.

## 7. Etapas

| Etapa | Qué entra | Verificación |
|---|---|---|
| 1 | Hook `useWideGrid`, migración de las cuatro pantallas existentes, grillas de Bots y Aperturas | Navegador a 1440×900, 1024×768, 960×650 y 375×812; `tsc`, lint y tests |
| 2 | `wideContentWidth`, `homeWideColumns` con tests, y Aprender en dos columnas | Los mismos tamaños más 1200×800; el CTA, el menú de unidades y el scroll independiente |
| 3 | Validación final y actualización de la spec original | `npx tsc --noEmit`, `npx expo lint`, `npm test`, capturas a 375 px antes/después |

Cada etapa termina en un commit y una pausa para revisión, como pide el flujo SDD.

## 8. Calidad y verificación

- `npx tsc --noEmit` sin errores.
- `npx expo lint` sin avisos.
- `npm test` completo en verde, con las pruebas nuevas de `wideHome` y `wideContentWidth`.
- Navegador (servidor de desarrollo; `expo start --web` sirve en `/`, no en `/app`):
  - 1440×900, 1200×800, 1024×768 y 960×650: Bots y Aperturas en dos columnas, sin desborde horizontal; Aprender con ruta y panel, sin desborde; la barra de la ruta queda contra el borde derecho de la pantalla; el panel no se mueve al hacer scroll en la ruta.
  - 375×812: Bots, Aperturas y Aprender exactamente como hoy (capturas antes/después).
  - Probar el CTA del próximo paso, el menú de unidades, abrir una lección y volver, y entrar a un bot y a un curso desde las grillas.
- Revisar que no haya textos nuevos: los tests de i18n y `noHardcoded` siguen pasando.
- Sin cambios en la app nativa: `useWideLayout` es `false`; `useWideGrid` devuelve estilos `undefined`; la rama angosta de `HomeScreen` es la actual.

## 9. Preguntas abiertas

Ninguna. La meta diaria quedó fuera de alcance por decisión del 12-11-2026 (opción A): la columna derecha muestra solo racha, monedas y el próximo paso.

## 10. Criterios de finalización

- Bots y Aperturas usan dos columnas en pantalla ancha y una sola en el celular, con las mismas tarjetas y estados.
- Aprender en pantalla ancha tiene la ruta a la izquierda con scroll propio a todo el ancho, la barra contra el borde derecho de la pantalla y el panel fijo a la derecha con próximo paso, racha y monedas; en angosto no cambia nada.
- El patrón de grilla vive en un solo lugar y lo usan las seis pantallas.
- `tsc`, lint y `npm test` pasan.
- La spec original tiene la sección 11 con la etapa 3 terminada.

## 11. Corrección (13-11-2026)

- La barra de desplazamiento de Aprender pasó del borde de la columna de la ruta al borde derecho de la pantalla.
- Se reservan `HOME_SCROLLBAR = 20` px a la derecha y se ajustan los anchos: 560 px de ruta a 960, 624 a 1024 y 640 desde 1200. La fila mide 864, 928 y 944, respectivamente.
- El caso de 960 sigue sin desborde horizontal y ahora deja 20 px para la barra; el panel queda a 20 px del borde derecho.
- Corrección 2 (13-11-2026): el panel estaba en una capa absoluta superpuesta y su `ScrollView` se quedaba con la rueda del mouse; con el puntero sobre la columna, la página no se desplazaba. Ahora el panel es una columna `position: 'sticky'` dentro del scroll de la ruta: sigue pegado arriba, la rueda sobre el panel desplaza la página y, si el panel necesita desplazarse por dentro, lo hace primero y después continúa la página. Comprobado en el navegador a 1280×800, 1024×650 y 960×650, y a 375 px sin cambios en el celular.
