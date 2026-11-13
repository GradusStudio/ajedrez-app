# Premove en cadena con tablero de plan

Fecha: 13-11-2026. Estado: **propuesto; espera aprobación del autor**.

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
  - `onPremoveCancel?: () => void`: se llama con un clic derecho en la web o con un doble toque seguido sobre el tablero en el celular. El clic derecho se implementa con un hook `.web.ts` que escucha `contextmenu` y evita el menú del navegador. El doble toque se detecta en los gestos del tablero: dos toques sin arrastre, dentro de 300 ms y a menos de 30 px, borran la cola; si el dedo se mueve, el gesto sigue como siempre.
  - `sound?: boolean` (por defecto `true`): con `false` el tablero no reproduce el sonido de jugada. Así el plan no suena; `GameScreen` reproduce los sonidos de las jugadas reales.
  - Sin estas props, el tablero se comporta igual que hoy.
- **`GameScreen.tsx`**:
  - Cola `premoves` y estado `premovePending`.
  - Mientras el bot piensa, muestra el plan (`fen={planPremoveFen(...)}`) y acepta jugadas: las agrega a la cola en vez de jugarlas.
  - En el turno real muestra la posición real y juega como hoy.
  - Reproduce los sonidos de las jugadas reales (usuario, bot y premove) porque el tablero va con `sound={false}`.
  - Temporizador de 300 ms, cancelado al desmontar.
  - Limpia la cola al terminar la partida, al salir, al desmontar y si falla el motor.
- **`docs/design.md`**: fila nueva en la tabla de resaltados: «Destino de jugada preparada: `gold` al 70% con borde `gold` (mismo `mark`), sin marcar el origen ni agregar texto».

## Decisiones

- Tablero de plan en lugar de una cola sin simulación.
- Cola FIFO sin límite, una jugada por turno del bot.
- Validación estricta con `chess.js` en el plan y en la posición real.
- 300 ms de espera antes de ejecutar.
- Clic derecho (web) y doble toque en el tablero (celular) borran toda la cola.
- Coronación con el menú normal, guardada en la jugada.
- Sin textos.
- Sonidos solo de jugadas reales.
- La cola no se guarda.

## Riesgos

- El plan no muestra las respuestas del bot. Si cambian la posición, la cola se corta en la primera jugada inválida, como se pidió.
- Con una cola, al volver a la posición real el tablero puede cambiar de golpe y la jugada del bot no verse como un deslizamiento, porque la posición anterior era el plan.
- `Board` es compartido con lecciones, puzzles, revisión y análisis. Las props nuevas quedan apagadas por defecto.
- La tarea 3 del tablero de agentes (premio de monedas) también quiere tocar `Board.tsx`; espera a que termine esta tarea.
- La validación estricta rechaza premoves que Lichess sí permite, como el de una pieza clavada. Es deliberado.
- El doble toque puede confundirse con dos toques rápidos normales. Se acota a toques sin arrastre, a menos de 30 px y dentro de 300 ms; hay que probar que no corte la cola sin querer.

## Accesibilidad

- Sin textos nuevos, por pedido del autor.
- El tablero ya tiene etiquetas por casilla.
- El doble toque no reemplaza al clic derecho en lectores de pantalla; en la web se mantiene el clic derecho.
- No se agregan animaciones; el plan usa las animaciones que ya existen y respeta «reducir movimiento».

## Comprobación

- `npx tsc --noEmit`, `npx expo lint` (0/0), `npm test`.
- En el navegador y en el celular: peón que avanza a4, a5, a6, a7 y corona con el menú; cadena con otra pieza; clic derecho y doble toque que borran todo; una jugada que el bot invalida y corta la cola; en pantalla ancha y a 375 px; con «reducir movimiento» activo; sonidos solo en jugadas reales; comprobar que los textos del tablero siguen sin poder seleccionarse en la web.
