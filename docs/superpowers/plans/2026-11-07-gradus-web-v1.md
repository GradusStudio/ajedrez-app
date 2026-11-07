# Gradus web, versión 1: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gradus funciona como app web instalable en `graduschess.com`, sin internet después de la primera carga, con el progreso en el dispositivo y exportación e importación en `.json`.

**Architecture:** El mismo código Expo/React Native compila para la web con `react-native-web`. Lo propio de la web va en archivos `.web.ts(x)`, que Metro elige solo. Los motores corren en un `iframe` oculto con la misma página de hoy. Un service worker generado con Workbox deja todo disponible sin conexión. Cloudflare sirve `dist/` como sitio estático con encabezados de seguridad.

**Tech Stack:** Expo SDK 58, Expo Router, react-native-web 0.21, TypeScript, node:test con tsx, Workbox (`workbox-build`), sharp, Cloudflare Workers (static assets) con wrangler.

**Spec:** `docs/superpowers/specs/2026-11-07-version-web-design.md` (sección «Etapas», versión 1, y las secciones 1, 2, 3, 4 (combinación y exportación), 6, 7 y 8, más «Interfaz nueva y antislop»).

## Global Constraints

- Trabajar en un worktree nuevo, rama `web-v1`, cortada desde `main`. La rama `prueba-web` es solo referencia: no se fusiona.
- Autor de todos los commits: `Gradus Studio <349628194+GradusStudio@users.noreply.github.com>`. Ningún archivo, commit ni texto puede llevar el nombre real o un correo personal del autor. Correo público: `gradusstudioapp@gmail.com`.
- Claves de guardado sin cambios: `ajedrez:progreso`, `@ajedrez/settings`, `@ajedrez/pieceSet`.
- Textos nuevos en los cinco idiomas (`src/i18n/{es,en,de,it,fr}.ts`). de, it y fr se traducen con gemma4 vía Ollama (`http://localhost:11434`, `POST /api/generate`, `"stream": false`, `"think": false`) y se revisan a mano (puntuación, mismos términos que la app).
- Textos en español sin exclamaciones en mensajes del sistema; sin raya larga (`—`) en ningún texto nuevo (antislop R-02).
- Lo de la web va en `.web.ts(x)`; nada de `Platform.OS === 'web'` desparramado, salvo para ocultar una fila de una pantalla compartida.
- Android sigue compilando y funcionando como hoy (`npx expo export -p android` sin errores).
- Al terminar cada tarea: `npm test`, `npx tsc --noEmit` y `npx expo lint` sin errores ni avisos nuevos.
- Las pantallas nuevas siguen `docs/design.md` y la sección «Interfaz nueva y antislop» del diseño: diales ENERGÍA 2 / RITMO 1 / MOVIMIENTO 1, sin landing, sin cifras ni testimonios, CTA con verbo concreto. Antes de crear cualquier imagen nueva (capturas de pasos, íconos distintos de los derivados del ícono actual), preguntarle al autor (R-23).

## Review Focus

1. **Archivo de importación ajeno o roto** (otra app, JSON dañado, versión de progreso más nueva que la que la app conoce): se muestra un error claro y el progreso no cambia. Prueba en la Tarea 6.
2. **`localStorage` que falla** (Safari en modo privado o almacenamiento lleno): la app abre igual, no pisa datos y no se rompe al guardar. Prueba en la Tarea 5 (`loadProgress` con almacenamiento que lanza).
3. **Abrir Puzzles sin conexión antes de haberlos descargado alguna vez**: estado de error con «Reintentar», nunca pantalla en blanco. Prueba en la Tarea 7.
4. **Una actualización publicada en medio de una lección**: la app no se recarga sola. El service worker nuevo espera a la próxima apertura. Verificación en la Tarea 8.
5. **El botón «atrás» del navegador en medio de una lección**: el avance de la lección se guarda como borrador, igual que al salir con la X. Verificación en la Tarea 3.

---

### Task 1: Compilar para la web y apagar lo que no existe en el navegador

**Files:**
- Modify: `package.json` (dependencia `react-native-web` con `npx expo install react-native-web`; script `"build:web": "expo export -p web && node scripts/build-sw.js"`, por ahora solo `expo export -p web` hasta la Tarea 8)
- Modify: `app.json` (`expo.web`: `"output": "single"`, `"bundler": "metro"`, `"name": "Gradus"`, `"shortName": "Gradus"`, `"backgroundColor": "#262421"`, `"themeColor": "#262421"`)
- Modify: `src/app/_layout.tsx` (no llamar a `NavigationBar` en la web)
- Create: `src/settings/reminders.web.ts`
- Modify: `src/screens/SettingsScreen.tsx`, `src/app/resultado.tsx` (ocultar el recordatorio cuando `!REMINDERS_SUPPORTED`)

**Interfaces:**
- Produces: `export const REMINDERS_SUPPORTED: boolean` en `src/settings/reminders.ts` (`true`) y `src/settings/reminders.web.ts` (`false`). `reminders.web.ts` exporta las mismas funciones que `reminders.ts`, sin hacer nada (`ensureReminderPermission` devuelve `false`).

- [ ] **Step 1: Crear el worktree** `git worktree add ../ajedrez-web-v1 -b web-v1 main` y `npm ci` adentro.
- [ ] **Step 2: Instalar react-native-web y configurar `app.json`** con los valores de arriba.
- [ ] **Step 3: Apagar la barra de navegación del sistema en la web.** En `_layout.tsx`, la llamada a `NavigationBar.setVisibilityAsync` va dentro de `if (Platform.OS === 'android')`.
- [ ] **Step 4: Crear `reminders.web.ts`** y agregar `REMINDERS_SUPPORTED` a los dos archivos. En Ajustes, la sección «Práctica» y en `resultado.tsx` la oferta del recordatorio se muestran solo si `REMINDERS_SUPPORTED`.
- [ ] **Step 5: Compilar.** Run: `npx expo export -p web`. Expected: termina con `Exported: dist`, sin errores. Run: `npx expo export -p android`. Expected: sin errores.
- [ ] **Step 6: Verificar en el navegador** (`npx expo start --web`): la bienvenida y la ruta de Aprender cargan, la consola no muestra errores (los avisos de `useNativeDriver` se aceptan), Ajustes no muestra el recordatorio.
- [ ] **Step 7: Commit** `"Web: compilar con react-native-web y ocultar el recordatorio"`.

### Task 2: Stockfish y Maia en la web, y una sola red de Maia por partida

**Files:**
- Create: `src/engine/HiddenFrame.web.tsx`, `src/engine/EngineView.web.tsx`, `src/engine/maia/MaiaView.web.tsx` (partir de la rama `prueba-web`)
- Modify: `src/engine/maia/nets.ts`, `src/engine/maia/MaiaView.tsx`
- Test: `src/engine/maia/maia.test.ts`

**Interfaces:**
- Produces: `loadNetBase64(id: MaiaNetId): Promise<string>` en `nets.ts`, que reemplaza a `netBase64`. Cada red se importa con `import()` dinámico de su `.generated.ts`, para que la web baje solo la que usa el bot.
- Produces: `HiddenFrame({ html, onMessage, onSend })` donde `onSend: (send: ((call: { fn: 'sendToEngine' | 'sendToMaia'; arg: string }) => void) | null) => void`.

- [ ] **Step 1: Escribir la prueba que falla** en `maia.test.ts`:

```ts
test('loadNetBase64 devuelve la misma red que el archivo generado', async () => {
  const { MAIA_1500 } = await import('./redes/maia1500.generated');
  assert.equal(await loadNetBase64(1500), MAIA_1500);
});
```

- [ ] **Step 2: Correrla.** Run: `npm test`. Expected: FAIL, `loadNetBase64` no existe.
- [ ] **Step 3: Implementar `loadNetBase64`** y cambiar `MaiaView.tsx` (nativo) y `MaiaView.web.tsx` para que armen la página cuando la promesa termina; mientras tanto no montan nada y el reloj de `engine.arm()` sigue corriendo como hoy. Las pruebas de Maia que usaban `netBase64` pasan a `await loadNetBase64`.
- [ ] **Step 4: Correr las pruebas.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: `HiddenFrame` sin `eval`.** Llama a `frame.contentWindow[fn](arg)`; si la función todavía no existe, descarta el mensaje igual que hoy cuando el WebView no cargó. Se limpian la función global y el `srcdoc` al desmontar.
- [ ] **Step 6: Verificar en el navegador:** `/analisis-libre` llega a «Profundidad 20» con tres variantes; `/partida?bot=sofia&color=b`, después de 1…a6, Sofía responde y en la pestaña de red se descarga una sola red de Maia. Compilar con `npx expo export -p web` y anotar en el mensaje de commit el tamaño del paquete de la partida antes (5,1 MB) y después.
- [ ] **Step 7: Commit** `"Web: motores en un iframe oculto y una red de Maia por partida"`.

### Task 3: Diálogos que funcionan en la web

`Alert.alert` no hace nada en react-native-web: hoy, en la web, no se puede confirmar «Borrar progreso», rendirse ni comprar un tablero.

**Files:**
- Create: `src/components/dialog.ts`, `src/components/dialog.web.ts`
- Modify: los 14 usos de `Alert.alert` (`resultado.tsx`, `BoardThemePicker.tsx`, `PieceSetPicker.tsx`, `LessonPlayer.tsx`, `GameScreen.tsx`, `HomeScreen.tsx`, `OpeningDetailScreen.tsx`, `SettingsScreen.tsx`)
- Modify: `src/i18n/noHardcoded.test.ts` (que revise los argumentos de `showDialog` igual que hoy los de `Alert.alert`)
- Test: `src/components/dialog.web.test.ts`

**Interfaces:**
- Produces: `type DialogButton = { text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }` y `showDialog(title: string, message: string, buttons?: DialogButton[]): void`. Nativo: llama a `Alert.alert`. Web: sin botones o con uno, `window.alert` y después `onPress`; con dos (uno `cancel` y uno de acción), `window.confirm` y llama al `onPress` del que corresponda. Más de dos botones lanza un error (hoy no hay ninguno).

- [ ] **Step 1: Escribir las pruebas que fallan** en `dialog.web.test.ts`, con `globalThis.window` simulado:
  - `confirm` devuelve `true` → se llama al `onPress` del botón que no es `cancel`, no al del `cancel`.
  - `confirm` devuelve `false` → se llama al `onPress` del `cancel` (si tiene) y no al otro.
  - Sin botones → se llama a `alert` una vez con `title + '\n\n' + message`.
  - Tres botones → lanza.
- [ ] **Step 2: Correrlas.** Run: `npm test`. Expected: FAIL.
- [ ] **Step 3: Implementar `dialog.ts` y `dialog.web.ts`** y reemplazar los 14 `Alert.alert` por `showDialog`. Actualizar `noHardcoded.test.ts`.
- [ ] **Step 4: Correr las pruebas.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Borrador al salir con «atrás» del navegador** (Review Focus 5). En la web, el botón «atrás» desmonta `LessonPlayer` sin pasar por el diálogo de salida. Guardar el borrador (`saveDraft`) también al desmontar si la lección no terminó. Verificar: empezar una lección, avanzar dos pasos, «atrás» del navegador, volver a entrar: retoma en el paso 3.
- [ ] **Step 6: Verificar en el navegador** cada diálogo: borrar progreso (cancelar y confirmar), rendirse, abandonar, comprar un tablero con y sin monedas, salir de una lección, lección bloqueada.
- [ ] **Step 7: Commit** `"Web: diálogos con confirm y borrador al volver atrás"`.

### Task 4: Vibración y conexiones en la web

**Files:**
- Modify: `src/feedback/feedback.ts` (vibración por plataforma)
- Create: `src/feedback/haptics.ts`, `src/feedback/haptics.web.ts`
- Create: `src/review/userAgent.ts`, `src/review/userAgent.web.ts`
- Modify: `src/review/sources.ts`

**Interfaces:**
- Produces: `vibrate(kind: 'success' | 'error' | 'tap'): void`. Nativo: lo que hace hoy `feedback.ts`. Web: `navigator.vibrate?.(kind === 'error' ? [60, 40, 60] : 30)`; si no existe, nada.
- Produces: `fetchHeaders(accept: string): Record<string, string>`. Nativo: `{ Accept, 'User-Agent': 'Gradus-Chess-App/1.0' }`. Web: `{ Accept }` (el navegador no deja cambiar el User-Agent).

- [ ] **Step 1: Mover la vibración** a `haptics.ts` / `haptics.web.ts` y usar `vibrate` desde `feedback.ts`.
- [ ] **Step 2: Usar `fetchHeaders`** en las dos llamadas de `sources.ts`.
- [ ] **Step 3: Verificar en el navegador:** importar la última partida de un usuario de Lichess y uno de chess.com desde `/importar-partida`; las dos cargan. Los sonidos `move`, `capture`, `correct` y `wrong` suenan después del primer toque (escucharlos; los registros del reproductor no sirven para saberlo, ver `CLAUDE.md`).
- [ ] **Step 4: Commit** `"Web: vibración del navegador y pedidos sin User-Agent propio"`.

### Task 5: Progreso versión 4: combinar, borrar y monedas por dispositivo

**Files:**
- Modify: `src/progress/progressStore.ts`, `src/progress/ProgressContext.tsx`
- Create: `src/progress/merge.ts`
- Test: `src/progress/merge.test.ts`, `src/progress/progressStore.test.ts`

**Interfaces:**
- Produces, en `Progress` (`version: 4`): `deviceId: string`, `resetAt: string | null`, `coinLedger: Record<string, { earned: number; spent: number }>`, `stamps: { level?: string; lastUnit?: string }` (fecha ISO del último cambio de cada campo). `coins` se mantiene como saldo derivado: siempre igual a `coinBalance(p.coinLedger)`.
- Produces: `coinBalance(ledger: Progress['coinLedger']): number` (suma de `earned` menos suma de `spent`).
- Produces: `mergeProgress(local: Progress, incoming: Progress): Progress` en `merge.ts`. El resultado conserva `local.deviceId`.
- Changes: `migrate(data, newDeviceId: string)` y `loadProgress(newDeviceId = randomId())`; `withCoins` suma a `coinLedger[p.deviceId].earned`; las compras suman a `.spent`; `withProfile` y `withLastUnit` actualizan `stamps`.
- ProgressContext: `resetProgress` deja `{ ...emptyProgress, profile, deviceId, resetAt: new Date().toISOString() }`; nuevo `importProgress(incoming: Progress): void` que hace `commit(mergeProgress(current, incoming))`.

- [ ] **Step 1: Escribir las pruebas que fallan** en `merge.test.ts`. Reglas de la tabla «Cómo se combinan dos versiones» del diseño, una prueba por fila, más:
  - `mergeProgress(a, b)` y `mergeProgress(b, a)` dan lo mismo en todo salvo `deviceId` (con dos progresos variados de ejemplo).
  - `mergeProgress(a, a)` devuelve un progreso igual a `a`.
  - Monedas: dispositivo A gana 30 y gasta 0, B gana 15 y gasta 10 → saldo combinado `35`, y combinar dos veces no lo cambia.
  - `resetAt`: si `b.resetAt` es más reciente que `a.resetAt` (o `a.resetAt` es `null`), el resultado tiene las lecciones de `b` y ninguna de `a`.
  - `games`: la misma partida (`playedAt` y `botId` iguales) en los dos aparece una sola vez; tope 50.
- [ ] **Step 2: Escribir las pruebas que fallan** en `progressStore.test.ts` (simular AsyncStorage con un mapa en memoria):
  - Migrar un progreso versión 3 con `coins: 120` da `version: 4`, `coinLedger: { [id]: { earned: 120, spent: 0 } }` y `coins: 120`.
  - Comprar un tablero de 200 con 250 monedas deja `spent: 200` y `coins: 50`.
  - Si `getItem` lanza, `loadProgress` devuelve `canSave: false` y no llama a `setItem` (Review Focus 2).
- [ ] **Step 3: Correrlas.** Run: `npm test`. Expected: FAIL.
- [ ] **Step 4: Implementar** `merge.ts`, la versión 4 y su migración, y los cambios del contexto. `loadProgress` acepta versiones `[1, 2, 3, 4]`. `randomId()` usa `crypto.randomUUID()`.
- [ ] **Step 5: Correr las pruebas.** Run: `npm test`. Expected: PASS, incluidas las de `streak.test.ts`.
- [ ] **Step 6: Verificar en el navegador** con un progreso versión 3 pegado a mano en `localStorage['ajedrez:progreso']`: la app abre con las mismas lecciones y monedas, y el valor guardado pasa a `version: 4`.
- [ ] **Step 7: Commit** `"Progreso v4: combinar versiones, borrar con resetAt y monedas por dispositivo"`.

### Task 6: Exportar e importar el progreso (web)

**Files:**
- Create: `src/progress/progressFile.ts`, `src/progress/progressFile.test.ts`
- Create: `src/progress/fileIO.ts` (nativo: no disponible), `src/progress/fileIO.web.ts`
- Modify: `src/screens/SettingsScreen.tsx` (sección «Datos»), `src/i18n/*.ts`

**Interfaces:**
- Consumes: `mergeProgress`, `importProgress` (Tarea 5), `showDialog` (Tarea 3).
- Produces: `progressToFile(p: Progress, now: Date): string` → JSON `{ app: 'gradus', kind: 'progress', exportedAt, progress }`.
- Produces: `parseProgressFile(text: string): { ok: true; progress: Progress } | { ok: false; error: 'notJson' | 'notGradus' | 'tooNew' }`. Una versión 1 a 3 se migra; una versión mayor que 4 es `tooNew`.
- Produces: `FILE_IO_SUPPORTED: boolean`, `saveTextFile(name: string, text: string): void`, `pickTextFile(): Promise<string | null>` (`null` si el usuario cancela).

- [ ] **Step 1: Escribir las pruebas que fallan** en `progressFile.test.ts` (Review Focus 1): ida y vuelta da el mismo progreso; `'hola'` → `notJson`; `{"app":"otra"}` → `notGradus`; un archivo con `progress.version: 5` → `tooNew`; un archivo con progreso versión 3 se migra.
- [ ] **Step 2: Correrlas.** Run: `npm test`. Expected: FAIL.
- [ ] **Step 3: Implementar** `progressFile.ts` y `fileIO.web.ts` (descarga con `Blob` y un `<a download>` temporal; selección con un `<input type="file" accept="application/json,.json">` temporal).
- [ ] **Step 4: Correr las pruebas.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Filas en Ajustes > Datos**, solo si `FILE_IO_SUPPORTED`, antes de «Borrar progreso»: «Guardar una copia del progreso» (descarga `gradus-progreso-AAAA-MM-DD.json`) y «Cargar una copia» (elige el archivo, avisa con `showDialog` que se va a combinar con el progreso actual, y combina). Errores con un mensaje por cada `error`, sin exclamaciones. Textos nuevos en los cinco idiomas.
- [ ] **Step 6: Verificar en el navegador:** exportar, borrar progreso, importar: vuelven lecciones y monedas. Importar un `.txt` cualquiera: mensaje de error y el progreso no cambia. Las dos filas se manejan con teclado (Tab y Enter).
- [ ] **Step 7: Commit** `"Web: guardar y cargar una copia del progreso"`.

### Task 7: Puzzles fuera del paquete principal

**Files:**
- Modify: `src/puzzles/puzzles.ts`
- Create: `src/puzzles/usePuzzles.ts`
- Modify: `src/app/puzzle.tsx`, `src/screens/PuzzleScreen.tsx`, `src/screens/PuzzlesScreen.tsx`, `src/screens/ProfileScreen.tsx`
- Test: `src/puzzles/puzzles.test.ts`

**Interfaces:**
- Produces: `parsePuzzles(raw: { puzzles: Raw[] }): Puzzle[]`, `loadPuzzles(): Promise<Puzzle[]>` (con `import('./puzzles.json')`, memorizada: dos llamadas comparten la misma promesa; si falla, la siguiente llamada vuelve a intentar).
- Produces: `usePuzzles(): { status: 'loading' } | { status: 'error'; retry: () => void } | { status: 'ready'; puzzles: Puzzle[] }`.
- Changes: `dailyPuzzle`, `nextPuzzle`, `countPuzzles` y `findPuzzle` reciben `puzzles: Puzzle[]` como primer parámetro.

- [ ] **Step 1: Escribir las pruebas que fallan** en `puzzles.test.ts`: `parsePuzzles` arma `moves` y `themes` como hoy; `dailyPuzzle(lista, fecha)` es el mismo para la misma fecha; `loadPuzzles` rechazada una vez se puede reintentar y la segunda resuelve (inyectar el cargador para la prueba).
- [ ] **Step 2: Correrlas.** Run: `npm test`. Expected: FAIL.
- [ ] **Step 3: Implementar** y pasar las cuatro pantallas a `usePuzzles`. Estados: cargando («Cargando puzzles…», sin girar más de lo necesario), error («No se pudieron cargar los puzzles. Revisa la conexión.» con un botón «Reintentar»), listo. Textos en los cinco idiomas.
- [ ] **Step 4: Correr las pruebas.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Comprobar el tamaño.** Run: `npx expo export -p web`. Expected: los puzzles salen en un archivo aparte y el paquete común baja de 13 MB a menos de 7 MB. Si Metro no separa el JSON, mover `puzzles.json` a un archivo que la web descarga con `fetch` (`src/puzzles/source.web.ts`) y el nativo sigue importándolo.
- [ ] **Step 6: Verificar en el navegador** con la red en «sin conexión» antes de abrir Puzzles por primera vez: aparece el error con «Reintentar»; con la red de vuelta, «Reintentar» carga (Review Focus 3).
- [ ] **Step 7: Commit** `"Web: puzzles en un archivo aparte, con estados de carga y error"`.

### Task 8: App instalable y sin internet

**Files:**
- Create: `public/manifest.webmanifest`, `public/index.html` (plantilla de Expo con el manifiesto, `theme-color`, `apple-touch-icon`, `apple-mobile-web-app-capable`, `lang` según el idioma del navegador al cargar)
- Create: `scripts/build-web-icons.js` (sharp: `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon-180.png`, todos desde `assets/fuente/icono-figura.png` sobre `#262421`; en el maskable la figura ocupa el 60 % central)
- Create: `scripts/build-sw.js` (`workbox-build` `generateSW` sobre `dist/`)
- Create: `src/pwa/register.ts` (nativo: nada), `src/pwa/register.web.ts`
- Modify: `src/app/_layout.tsx`, `package.json` (`build:web` completo, `workbox-build` como devDependency)

**Interfaces:**
- Produces: `registerServiceWorker(): void` y `requestPersistentStorage(): void` (llama a `navigator.storage.persist()` solo si la app está instalada, `matchMedia('(display-mode: standalone)')`).

- [ ] **Step 1: Generar los íconos** con `node scripts/build-web-icons.js` y mostrárselos al autor antes de seguir (R-23).
- [ ] **Step 2: Manifiesto:** `name` «Gradus», `short_name` «Gradus», `start_url` `/`, `scope` `/`, `display` `standalone`, `orientation` `portrait`, `background_color` y `theme_color` `#262421`, los tres íconos (el maskable con `purpose: "maskable"`).
- [ ] **Step 3: Service worker:** precache de todo `dist/` salvo el archivo de puzzles y las redes de Maia; esos dos con `CacheFirst` en tiempo de ejecución. `skipWaiting: false` y `clientsClaim: false`: la versión nueva se activa en la próxima apertura (Review Focus 4). `navigateFallback: '/index.html'`.
- [ ] **Step 4: Registrar** el service worker al cargar, solo en producción (`!__DEV__`).
- [ ] **Step 5: Verificar** con `npm run build:web` y `npx serve dist -s`: Chrome muestra la app como instalable (DevTools > Application > Manifest sin errores); con la red en «sin conexión» y recargando, la app abre y una lección funciona; un puzzle ya abierto antes sigue disponible; publicar un cambio cualquiera con una lección abierta no la recarga, y el cambio aparece al cerrar y abrir.
- [ ] **Step 6: Commit** `"Web: manifiesto, íconos y service worker para usarla sin conexión"`.

### Task 9: Instalar Gradus (`/instalar`, aviso y bienvenida en iPhone)

**Files:**
- Create: `src/pwa/installPlatform.ts`, `src/pwa/installPlatform.test.ts`
- Create: `src/pwa/useInstallPrompt.ts` (nativo: `{ canPrompt: false }`), `src/pwa/useInstallPrompt.web.ts`
- Create: `src/app/instalar.tsx`, `src/screens/InstallScreen.tsx`
- Modify: `src/screens/OnboardingScreen.tsx`, `src/screens/LessonResultScreen.tsx` o `src/app/resultado.tsx`, `src/settings/sanitize.ts` (`installOffered: boolean`, por defecto `false`), `src/i18n/*.ts`

**Interfaces:**
- Produces: `detectInstallPlatform(userAgent: string, standalone: boolean, maxTouchPoints: number): 'installed' | 'ios' | 'android' | 'desktop'` (el iPad que se presenta como Mac se detecta por `maxTouchPoints > 1`).
- Produces: `useInstallPrompt(): { canPrompt: boolean; prompt: () => Promise<'accepted' | 'dismissed'> }` sobre el evento `beforeinstallprompt`.

- [ ] **Step 1: Escribir las pruebas que fallan** en `installPlatform.test.ts` con User-Agent reales de Chrome en Android, Safari en iPhone, Safari en iPad (Mac + toques), Chrome en Windows, y `standalone: true` → `installed`.
- [ ] **Step 2: Correrlas.** Run: `npm test`. Expected: FAIL.
- [ ] **Step 3: Implementar** `detectInstallPlatform` y `useInstallPrompt`.
- [ ] **Step 4: Correr las pruebas.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Pantalla `/instalar`** según «Interfaz nueva y antislop» del diseño: ícono real, «Gradus», una línea que dice qué es, los pasos del sistema detectado primero y los demás plegados debajo. Un solo foco: en Android y computadora, el botón «Instalar Gradus» si `canPrompt` (si no, los pasos del menú del navegador); en iPhone, los pasos de Safari (Compartir, Agregar a inicio). Segundo botón: «Abrir Gradus en el navegador» (va a `/`). Si ya está instalada, «Gradus ya está instalada» y el botón para abrirla. Sin imágenes de pasos hasta que el autor apruebe capturas.
- [ ] **Step 6: iPhone en la bienvenida:** si `detectInstallPlatform` da `ios`, la primera pantalla de la bienvenida ofrece instalar primero (explica que lo hecho en Safari no pasa a la app instalada) y deja «Seguir en el navegador».
- [ ] **Step 7: Aviso después de la primera lección:** en el resultado de una lección, si la plataforma no es `installed` y `!settings.installOffered`, una tarjeta con «Instalar Gradus» que lleva a `/instalar`; al mostrarse, `installOffered` pasa a `true`. Nunca junto con la oferta del recordatorio (en la web no existe).
- [ ] **Step 8: Verificar en el navegador** con la emulación de Android, iPhone y escritorio: cada plataforma ve sus pasos primero, el botón de Chrome abre el diálogo de instalación, todo se maneja con Tab, Enter y Escape, foco visible, sin desbordes a 360 px de ancho.
- [ ] **Step 9: Commit** `"Web: pantalla para instalar Gradus y avisos de instalación"`.

### Task 10: Privacidad, créditos y pantallas anchas

**Files:**
- Create: `src/app/privacidad.tsx`, `src/screens/PrivacyScreen.tsx`
- Modify: `src/screens/CreditsScreen.tsx`, `src/app/_layout.tsx` (columna centrada), `src/i18n/*.ts`

**Interfaces:**
- Consumes: nada nuevo.

- [ ] **Step 1: Política de privacidad** en `/privacidad`, en los cinco idiomas, con lo que es cierto en la versión 1: el progreso y los ajustes se guardan solo en el dispositivo; no hay cuentas, analítica ni anuncios; la importación de partidas consulta las APIs públicas de chess.com o Lichess con el usuario que se escribe; el sitio lo sirve Cloudflare; contacto `gradusstudioapp@gmail.com`; fecha de la versión. Partir del texto de `gradus-web/privacidad.html` y quitar lo que ya no aplica.
- [ ] **Step 2: Créditos:** enlace al código fuente (`https://github.com/GradusStudio/ajedrez-app`, con la aclaración de que se publica con cada versión) y enlace a `/privacidad`.
- [ ] **Step 3: Columna centrada:** en `_layout.tsx`, en la web, el contenido va en un contenedor de `maxWidth: 480`, centrado, con `bg` a los costados. En el celular no cambia nada.
- [ ] **Step 4: Verificar en el navegador** a 360, 768 y 1440 px: sin desbordes, la columna centrada en anchos grandes, `/privacidad` se lee en los cinco idiomas, los enlaces de Créditos abren su destino.
- [ ] **Step 5: Commit** `"Web: política de privacidad, enlace al código y columna en pantallas anchas"`.

### Task 11: Publicar en Cloudflare

**Files:**
- Create: `wrangler.jsonc` (`name: "gradus"`, `compatibility_date` del día, `assets: { directory: "./dist", not_found_handling: "single-page-application" }`, sin `main`: solo archivos estáticos)
- Create: `public/_headers`

**Interfaces:**
- Consumes: `npm run build:web` (Tarea 8).

- [ ] **Step 1: `_headers`** para `/*`:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; worker-src 'self' blob:; connect-src 'self' https://lichess.org https://api.chess.com; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' about:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

`'unsafe-inline'` en `script-src` es necesario porque las páginas de los motores van en un `iframe` `srcdoc`, que hereda la política de la página; la app no muestra HTML de terceros. Para `/sw.js`: `Cache-Control: no-cache`. Verificar con la app servida localmente con estos encabezados (`npx wrangler dev`) que los motores, los puzzles, la importación de partidas y el service worker siguen funcionando y que la consola no muestra violaciones de CSP.
- [ ] **Step 2: El autor conecta el repositorio en Cloudflare** (Workers & Pages > Create > Import a repository > `GradusStudio/ajedrez-app`, rama `main`, comando de build `npm ci && npm run build:web`, comando de deploy `npx wrangler deploy`) y agrega el dominio `graduschess.com` al Worker. El ejecutor le da estos pasos y espera; no crea cuentas ni entra con credenciales.
- [ ] **Step 3: Verificar en producción:** `curl -sI https://graduschess.com/` muestra los encabezados del Step 1; `/instalar`, `/privacidad` y una ruta profunda (`/leccion/u1-l02`) abren; la app se instala en el Redmi desde Chrome y en un iPhone desde Safari, si hay uno a mano (si no, decirlo).
- [ ] **Step 4: Commit** `"Web: configuración de Cloudflare y encabezados de seguridad"`.

### Task 12: Cierre de la versión 1

**Files:**
- Modify: `CLAUDE.md`, `docs/mapa-de-pantallas.md` (hito 7 reemplazado por la versión web), nota del vault `C:\Bobeda obsidian\ideas\Gradus\Gradus - Versión web.md`

- [ ] **Step 1: Control de entrega de antislop** sobre `/instalar`, el aviso de instalación, la bienvenida de iPhone, las filas de exportar e importar, `/privacidad` y la columna ancha: informe PASS/FAIL con prueba por ítem, incluido el recorrido de cada control (R-35). Un FAIL se corrige antes de seguir.
- [ ] **Step 2: Revisiones:** correr `thermo-nuclear-review` y `thermo-nuclear-code-quality-review` sobre el diff `main...web-v1`, corregir lo que el autor apruebe.
- [ ] **Step 3: Documentación:** `CLAUDE.md` (versión web, `build:web`, Cloudflare, archivos `.web`), `mapa-de-pantallas.md` y la nota del vault.
- [ ] **Step 4: Fusionar y etiquetar** con permiso del autor: `web-v1` a `main`, etiqueta `web-v1.0.0`, push. Hacer público el repositorio es una decisión aparte del autor (la GPL lo exige al publicar): preguntarle antes de compartir el enlace en TikTok.
