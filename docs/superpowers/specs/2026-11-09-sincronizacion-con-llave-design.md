# Sincronización con llave (sin ventana de Google cada vez)

Fecha: 9-11-2026. Estado: diseño acordado con el usuario y revisado por un lector aparte (9-11-2026); sin código.

## Por qué

Hoy la web sincroniza el progreso en Drive con Google Identity Services (modelo de token, `src/sync/googleAuth.web.ts`). El permiso dura una hora y vive en memoria, y sin servidor propio solo se renueva abriendo la ventana de Google, que el navegador permite únicamente tras un toque. Por eso existen «Reconectar» en Ajustes y el cartel cada 6 lecciones (`SyncNudge`). Eso corta la experiencia.

## Idea

Drive pasa a ser solo la caja fuerte de una **llave**. El progreso vive en nuestro servidor (Cloudflare) y la app sincroniza con la llave, sin volver a pedir nada a Google.

## Cómo funciona

1. **Activar** (una vez por dispositivo): la persona toca «Activar» y aparece una sola ventana de Google (el mismo permiso de Drive de hoy, carpeta oculta de la app).
   - Si en Drive hay una llave, se copia al navegador o dispositivo.
   - Si no la hay, se genera una (larga y al azar) y se guarda en Drive.
2. Desde ahí, la sincronización va contra el servidor con la llave: al abrir la app, al cambiar el progreso, al volver a la pestaña y al recuperar la conexión (los mismos disparadores del motor actual). Sin ventanas, sin «Reconectar» y sin el cartel cada 6 lecciones.
3. **Otro dispositivo**: se activa igual y encuentra la misma llave, así que comparte el progreso.
4. **Datos del navegador borrados**: se pierde la llave local; al volver a activar (una ventana) se recupera desde Drive.
5. **Sin migración**: hoy solo el autor usa la sincronización, así que no se contemplan usuarios con la versión vieja ni se lee el archivo de progreso viejo de Drive (si hiciera falta, Ajustes > Datos exporta e importa). El cliente de Drive solo lee y escribe el archivo de la llave.
6. **Desactivar**: el dispositivo deja de sincronizar y olvida la llave local. **Los datos del servidor no se borran.**
7. **Borrar mis datos del servidor**: botón aparte en Ajustes, con una confirmación clara («¿Seguro? Se borra tu progreso guardado en la nube; el de este dispositivo queda»). Borra el registro del servidor y desactiva la sincronización. La llave de Drive también se borra (ver abajo).

## Restricciones

- Anonimato: el servidor guarda solo un resumen (hash) de la llave y el progreso, sin correo, nombre ni token de Google.
- Quien tenga la llave lee y cambia ese progreso: riesgo bajo (lecciones y monedas), pero la llave tiene que ser larga y al azar.
- Solo web por ahora (como la sincronización actual). La app nativa no cambia.
- La política de privacidad (`PrivacyScreen`, textos en los cinco idiomas; de/it/fr con gemma4) tiene que explicar que el progreso se guarda en nuestro servidor y cómo borrarlo.
- La CSP (`public/_headers`) tiene que permitir el dominio del servidor en `connect-src`.

## Decidido por Claude (revisable)

- Servidor: un Worker de Cloudflare nuevo (como `gradus-puzzles`) con D1 o KV.
- Las funciones puras (fusión, decisión de qué subir) siguen en `syncEngine.ts` con pruebas; cambia el cliente (de Drive REST a nuestro servidor).

## Resuelto tras la revisión del lector (decisiones de Claude, revisables)

- **Borrado en los demás dispositivos**: el servidor guarda una marca de «borrado» para ese hash (sin progreso). Un dispositivo que sincroniza con esa llave recibe la marca, desactiva la sincronización, olvida la llave y avisa en Ajustes. «Borrar mis datos» borra también la llave de Drive, así una nueva activación empieza limpia. El motor suma un estado nuevo (llave revocada) en vez de `needsAuth`.
- **Usuarios de la versión anterior**: no hay (decisión del autor, 9-11-2026). `SyncNudge`, `noteCompletion` y «Reconectar» se borran sin transición.
- **Escrituras simultáneas**: el servidor no entiende el progreso, solo lo guarda con un número de versión. La escritura es condicional (si la versión cambió, responde conflicto) y el cliente vuelve a bajar, fusiona con `mergeProgress` y reintenta.
- **Safari en iOS**: sin instalar la app, Safari puede borrar el almacenamiento tras unos 7 días sin visitas, y entonces la ventana vuelve a aparecer una vez. Instalada (PWA), no pasa. Aceptado por el autor: no tiene iPhone para probarlo y se fomenta instalar la app. Se documenta.

## Sincronizar más seguido

Sin ventanas periódicas, la sincronización puede ser casi continua (pedido del autor, 9-11-2026):

- **Cada paso de lección**: el avance a medias ya se guarda en cada paso (`saveDraft`, `progress.drafts`), así que cada paso pide una sincronización. Se baja la espera para agrupar pedidos (hoy 4 s) lo justo para que se note, sin escribir en cada toque.
- **Partida contra un bot sin terminar**: hoy no se guarda. Se agrega al progreso (versión 5) **una** partida en curso: bot, color, jugadas y fecha. Se guarda en cada jugada, se borra al terminar o abandonar, y la pestaña Bots (o la ficha del bot) ofrece «Continuar partida» en cualquier dispositivo. Al fusionar, gana la más reciente. Las reglas de racha y monedas de partida terminada o abandonada no cambian.
- **Puzzle sin terminar**: salir sin resolverlo no lo marca como resuelto (ya es así: solo `finishPuzzle` lo marca). Al volver a Puzzles se asigna otro, no el mismo: los puzzles abiertos y abandonados se recuerdan en el progreso (lista corta de los últimos, sincronizada) y la elección (`pickPending`, `nextNear`) los salta. El puzzle del día es la excepción: siempre es el mismo. Abandonar no cambia el nivel de puzzles (decisión del autor, 9-11-2026); lo que ya se cobró en el momento (error, pista o «Ver solución») queda cobrado.

## Queda para el constructor

Esquema de la base, forma de la API, límites contra abuso (tamaño máximo del progreso, frecuencia de escritura), nombre del subdominio y pasos para publicarlo (en `docs/web/publicar-en-cloudflare.md`).
