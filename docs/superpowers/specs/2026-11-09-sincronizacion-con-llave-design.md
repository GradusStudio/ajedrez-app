# Sincronización con llave (sin ventana de Google cada vez)

Fecha: 9-11-2026. Estado: diseño acordado con el usuario, **sin revisión del lector aparte** (se pospuso por falta de tokens) y sin código.

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
5. **Migración**: la primera vez, el progreso que ya está en Drive se fusiona con el del servidor (`mergeProgress`) y después Drive deja de escribirse.
6. **Desactivar**: el dispositivo deja de sincronizar y olvida la llave local. **Los datos del servidor no se borran.**
7. **Borrar mis datos del servidor**: botón aparte en Ajustes, con una confirmación clara («¿Seguro? Se borra tu progreso guardado en la nube; el de este dispositivo queda»). Borra el registro del servidor y desactiva la sincronización. La llave en Drive puede quedar o borrarse (decisión del constructor; recomendado borrarla también para que una nueva activación empiece limpia).

## Restricciones

- Anonimato: el servidor guarda solo un resumen (hash) de la llave y el progreso, sin correo, nombre ni token de Google.
- Quien tenga la llave lee y cambia ese progreso: riesgo bajo (lecciones y monedas), pero la llave tiene que ser larga y al azar.
- Solo web por ahora (como la sincronización actual). La app nativa no cambia.
- La política de privacidad (`PrivacyScreen`, textos en los cinco idiomas; de/it/fr con gemma4) tiene que explicar que el progreso se guarda en nuestro servidor y cómo borrarlo.
- La CSP (`public/_headers`) tiene que permitir el dominio del servidor en `connect-src`.

## Decidido por Claude (revisable)

- Servidor: un Worker de Cloudflare nuevo (como `gradus-puzzles`) con D1 o KV.
- Las funciones puras (fusión, decisión de qué subir) siguen en `syncEngine.ts` con pruebas; cambia el cliente (de Drive REST a nuestro servidor).

## Queda para el constructor

Esquema de la base, forma de la API, límites contra abuso (tamaño máximo del progreso, frecuencia de escritura), nombre del subdominio y pasos para publicarlo (en `docs/web/publicar-en-cloudflare.md`).
