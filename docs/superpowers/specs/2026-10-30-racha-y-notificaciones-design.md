# Racha con recuperación y notificaciones

Proyecto 1 de 3. Después vienen Personajes (los bots enseñan y hablan en los avisos) y Monetización.

## Por qué

Gradus todavía no tiene un motivo fuerte para volver cada día. El usuario cree que mantener la racha puede motivar y quiere que la app lo recuerde. Hoy la racha se corta sin vuelta atrás con un solo día perdido, y el recordatorio viene apagado, está escondido en Ajustes y llega aunque ya hayas practicado.

Éxito: quien falla un día tiene una forma clara y justa de recuperar la racha, y los avisos ayudan sin molestar.

## Objetivos

1. La racha suma con una acción por día: resolver un puzzle, terminar una lección o jugar una partida contra un bot.
2. Si se falla un día, la racha se recupera haciendo las tres acciones el día que se vuelve.
3. Si se fallan dos días o más, la racha se pierde.
4. El recordatorio no llega los días en que ya se practicó, avisa cuando la racha está en riesgo y es fácil de descubrir.

## Fuera de alcance

- Personajes en avisos o pantallas (proyecto 2). El texto de esta entrega no usa voces de bots.
- Monedas por recuperar la racha, escudos de racha, compras o anuncios.
- Avisos enviados desde un servidor: todo es local en el teléfono.

## Lo que no puede pasar

- Sin vidas ni bloqueos: fallar la racha nunca impide usar la app.
- Nada de culpa en los textos ni avisos insistentes. Respetar `docs/design.md`: español, sin exclamaciones en mensajes del sistema.
- La actualización no puede romper ni reiniciar una racha ya guardada.

## Reglas de la racha

Días locales, con `todayKey()`. «Hueco» es la cantidad de días entre `lastActiveDate` y hoy.

| Hueco | Estado | Qué pasa |
|---|---|---|
| 0 | Activa, hoy ya cuenta | Nada que hacer |
| 1 | Activa | La primera acción válida suma 1 |
| 2, con `current` de 2 o más | En recuperación | Hacen falta las 3 acciones hoy. Al completarlas, `lastActiveDate` pasa a hoy y `current` no cambia |
| 2, con `current` de 1 | Perdida | Recuperar 1 día no da ninguna ventaja: la primera acción válida empieza una racha de 1 *(decisión de diseño)* |
| 3 o más | Perdida | La primera acción válida empieza una racha de 1 |

- Ejemplo decidido con el usuario: con 10 días, se falla el martes y se recupera el miércoles: la racha sigue en 10. El jueves pasa a 11.
- La recuperación se puede usar sin límite de veces.
- Si el día de recuperación termina con 1 o 2 acciones hechas, la racha anterior se pierde. Ese día queda como un día activo normal de una racha nueva de 1, porque hubo práctica real. Al día siguiente la barra muestra 1 y, con una acción, pasa a 2. Las reglas siguen desde ahí como en la tabla: `lastActiveDate` es el día de recuperación incompleto y `current` es 1. *(Decisión de diseño.)*
- `best` se actualiza como hoy.

### Acciones válidas

- **Lección:** terminar una lección de la ruta o de aperturas, nueva o repetida, o un repaso de errores.
- **Puzzle:** resolverlo, con o sin errores (`clean` o `solved`). Mirar la solución (`failed`) deja de contar para la racha. Sigue sumando tiempo de práctica como hoy.
- **Bot:** terminar una partida, gane o pierda, incluido el modo práctica. Rendirse o abandonar solo cuenta con 10 o más jugadas hechas entre los dos, para que no se pueda cumplir abandonando al instante. *(Decisión de diseño.)*

Una acción vale una sola vez por tipo y por día. Sumar tiempo de práctica sin terminar nada (`addPractice`) no cuenta, igual que hoy.

### Datos

- Agregar a `Progress.streak` un campo opcional con las acciones del último día en que hubo actividad, por ejemplo `actions?: { date: string; lesson: boolean; puzzle: boolean; bot: boolean }`.
- Mantener las funciones `with...` puras y con la fecha como parámetro.
- Reemplazar `withActiveDay` por una función que reciba el tipo de acción.
- Sin subir `version`: el campo es opcional y las rachas guardadas siguen valiendo.
- `currentStreak` debe devolver `current` también con hueco 2. Agregar una función que devuelva el estado de la racha y las acciones hechas hoy.
- Las claves de AsyncStorage no cambian.

## Pantallas

- **Aprender (`HomeScreen`):** en recuperación, mostrar una tarjeta debajo de la barra de racha con el texto «Recupera tu racha de N días hoy» y tres casillas: Puzzle, Lección y Bot. Cada casilla se marca al cumplirse. No es una ventana que tape la pantalla y no aparece en otro estado.
- **Al completar la tercera acción:** avisar que la racha se recuperó en la pantalla de resultado de esa acción. Si esa pantalla es Puzzle o Partida, usar su panel de resultado. Si la tercera acción es abandonar una partida, se sale sin mensaje, como hoy: la racha igual queda recuperada. *(Decisión de diseño.)*
- **Racha perdida:** sin mensaje especial. La barra muestra 0.

## Notificaciones

Las notificaciones programadas no pueden decidir al momento de sonar si deben aparecer. Por eso:

- Reemplazar el trigger diario por avisos de fecha exacta para los próximos 7 días, a la hora elegida.
- Reprogramar todo al abrir la app, al registrar una acción y al cambiar el recordatorio en Ajustes.
- Si hoy la racha ya está a salvo, el aviso de hoy no se programa. En un día normal alcanza con una acción válida; en un día de recuperación hacen falta las tres.
- Como máximo un aviso por día.
- Si la persona no abre la app durante 7 días, los avisos terminan solos. Así la app no insiste con quien dejó de usarla. *(Decisión de diseño.)*

El texto depende del estado previsto para ese día:

| Situación | Texto |
|---|---|
| Racha de 2 o más que se corta si no practica hoy | «Tu racha de N días sigue en juego» / «Una lección, un puzzle o una partida alcanza para mantenerla.» |
| Día de recuperación | «Todavía puedes recuperar tu racha» / «Resuelve un puzzle, haz una lección y juega contra un bot hoy.» |
| Sin racha o racha perdida | «Hora de practicar ajedrez» / «Una lección o un puzzle corto alcanza para empezar.» |

`src/settings/reminders.ts` necesita recibir el progreso, o un resumen, para armar los avisos. Las notificaciones deben seguir funcionando en Expo Go.

### Descubrir el recordatorio

- Al terminar cualquier lección de la ruta o de aperturas, si la oferta todavía no se mostró y el recordatorio está apagado, ofrecer una sola vez en la pantalla de resultado: «¿Quieres que te recuerde practicar?» con los botones «Sí, a las 19:00» y «Ahora no». Los repasos de errores no la muestran. *(Decisión de diseño.)*
- «Sí» activa el recordatorio y pide el permiso. La hora se cambia en Ajustes.
- La oferta se guarda como ya mostrada en los ajustes (`@ajedrez/settings`), para que borrar el progreso no la repita. Los dos botones la marcan como mostrada.
- Si el permiso se niega, se usa el mismo aviso que hoy en Ajustes y no se vuelve a ofrecer.

## Comprobaciones

- Pruebas con fechas fijas de las reglas: cada hueco, recuperación completa, recuperación incompleta, acción repetida, cambio de mes y puzzle `failed`.
- Reprogramación de avisos: con la racha a salvo hoy no hay aviso hoy; un día de recuperación con 1 o 2 acciones mantiene el aviso; nunca dos el mismo día; texto correcto en cada estado.
- `npx tsc --noEmit` y `npx expo lint` sin errores nuevos.
- Prueba en el celular: tarjeta de recuperación, oferta del recordatorio y llegada real de un aviso.
- Actualizar `CLAUDE.md` y `docs/mapa-de-pantallas.md`.

## Queda a criterio de quien lo construya

- Diseño visual exacto de la tarjeta, usando los componentes y colores existentes.
- Dónde conviene reprogramar los avisos para no repetir código.
