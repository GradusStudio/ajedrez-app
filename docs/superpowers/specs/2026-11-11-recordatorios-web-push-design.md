# Recordatorios diarios con Web Push (versión 3)

**Fecha:** 11-11-2026
**Estado:** aprobada (11-11-2026)
**Autoridad:** autor de Gradus (aprobó el esquema en la sesión del 11-11-2026)
**Specs relacionadas:** `2026-11-07-version-web-design.md` (sección 5), `2026-10-30-racha-y-notificaciones-design.md` (recordatorio nativo), `2026-11-09-sincronizacion-con-llave-design.md` (racha combinada)
**Constitución:** cumple C-01, C-02, C-05, C-06, C-08, C-09 y C-10.

## Contexto y problema

Hoy el recordatorio diario funciona solo en el celular con notificaciones locales de `expo-notifications`. En la web/PWA la fila de Ajustes está oculta (`REMINDERS_SUPPORTED = false`) y Gradus no puede avisar. La versión 3 de la web consiste en llevar el recordatorio a la web con Web Push, manteniendo las reglas de racha que ya existen:

- Una acción por día alcanza para mantener la racha.
- Si se falla un día y la racha era de 2 o más, se recupera haciendo **las tres acciones** ese día: lección, puzzle y partida contra un bot.
- Una lección de la ruta, una de aperturas o un repaso de errores cuentan como la acción «lección».

El autor pidió tomar el esquema de notificaciones de Duolingo. Se toma la **orquestación por estado, el momento y la personalización**; no se copia el tono pasivo-agresivo ni el búho, porque la spec de racha prohíbe la culpa y los avisos insistentes, y no se implementa el bandit de aprendizaje automático porque Gradus no tiene analítica ni datos para entrenarlo.

## Objetivo

Que quien usa Gradus en la web/PWA pueda activar un recordatorio diario que llegue a la hora elegida, use la voz del bot del día y respete la racha y sus reglas, sin pedir cuenta ni datos personales.

## Usuarios

- Persona que usa Gradus en la web o como PWA y quiere un empujón diario.
- El autor, primer usuario y tester en Android y en iPhone.
- La app nativa no cambia.

## Historias de usuario

- **HU-01:** Como persona que usa la web, quiero activar el recordatorio desde Ajustes para que me avise a la hora que elija.
- **HU-02:** Como persona con una racha, quiero que el aviso me diga si está en riesgo o si hoy toca recuperarla con las tres acciones.
- **HU-03:** Como persona que hizo una lección de aperturas, quiero que cuente para la racha igual que una de la ruta.
- **HU-04:** Como persona que ya practicó hoy, no quiero recibir el aviso.
- **HU-05:** Como persona que deja de usar la app, quiero que los avisos terminen solos y que mis datos se borren.
- **HU-06:** Como persona en iPhone, quiero saber que tengo que instalar la app en la pantalla de inicio para recibir avisos.

## Requisitos funcionales

### Activación

- **RF-01 (siempre):** El sistema mostrará la fila «Recordatorio diario» en Ajustes cuando el navegador soporte Web Push y notificaciones.
  - **CA-01:** En Chrome, Edge o Firefox de escritorio o Android, la fila aparece y se puede activar.
  - **CA-02:** En un navegador sin `PushManager`, la fila no aparece o explica que no está disponible.
- **RF-02 (evento):** Cuando la persona active el recordatorio, el sistema pedirá permiso de notificaciones y creará la suscripción Push con la clave pública VAPID de Gradus.
  - **CA-03:** El permiso se pide solo después de un toque de la persona, nunca al abrir la app.
  - **CA-04:** Si el permiso ya estaba concedido, no se vuelve a pedir.
- **RF-03 (no deseado):** Si la persona niega el permiso, el sistema dejará el recordatorio apagado, mostrará un mensaje claro y no volverá a pedir el permiso automáticamente.
  - **CA-13:** Si el permiso se revoca después de activar, al abrir la app el sistema apagará el recordatorio, borrará el registro del servidor y explicará cómo volver a activarlo. *(Decisión del constructor.)*
- **RF-04 (evento):** Cuando termine una lección y la oferta no se haya mostrado, la web ofrecerá activar el recordatorio una sola vez.
  - **CA-05:** En iPhone sin la app instalada no se muestra la oferta del recordatorio: la oferta de instalación que ya existe y la fila de Ajustes explican que primero hay que agregar Gradus a la pantalla de inicio. *(Decisión del constructor.)*
  - **CA-06:** «Ahora no» también marca la oferta como mostrada.

### Plan y envío

- **RF-05 (estado):** Mientras el recordatorio esté activo, el sistema mantendrá en el servidor el plan de los próximos 7 días, con un aviso por día como máximo, a la hora elegida.
  - **CA-07:** Si hoy la persona ya practicó, no habrá aviso para hoy: el plan se reconstruye al registrar la acción y, si la práctica fue sin conexión, el service worker la detecta por la marca local (RF-18).
  - **CA-08:** Si la persona no abre la app durante 7 días, los avisos terminan solos.
- **RF-06 (siempre):** El plan usará las reglas de racha existentes: el título será el bot que escribe ese día; el cuerpo será el texto de riesgo, recuperación o general del bot, en el idioma elegido.
  - **CA-09:** En un día de recuperación el texto nombrará la lección, el puzzle y la partida.
  - **CA-10:** Un aviso con la racha en riesgo incluye el número de días.
- **RF-07 (siempre):** Una lección de la ruta, una de aperturas o un repaso contarán como la acción «lección» de la racha; la pantalla de recuperación marcará cada acción hecha.
- **RF-08 (evento):** Cuando venza un aviso, el servidor lo enviará firmado con VAPID y lo borrará.
  - **CA-11:** Un fallo al enviar un aviso no impide enviar los demás.
  - **CA-12:** Si hay varios avisos vencidos juntos (por ejemplo, tras una caída del servidor), se envía solo el más reciente y se descartan los demás; un envío fallido se reintenta como máximo durante una hora. *(Decisión del constructor: evita una ráfaga de avisos viejos.)*
- **RF-09 (no deseado):** Si el servicio de Push responde 404 o 410, el servidor borrará el dispositivo y sus avisos.
- **RF-10 (siempre):** El service worker mostrará la notificación y, al tocarla, abrirá o enfocará la app.
- **RF-11 (evento):** Cuando la persona desactive el recordatorio, la app borrará el registro del servidor y se dará de baja de la suscripción.
  - **CA-14:** Si el servidor ya no conoce el dispositivo (404/410 o 30 días) pero la suscripción del navegador sigue existiendo, la app la registrará de nuevo automáticamente; si la suscripción ya no existe, apagará el recordatorio y avisará. *(Decisión del constructor.)*
- **RF-12 (estado):** Los dispositivos sin actividad durante 30 días se borrarán solos.
- **RF-13 (evento):** Cuando la persona abra la app con la sincronización activa, el sistema intentará sincronizar antes de armar el plan; si no hay conexión o la sincronización falla, usará la racha local.
- **RF-14 (siempre):** En la app nativa se mantendrá el recordatorio local actual; esta versión solo cambia la web.

### Datos y seguridad

- **RF-15 (estado):** El servidor guardará solo el identificador del dispositivo, el hash del secreto, el endpoint y las claves de la suscripción, y los avisos pendientes (hora UTC, título y texto). No guardará progreso, racha, nombre ni correo.
- **RF-16 (siempre):** La API solo aceptará pedidos desde el origen de la app y los orígenes locales de desarrollo.
- **RF-17 (no deseado):** Si el cuerpo es demasiado grande, pide más de 7 avisos, usa un endpoint que no es de un servicio de Push conocido o el secreto no coincide, el servidor rechazará el pedido sin revelar datos.
- **RF-18 (estado):** Mientras la marca local de práctica corresponda al día local actual, el service worker no mostrará el aviso.
  - **CA-15:** La marca se escribe al registrar una lección, un puzzle o una partida válida, y guarda la fecha local, no un valor fijo; al cambiar el día deja de coincidir y el aviso vuelve a mostrarse sin borrar nada a mano.
  - **CA-16:** La supresión cubre la práctica en el mismo dispositivo; si la persona practicó en otro dispositivo y el plan no llegó a actualizarse, el aviso puede llegar. Se documenta como limitación.

## Esquema de Duolingo adaptado

| Parte del esquema | En Gradus |
|---|---|
| Orquestación por estado | `safe` no recibe aviso; `active` recibe riesgo o texto general; `recovering` recibe las tres acciones; `none` recibe el texto general |
| Momento | La hora elegida por la persona, un aviso por día, plan de 7 días |
| Personalización | Bot del día, idioma, racha y estado; la lección de aperturas cuenta |
| Novedad y rotación | Los 10 bots rotan un día cada uno; cada bot tiene sus propios textos |
| Ya practicó hoy | El plan se reconstruye al registrar la acción; si fue sin conexión, el service worker lo detecta con una marca local fechada (RF-18) |
| Dejar de insistir | A los 7 días sin abrir la app, el plan termina; a los 30 días se borra el dispositivo |
| Tono | Cercano y con personalidad, **sin culpa ni exclamaciones** (spec de racha) |
| Bandit / A-B testing | Fuera de alcance: no hay analítica ni volumen para entrenar |

## Requisitos no funcionales

- **RNF-01 Privacidad:** no hay cuenta, correo ni nombre. El servidor no guarda progreso ni racha. La política de privacidad explica qué se guarda, cómo desactivar y cómo borrar.
- **RNF-02 Seguridad:** la clave privada VAPID vive como secreto del Worker, nunca en el repositorio. El secreto de cada dispositivo se compara en tiempo constante. Hay límite de pedidos por IP, tamaño máximo de cuerpo y lista de endpoints de Push permitidos.
- **RNF-03 Fiabilidad:** la tarea programada corre cada 5 minutos; los avisos vencidos se envían y se borran; un fallo aislado no bloquea el resto.
- **RNF-04 Accesibilidad:** la fila de Ajustes y la oferta se usan con teclado y lector de pantalla, con toques de al menos 44 px y el contraste de la app.
- **RNF-05 Pruebas:** la lógica pura se prueba con `node:test`; la API del Worker se prueba con un almacén en memoria; el aviso real se prueba a mano en el navegador y en el iPhone instalado.
- **RNF-06 Compatibilidad:** la detección es por capacidades del navegador, no por una lista. La matriz obligatoria de prueba es Chrome, Edge y Firefox de escritorio y Android, y Safari en iOS 16.4 o posterior con la app instalada. Safari de macOS se acepta si soporta Web Push, pero no es obligatorio probarlo. La app nativa no cambia.

## Casos límite

- Permiso negado, revocado después de activar, o notificaciones desactivadas en el navegador.
- iPhone sin la app instalada.
- Navegador sin soporte de Web Push.
- Suscripción vencida: el servicio responde 404 o 410.
- Varios dispositivos con el recordatorio activo: se aceptan avisos repetidos; la fila sugiere activarlo en uno solo.
- La persona cambia la hora, el idioma o la racha mientras hay un plan: el plan se reemplaza.
- Sin conexión al activar o al actualizar el plan: se reintenta al abrir la app. Si la persona practica sin conexión, el service worker suprime el aviso con la marca local del día (RF-18).
- Se borran los datos del navegador: se pierden el identificador y el secreto; el dispositivo viejo se borra a los 30 días.
- Cambio de horario de verano: las horas se guardan en UTC y se calculan desde la hora local elegida.
- La app está abierta cuando llega el aviso: el service worker lo muestra igual.
- El Worker está caído: la app sigue funcionando; el plan se actualiza cuando vuelva.

## Fuera de alcance

- Notificaciones push nativas (FCM/APNs) y cambios en la app nativa.
- Foto del bot en el aviso: en la web es posible, pero queda para después; el título ya lleva el nombre del bot.
- Analítica, pruebas A/B, bandit de aprendizaje automático y medición de aperturas.
- Texto adaptativo según qué acción falta: la pantalla de recuperación ya marca las hechas.
- Avisos por ligas, logros, contenido nuevo, email o SMS.
- Sincronizar el ajuste del recordatorio entre dispositivos.
- iOS anterior a 16.4 o Safari sin la app instalada.

## Criterios de finalización

- [ ] Todos los RF tienen al menos una prueba o un recorrido manual que los cubre.
- [ ] `npx tsc --noEmit`, `npx expo lint` y `npm test` pasan.
- [ ] Probado a mano en Chrome de escritorio o Android y en el iPhone instalado.
- [ ] La política de privacidad y los textos nuevos están en los cinco idiomas.
- [ ] `CLAUDE.md`, `docs/web/publicar-en-cloudflare.md` y el vault quedaron actualizados.
- [ ] Se revisó contra `docs/constitution.md`.

## Dudas abiertas

- El plan decide si el servidor de recordatorios comparte el Worker y la base de sincronización o usa uno propio, y qué biblioteca de Web Push se usa.

## Registro de cambios

| Fecha | Cambio | Motivo |
|---|---|---|
| 11-11-2026 | Versión inicial | Esquema aprobado por el autor en la sesión del 11-11-2026 |
| 11-11-2026 | Se agrega la marca local de práctica (RF-18) | El autor pidió suprimir el aviso si ya practicó ese día, con la marca reseteada cada día |
