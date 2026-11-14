# Premove en cadena con tablero de plan

Fecha: 13-11-2026. Estado: **aprobado**. Revisado por opus el 14-11-2026; las respuestas a la revisión (cancelación, carrera con la jugada del bot, tablero de plan y accesibilidad) están incorporadas acá y en el plan.

> Orden de ejecución (opus, 14-11): el premove va después de las tareas del tester (17 a 21), que ya están cerradas.

## Por qué

En las partidas contra bots, el bot tarda en pensar. El premove permite dejar jugadas preparadas mientras piensa y que se ejecuten solas cuando responda. La cola sin simulación no deja encadenar la misma pieza (un peón no podría avanzar tres veces hasta coronar), así que el tablero muestra el plan: la posición real con tus jugadas preparadas aplicadas.

## Qué hace

- Solo en partidas contra un bot (`GameScreen`), incluida la práctica de aperturas.
- Mientras el bot piensa (motores listos, partida sin resultado), el tablero muestra el plan: la posición real con tus jugadas preparadas aplicadas y el turno puesto en vos.
- Podés preparar cualquier cantidad de jugadas legales, incluida la misma pieza varias veces. El peón puede avanzar a4, a5, a6, a7 y coronar; en la coronación se abre el menú y la pieza elegida queda guardada en esa jugada.
- Cada jugada se agrega al final de una cola FIFO.
- Marcador: solo los destinos de las jugadas de la cola, con el dorado de «casilla marcada» (`boardHighlight.mark`). Sin marcar el origen, sin flechas y sin textos ni traducciones.
- El plan solo contiene tus jugadas. Las respuestas del bot no se conocen y no se muestran.
- Cuando el bot mueve de verdad:
  - el tablero vuelve a la posición real con la jugada del bot;
  - si la partida terminó, se borra la cola;
  - se prueba la primera jugada de la cola en la posición real: si ya no es legal, se borra toda la cola;
  - si es legal, se ejecuta 300 ms después, para que la jugada del bot se vea y suene primero;
  - antes y después de cada jugada real se recorta la cola en la primera jugada que dejó de ser válida en el plan;
  - después del siguiente movimiento del bot se prueba la siguiente jugada, y así.
- Durante esos 300 ms el tablero no acepta toques.
- Cancelar:
  - clic derecho del ratón (web) borra toda la cola; también evita el menú contextual del navegador;
  - en el celular, un doble toque seguido sobre el tablero borra toda la cola. El gesto se detecta en el tablero para no disparar los botones de la pantalla.
- Las jugadas del plan no suenan ni cuentan como jugadas reales. Suenan las jugadas reales: las del bot, las tuyas y las que se ejecutan desde la cola.

## Fuera de alcance

- Mostrar en el plan las respuestas del bot (no se conocen).
- Premove en puzzles, lecciones, análisis o revisión.
- Guardar la cola en el progreso o al retomar una partida.
- Un ajuste para activarlo o desactivarlo.
- Textos y traducciones del premove.
- Más de una cola o reordenar jugadas.

## Referencia: Lichess

Revisado en `lila/ui/round/src/premove.ts`, `ui/round/src/ctrl.ts` y Chessground:

- Una sola premove a la vez; no tiene cadena.
- Calcula destinos «plausibles», no estrictamente legales: permite, por ejemplo, premover una pieza clavada porque el rival podría desclavarla. Si al ejecutarse no es legal, la descarta.
- Resalta origen y destino.
- La coronación abre el menú normal al preparar la jugada.
- Cancela la premove al seleccionar otra cosa o empezar otro arrastre; el tablero bloquea el menú contextual del navegador.
- El retraso es mínimo (1 ms; 100 ms en la variante atomic), para evitar carreras con el servidor.
- El código es AGPL: no se copia. Se implementa la misma idea con `chess.js`.

Diferencias de Gradus: tablero de plan con cola FIFO, validación estricta, solo el destino resaltado, y clic derecho o doble toque para borrar todo.

## Cómo se arma

- **`src/game/premove.ts`** (nuevo, puro):
  - `passTurn(fen)`: cambia el turno y borra la casilla de al paso.
  - `planPremoveFen(realFen, premoves)`: arma el FEN del plan aplicando la cola y cambiando el turno entre jugadas. Devuelve `null` si alguna jugada ya no se puede aplicar.
  - `clipPremoves(realFen, premoves)`: devuelve el prefijo válido de la cola hasta la primera jugada que ya no se puede aplicar.
  - `resolvePremove(fen, premove)`: prueba la jugada en la posición real y devuelve la jugada con su promoción, o `null`.
  - Pruebas en `src/game/premove.test.ts`.
- **`Board.tsx`**:
  - `premoveDests?: Square[]`: resalta esos destinos con `boardHighlight.mark`.
  - `onPremoveCancel?: () => void`: se llama con un clic derecho (web), con Escape (web) o con un doble toque seguido sobre el tablero (celular). Antes de avisar, cierra el selector de coronación, la pieza recién soltada, el arrastre y la selección, y borra el último toque. El clic derecho se implementa con un hook `.web.ts` que escucha `contextmenu` y evita el menú del navegador; el mismo hook escucha Escape. El doble toque se detecta en los gestos del tablero: dos toques sin arrastre, dentro de 300 ms y a menos de 30 px, borran la cola; si el dedo se mueve, el gesto sigue como siempre.
  - `sound?: boolean` (por defecto `true`): con `false` el tablero no reproduce el sonido de jugada. Así el plan no suena; `GameScreen` reproduce los sonidos de las jugadas reales.
  - `plan?: boolean` (por defecto `false`): tablero de plan. No muestra jaque ni jaque mate, y pinta la última jugada con `boardHighlight.pick` (azul) en vez del dorado de una jugada real, por encima del marcador dorado del destino.
  - En la web el tablero lleva `touch-action: manipulation` para que el doble toque no haga zoom.
  - Sin estas props, el tablero se comporta igual que hoy.
- **`GameScreen.tsx`**:
  - Cola `premoves` y estado `premovePending`; `premovesRef` para leer la cola desde los efectos y un temporizador cancelable.
  - Mientras el bot piensa, muestra el plan (`fen={planPremoveFen(...)}`) y acepta jugadas: las agrega a la cola en vez de jugarlas. El plan no aparece si el rey del bot está en jaque.
  - `onBoardMove` mira `chess.turn()` y `chess.fen()` en vivo, no el FEN del render; un ref `botMoving` ignora los toques mientras se aplica la jugada del bot. Así un toque no se pierde ni se juega contra una posición vieja.
  - `runPremoves` es estable (`useCallback` con refs a `sync` y `checkEnd`), y el efecto del bot lo llama sin agregarlo a sus dependencias: la cola no vuelve a lanzar el motor.
  - En el plan, `lastMove` es la última premove (pintada en azul) o `null` si la cola está vacía; el tablero va con `plan={canPlan}`.
  - En el turno real muestra la posición real y juega como hoy.
  - Reproduce los sonidos de las jugadas reales (usuario, bot y premove ejecutado) porque el tablero va con `sound={false}`.
  - La cancelación (clic derecho, Escape o doble toque) solo está activa si hay jugadas en la cola o una a punto de ejecutarse (`premovePending`): un doble toque normal no se consume ni se bloquea el menú contextual cuando no hay nada que borrar.
  - Temporizador de 300 ms, cancelado al desmontar.
  - Limpia la cola al terminar la partida, al salir, al desmontar y si falla el motor. Conserva `BoardStage` (premio de monedas, tarea 3) y pasa las props nuevas al `Board` de adentro.
- **`docs/design.md`**: fila nueva en la tabla de resaltados: «Destino de jugada preparada: `gold` al 70% con borde `gold` (mismo `mark`), sin marcar el origen ni agregar texto».

## Decisiones

- Tablero de plan en lugar de una cola sin simulación.
- La última jugada del plan se pinta en azul (`pick`), no en dorado, para no confundirla con una jugada real; el plan no muestra jaque ni mate.
- Con el rey del bot en jaque no se planea: el tablero de plan no aparece (una posición con el rival en jaque y el turno cambiado es ilegal).
- Cola FIFO sin límite, una jugada por turno del bot.
- Validación estricta con `chess.js` en el plan y en la posición real.
- 300 ms de espera antes de ejecutar.
- Clic derecho, Escape (web) y doble toque en el tablero (celular) borran toda la cola; la cancelación solo se activa con la cola no vacía o una jugada a punto de ejecutarse.
- Cancelar cierra el selector de coronación, la pieza soltada, el arrastre y la selección antes de borrar la cola.
- Coronación con el menú normal, guardada en la jugada.
- Sin textos.
- Sonidos solo de jugadas reales.
- La cola no se guarda.

## Riesgos

- El plan no muestra las respuestas del bot. Si cambian la posición, la cola se corta en la primera jugada inválida, como se pidió.
- Con una cola, al volver a la posición real el tablero puede cambiar de golpe y la jugada del bot no verse como un deslizamiento, porque la posición anterior era el plan.
- `Board` es compartido con lecciones, puzzles, revisión y análisis. Las props nuevas quedan apagadas por defecto. El premio de monedas (`BoardStage`) envuelve al tablero y se conserva.
- La validación estricta rechaza premoves que Lichess sí permite, como el de una pieza clavada. Es deliberado.
- El doble toque puede confundirse con dos toques rápidos normales. Se acota a toques sin arrastre, a menos de 30 px y dentro de 300 ms; además solo se escucha con la cola no vacía.
- Un toque o un arrastre justo cuando termina de aplicarse la jugada del bot podría llegar antes de que React redibuje. Se cubre con la lectura en vivo de `chess.turn()`/`chess.fen()`, el ref `botMoving` (que dura hasta que React dibuja) y dos guardas: una jugada real solo se acepta con la cola vacía, y un arrastre cuyo `fen` cambió a mitad del gesto se descarta. Si aun así el render está viejo, el toque se ignora en vez de jugar contra una posición que ya no está en pantalla.

## Accesibilidad

- Sin textos nuevos, por pedido del autor.
- El tablero ya tiene etiquetas por casilla.
- En la web, Escape cancela la cola mientras haya algo que cancelar. El doble toque no reemplaza al clic derecho en lectores de pantalla: en el celular nativo el doble toque es el gesto de activación del lector, así que la cancelación por gesto queda como limitación documentada para esos usuarios.
- No se agregan animaciones; el plan usa las animaciones que ya existen y respeta «reducir movimiento».

## Comprobación

- `npx tsc --noEmit`, `npx expo lint` (0/0), `npm test`.
- En el navegador y en el celular: peón que avanza a4, a5, a6, a7 y corona con el menú; cadena con otra pieza; la última jugada del plan se ve azul y las demás amarillas; clic derecho, Escape y doble toque que borran todo; una jugada que el bot invalida y corta la cola; cancelar con el selector de coronación abierto; un toque normal con la cola vacía no borra nada ni consume el doble toque; con el rey del bot en jaque no aparece el plan; en pantalla ancha y a 375 px; con «reducir movimiento» activo; sonidos solo en jugadas reales; comprobar que los textos del tablero siguen sin poder seleccionarse en la web; que el premio de monedas al ganar sigue funcionando.
