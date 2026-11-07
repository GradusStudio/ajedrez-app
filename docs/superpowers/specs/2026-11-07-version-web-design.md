# Gradus web: diseño

Fecha: 7-11-2026. Estado: borrador para aprobar.

## Por qué

Gradus es una app gratuita para aprender ajedrez, sin anuncios ni pagos. Publicarla en Google Play obliga a mostrar en la ficha el nombre legal del desarrollador (y el domicilio si la app cobra). El autor no acepta exponer su identidad, ni la de su familia, ni armar una empresa para evitarlo. Por eso Gradus se publica como **app web instalable (PWA)** en un dominio propio, `graduschess.com` (comprado en Cloudflare el 7-11-2026, con los datos del titular ocultos). La difusión es por TikTok, con un enlace directo.

Una prueba descartable (rama local `prueba-web`) mostró que el código actual compila para la web con `react-native-web`, y que lecciones, puzzles, guardado, importación de partidas, Stockfish y Maia funcionan. Los motores solo necesitaron reemplazar el WebView invisible por un `iframe` oculto con la misma página.

## Objetivos

1. Gradus funciona en el navegador de Android, iPhone y computadora, y se puede agregar a la pantalla de inicio como una app (pantalla completa, ícono propio).
2. Funciona **sin internet** después de la primera carga. Solo importar partidas de chess.com o Lichess necesita conexión.
3. El progreso se guarda siempre en el dispositivo y, si el usuario quiere, se **sincroniza solo** en su Google Drive. Sirve para cambiar de teléfono, borrar los datos del navegador o jugar desde la computadora.
4. Recordatorio diario con notificaciones Web Push, con los mismos textos de bots que hoy.
5. Para todo público (chicos y adultos).

## No objetivos

- Publicar en Google Play, App Store o cualquier tienda.
- Cuentas propias, contraseñas o una base de datos de usuarios.
- Anuncios, pagos o enlaces de pago dentro de la app.
- Un diseño propio para pantallas anchas en la primera versión (ver «Pantallas anchas»).

## Antiobjetivos (si pasa esto, fracasó aunque funcione)

- **Que aparezcan datos personales del autor** en la web, el código, el historial de git, los encabezados, la política de privacidad o la pantalla de permiso de Google. Lo único público es «Gradus Studio» y `gradusstudioapp@gmail.com`.
- **Que Gradus guarde datos personales de los usuarios** en un servidor propio (correos, nombres, progreso).
- Que un usuario **pierda progreso** por sincronizar (por ejemplo, monedas que desaparecen al juntar dos dispositivos).
- Que una lección, un puzzle o una partida se **interrumpan** por la sincronización, el permiso de Google o el recordatorio.
- Que la web **filtre direcciones de notificación** o permita mandar avisos a nombre de Gradus.

## Restricciones

- **Licencia GPL v3 o posterior.** El JavaScript y el WebAssembly de la app se entregan al navegador del usuario e incluyen Stockfish y Maia (GPL v3): el código de la app tiene que ser público y corresponder a lo publicado. El código del servidor de recordatorios puede quedar privado, porque solo corre en Cloudflare y no deriva de Stockfish ni de Maia.
- **Antes de hacer público el repositorio**, los 4 commits firmados con el correo personal del autor tienen que desaparecer del historial (ver «Preguntas abiertas»).
- **El progreso guardado se conserva**: las claves `ajedrez:progreso`, `@ajedrez/settings` y `@ajedrez/pieceSet` no cambian. En la web viven en `localStorage` del origen `graduschess.com`. El origen definitivo se usa desde el primer usuario real, porque el progreso local no se muda de dominio.
- **Alojamiento en Cloudflare** (cuenta con `gradusstudioapp@gmail.com`), plan gratis.
- Textos en los cinco idiomas, con la regla de siempre: de, it y fr traducidos con gemma4 vía Ollama y revisados.
- Diseño según `docs/design.md`: textos en español sin exclamaciones en mensajes del sistema, botones 3D, mismos colores.
- `noHardcoded.test.ts` y `npm test` siguen pasando.

## Lo que ya está decidido (por el autor)

- App web instalable en `graduschess.com`, sin tiendas.
- Alojada en Cloudflare, no en GitHub Pages.
- Progreso local siempre, y sincronización automática **opcional** en la carpeta oculta del Google Drive del usuario. Sin servidor de cuentas.
- Recordatorio diario con un servidor mínimo en Cloudflare.
- Seguridad del servidor: que no se puedan filtrar ni usar las direcciones de notificación.
- La vibración puede no andar en iPhone.
- Para todo público.

## Arquitectura

```
graduschess.com  (un solo Worker de Cloudflare)
├── /            app web (archivos estáticos de `expo export -p web` + service worker + manifiesto)
├── /instalar    cómo agregarla a la pantalla de inicio (Android, iPhone, computadora)
├── /privacidad  política de privacidad (reemplaza la de gradus-web)
└── /api/...     recordatorios (Web Push), base D1, tarea programada cada 5 minutos

Navegador del usuario
├── Stockfish  → iframe oculto con la página del motor (Worker + WASM), igual que hoy en el WebView
├── Maia       → iframe oculto con la página de Maia
├── Progreso   → localStorage (AsyncStorage de react-native-web)
└── Sync       → Google Drive del usuario, carpeta oculta `appDataFolder` (directo desde el navegador)
```

Un solo código para web y Android. Lo específico de la web va en archivos `.web.tsx` / `.web.ts` (Metro los elige solo), sin `if (Platform.OS === 'web')` desparramados. Android no se publica: «no se rompe» quiere decir que sigue compilando y funcionando como hoy, sin sincronización ni exportación propias. Decisión mía: la exportación e importación en `.json` se escribe para las dos plataformas solo si sale casi gratis; si no, solo web. El progreso del APK de prueba no se migra.

### 1. Motores (Stockfish y Maia)

- `src/engine/EngineView.web.tsx` y `src/engine/maia/MaiaView.web.tsx` montan la página de siempre (`buildEngineHtml`, `buildMaiaHtml`) en un `iframe` oculto (`srcdoc`) y le dan el `window.ReactNativeWebView.postMessage` que esperan. La prueba lo hizo con un componente `HiddenFrame.web.tsx` de unas 40 líneas. `UciEngine` y `MaiaEngine` no cambian.
- **Llamada al iframe:** la prueba usa `contentWindow.eval`. La versión final llama directo a `contentWindow.sendToEngine(cmd)` / `sendToMaia(json)`, sin `eval`, para que la política de seguridad (CSP) no tenga que permitir `unsafe-eval` en la página principal.
- **Solo la red del bot que juega:** hoy `nets.ts` mete las tres redes de Maia en el paquete de la partida (5 MB). En la web se cargan por separado, la del bot que se elige (pendiente que ya estaba anotado).

### 2. Peso y modo sin internet

- La prueba dio un paquete común de 13 MB (incluye los 50.000 puzzles, 6,8 MB) y 5 MB más para la partida.
- **Puzzles fuera del paquete:** `puzzles.json` pasa a ser un archivo que se descarga aparte y se cachea. La app abre sin esperarlo; la pestaña Puzzles muestra «Cargando puzzles…» la primera vez.
- **Service worker** (generado con Workbox después de `expo export`):
  - Guarda la app, las fuentes, imágenes, sonidos y texturas en la primera visita (precache).
  - Las redes de Maia y los puzzles se guardan la primera vez que se usan (cache-first).
  - Una actualización nueva se instala en segundo plano y se activa la próxima vez que se abre la app. Nunca recarga en medio de una lección, un puzzle o una partida.
- Pedir `navigator.storage.persist()` al instalar o al activar la sincronización, para que el navegador no borre los datos por falta de espacio.

### 3. App instalable

- Manifiesto con nombre «Gradus», `display: standalone`, colores del tema (#262421), íconos 192 y 512 (salen de `assets/fuente/icono-figura.png`, como los demás) e ícono «maskable».
- Etiquetas de Apple (`apple-touch-icon`, `apple-mobile-web-app-capable`) para iPhone.
- Página `/instalar` con los pasos por sistema, como cardcluster.es. En Android/Chrome, además, un botón «Instalar» que usa el evento `beforeinstallprompt`. En iPhone se explican los pasos de Safari (Compartir → Agregar a inicio), porque no hay botón.
- Aviso discreto de instalación dentro de la app (no en medio de una lección): por ejemplo, en el resultado de la primera lección terminada.
- **iPhone:** en iOS, la app agregada a la pantalla de inicio tiene su propio almacenamiento, separado del de Safari. Lo hecho en una pestaña de Safari no aparece después de instalar. Decisión mía: si Gradus se abre en Safari de iPhone sin estar instalada, la bienvenida ofrece primero instalarla (con los pasos) y deja «Seguir en el navegador» como segunda opción. Si el usuario sigue en Safari, el aviso de instalación posterior le recuerda que puede llevar su progreso con Google Drive o con la exportación.

### 4. Progreso y sincronización con Google Drive

**Guardado local:** igual que hoy, en `localStorage` con AsyncStorage.

**Activar la sincronización:** botón «Guardar mi progreso con Google» en Perfil y en Ajustes, y una sugerencia única al terminar la primera lección (como hoy se ofrece el recordatorio). Al tocarlo, Google Identity Services pide el permiso `https://www.googleapis.com/auth/drive.appdata` (solo la carpeta oculta de la app; Google lo clasifica como no sensible). Gradus no pide el correo ni el perfil.

**Archivo en Drive:** un único `gradus-progreso.json` en `appDataFolder`, con el progreso y los ajustes que tiene sentido llevar a otro dispositivo (idioma, notación, tablero, piezas; no el sonido ni la vibración, que dependen del aparato).

**Cuándo sincroniza:**
- Al abrir la app, si hay un permiso vigente.
- Al terminar una lección, un puzzle o una partida (se agrupa: como mucho una subida cada pocos segundos).
- Al recuperar la conexión (evento `online`).
- Al volver a la app (`visibilitychange`).

**Permiso vencido:** Google entrega permisos de una hora y renovarlo abre una ventanita, que el navegador solo permite después de un toque del usuario. Mi propuesta: renovar en el siguiente toque natural del usuario (por ejemplo «Continuar» al terminar una lección) y, mientras tanto, seguir guardando en el dispositivo sin avisos. El autor quiere que sea lo más automático posible: si se encuentra una forma de renovar sin ventanita y sin guardar tokens en un servidor, se prefiere esa. **El constructor tiene que comprobar en Chrome de Android y Safari de iPhone cómo se comporta la renovación antes de cerrar este punto.**

**Cómo se combinan dos versiones** (función pura `mergeProgress(a, b)`, conmutativa e idempotente, con pruebas en `npm test`):

| Dato | Regla |
|---|---|
| `lessons` | Por lección: hecha si alguna lo está; `errors` el menor; `completedAt` el más antiguo; `completions` el mayor |
| `drafts` | Se descarta si la lección ya está hecha; si no, el de `stepIndex` mayor |
| `puzzles` | Por puzzle, el mejor resultado (`clean` > `solved` > `failed`) |
| `turningPoints`, `pieceSets`, `boardThemes` | Unión |
| `mistakes` | Unión por `stepId`; `count` el mayor; `lastSeen` el más reciente |
| `games` | Unión por (`playedAt`, `botId`), más reciente primero, tope 50 |
| `rewards` | `goalDate` y cada `botWins[bot]`, la fecha más reciente |
| `streak` | La del `lastActiveDate` más reciente; si es el mismo día, la de `current` mayor; `best` el mayor de los dos |
| `practice` | Mismo día: el mayor; distinto: el del día más reciente |
| `profile` | `onboarded` si alguno; `level` el del dispositivo que lo cambió último |
| `lastUnit` y ajustes | El del dispositivo que lo cambió último (`updatedAt` por campo) |
| **Monedas** | Ver abajo |

**Monedas sin perder nada:** hoy `coins` es un saldo, y juntar dos saldos con «el más reciente» borra lo ganado en el otro dispositivo. Mi propuesta: guardar por dispositivo cuánto ganó y cuánto gastó (`coinLedger: { [deviceId]: { earned, spent } }`, contadores que solo crecen). Al combinar, por dispositivo se toma el mayor de cada contador, y el saldo es la suma de lo ganado menos la suma de lo gastado. La primera vez, el saldo actual entra como «ganado» del dispositivo. Comprar algo ya comprado en el otro dispositivo no puede pasar dos veces, porque las compras son una unión de conjuntos. Si dos dispositivos compran lo mismo sin conexión, se cobra dos veces: es un caso raro y se acepta, o el constructor puede devolver la diferencia al detectarlo. Esto sube `Progress.version` a 4 con su migración.

**Escrituras simultáneas:** Drive no bloquea el archivo. Como la combinación es conmutativa, cada sincronización baja, combina y sube. Si dos dispositivos suben a la vez, la siguiente sincronización de cualquiera de los dos vuelve a juntar todo. No se pierde nada, solo puede tardar una sincronización más.

**Borrar progreso** (ya existe en Ajustes, `resetProgress`): sin una regla, la siguiente sincronización traería de vuelta lo borrado desde Drive. Decisión mía: el progreso lleva un `resetAt` (fecha ISO, vacío al principio). Borrar el progreso pone `resetAt` en el momento actual. Al combinar, si los `resetAt` difieren, gana entera la versión con el `resetAt` más reciente y la otra se descarta. Así el borrado llega a Drive y a los demás dispositivos.

**Monedas cobradas dos veces:** si la misma lección o el mismo puzzle se hacen sin conexión en dos dispositivos antes de sincronizar, o el premio diario se cobra en los dos, las monedas se cobran dos veces. Decisión mía: se acepta. Es raro y de pocas monedas, y evitarlo obligaría a guardar el motivo de cada moneda.

**Desactivar:** «Dejar de sincronizar» revoca el permiso. El progreso local queda. Opción aparte: «Borrar mi copia en Google Drive».

**Sin cuenta de Google:** exportar e importar el progreso como archivo `.json` desde Ajustes. Al importar se combina con `mergeProgress`, no se reemplaza.

**Errores que se muestran** (sin exclamaciones, una línea, sin cortar lo que el usuario está haciendo): Drive lleno, cuenta que no lo permite (colegio, trabajo o supervisada), sin conexión (no se muestra: se reintenta solo).

### 5. Recordatorio diario (Web Push)

**Cliente** (`src/settings/reminders.web.ts`, que reemplaza a `expo-notifications` en la web):
- Al activar el recordatorio se pide el permiso de notificaciones y se crea la suscripción Push con la clave pública VAPID de Gradus.
- La app arma el plan de 7 días con `planReminders` (ya probado) y los textos ya traducidos al idioma del usuario, y los manda al servidor como horas UTC.
- `useReminderSync` sigue igual: cada vez que cambian ajustes o progreso, se manda el plan nuevo.
- El service worker muestra la notificación (`push`) y, al tocarla, abre Gradus (`notificationclick`).
- iPhone: solo con la app agregada a la pantalla de inicio (iOS 16.4 o posterior). Si no está instalada, la fila del recordatorio explica que hay que instalarla primero.
- **Varios dispositivos:** el recordatorio se activa por dispositivo (es un ajuste del aparato, no se sincroniza). Antes de armar el plan se sincroniza, para usar la racha combinada. Decisión mía: se aceptan avisos repetidos o algo desactualizados si alguien lo activa en dos dispositivos. La fila del recordatorio sugiere activarlo en uno solo.

**Servidor** (Worker de Cloudflare + D1, en `/api/recordatorios`):
- `POST /api/recordatorios`: registra una suscripción y su plan. Devuelve un `deviceId` y un `secret` al azar (32 bytes). El cliente los guarda en `localStorage`.
- `PUT /api/recordatorios/:deviceId`: reemplaza el plan. Exige el `secret`.
- `DELETE /api/recordatorios/:deviceId`: borra todo lo del dispositivo. Exige el `secret`.
- **No existe ninguna ruta que devuelva datos guardados.**
- Tarea programada cada 5 minutos: busca los avisos vencidos, los manda firmados con VAPID y cifrados (RFC 8291) y los borra. Si el servicio de Push responde 404 o 410, borra el dispositivo.

**Qué se guarda:** `deviceId`, el hash del `secret` (no el secreto), `endpoint`, las claves `p256dh` y `auth` de la suscripción, y los avisos pendientes (hora UTC, título, texto). Nada de nombres, correos, rachas ni progreso. Los dispositivos sin actividad durante 30 días se borran solos.

**Seguridad:**
- Clave privada VAPID como secreto del Worker (`wrangler secret`), nunca en el repositorio. Sin ella nadie puede mandar avisos a nombre de Gradus aunque robe direcciones.
- El `secret` de cada dispositivo se compara en tiempo constante.
- Límite de pedidos por IP (regla de Cloudflare) y tamaño máximo de cuerpo; textos con largo máximo; como mucho 7 avisos por dispositivo.
- Solo se aceptan `endpoint` de los servicios de Push conocidos (Google, Mozilla, Apple, Microsoft), para que el servidor no se use para mandar pedidos a cualquier dirección.
- La política CORS solo permite `https://graduschess.com`.

### 6. Seguridad de la web

- Encabezados (archivo `_headers` o en el Worker): `Content-Security-Policy` estricta (scripts solo propios y de `accounts.google.com`; conexiones solo a la propia API, `www.googleapis.com`, `lichess.org`, `api.chess.com`; `frame-src` para los iframes de los motores), `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Permissions-Policy` mínima.
- El permiso de Google se guarda solo en memoria, nunca en `localStorage`.
- Sin analítica ni rastreadores de terceros.
- `src/review/sources.ts` manda hoy `User-Agent: Gradus-Chess-App/1.0`. El navegador no deja cambiar ese encabezado (y en la prueba Lichess y chess.com respondieron igual). En la web se omite.

### 7. Otras piezas que cambian en la web

| Pieza | En la web |
|---|---|
| `expo-navigation-bar` | No se llama (archivo `.web` o guarda en `_layout.tsx`) |
| `expo-notifications` | Reemplazado por `reminders.web.ts` |
| Vibración (`expo-haptics`) | `navigator.vibrate` donde exista (Android); en iPhone no hace nada |
| Sonidos (`expo-audio`) | Comprobar que suenan. Los navegadores solo dejan reproducir después del primer toque: el primer sonido de una sesión puede perderse y se acepta |
| `react-native-webview` | No se usa en la web (archivos `.web.tsx` de los motores) |
| Animaciones `useNativeDriver` | Dan avisos en consola y caen a JavaScript; corregir donde moleste |
| Créditos | Enlace al código fuente (GPL) y aviso de que el progreso puede guardarse en el Drive del usuario |
| Política de privacidad | Nueva, en `/privacidad`: qué se guarda en el dispositivo, en el Drive del usuario y en el servidor de recordatorios; contacto `gradusstudioapp@gmail.com`. En los cinco idiomas |

### 8. Pantallas anchas

Primera versión: la app en una columna centrada de hasta 480 px, con el fondo del tema a los costados. Es mi decisión, para no rediseñar pantallas ahora. Un diseño con tablero grande y panel al lado queda para después.

### 9. Publicación

- Repositorio público en GitHub con el código de la app (GPL). Decisión mía: el Worker de recordatorios va **en el mismo repositorio público** (carpeta `worker/`). No tiene nada secreto (la clave VAPID y la base D1 viven en Cloudflare), y así hay un solo Worker que sirve la app y `/api` desde un solo repositorio, sin rutas repartidas entre dos.
- Cloudflare construye y publica desde `main` en cada cambio. Las ramas de prueba se publican en direcciones de vista previa (`*.workers.dev`), nunca en `graduschess.com`.
- Verificación de la app en Google Cloud (pantalla de permiso de OAuth): nombre «Gradus», correo de soporte `gradusstudioapp@gmail.com`, página principal y política en `graduschess.com` (dominio verificado en Search Console). El constructor confirma que la pantalla de permiso no muestra datos personales del autor.
- Cada versión publicada se etiqueta en git (`web-v1.0.0`, ...), para que el código de cualquier versión se pueda encontrar.

## Lo que queda a criterio del constructor

- La biblioteca de Web Push para Workers (o implementar RFC 8291/8292 con WebCrypto) y la de Workbox.
- La forma de las tablas de D1 y del archivo de Drive, respetando lo que se guarda y lo que no.
- Cómo partir el paquete y qué se precachea, con la meta de que la primera pantalla aparezca rápido en un teléfono de gama media con 4G.
- El texto y el lugar exacto de los avisos (instalar, sincronizar), respetando que nunca interrumpan una lección, un puzzle o una partida.
- Qué hacer con el aviso de `useNativeDriver`.

## Preguntas abiertas

1. **Historial de git con el correo personal:** reescribir el historial (se conservan los commits y los PR quedan desfasados) o publicar un repositorio nuevo desde cero. Lo decide el autor antes de hacer público el código.
2. **Renovación del permiso de Google:** confirmar en teléfonos reales si se puede renovar sin ventanita; si no, aceptar renovarlo en el siguiente toque.
