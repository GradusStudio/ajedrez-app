# Plan de implementación · Tarea 37: resultado de una partida contra un bot

Spec: `docs/superpowers/specs/2026-11-15-resultado-de-partida-design.md` · Prototipo: `prototipo-revision.html`, vista «3 · Resultado contra un bot» · Autor del plan: lingling (15-11-2026).

Contexto revisado:
- `GameScreen` ya calcula el resultado (`end()` llama a `finishGame` y guarda monedas, premio del día y racha) y lo muestra en una tarjeta del panel; el tablero se queda con el mate a la vista.
- `bot.lines` tiene `greeting`, `onGoodMove`, `onBlunder`, `onWin` y `onLose`; falta `onDraw`.
- `CoinReward` tiene la animación de vuelo de monedas atada al tablero y a su propia pastilla.
- La ficha del bot dibuja el brillo como un círculo plano (`styles.light`).

Cada paso termina con `npm test`, `npx expo lint` y `npx tsc --noEmit` en verde, y un commit con autor `Gradus Studio`.

## Paso 1 · Datos

- `Bot.lines.onDraw` (tipo en `src/data/bots.ts`) y una frase por bot en los 10 de `src/data/bots.json` y en `src/data/i18n/{en,de,it,fr}/bots.json` (Ollama no responde: traducciones a mano, anotadas).
- `src/progress/botHistory.ts` (puro, con pruebas): partidas reales con ese bot (sin práctica), ganadas/perdidas/tablas, últimas 4 y la nota (`wonLast` / `draws` / `review`); null con menos de 2.
- Commit: «Resultado: frase de tablas de los bots e historial contra un bot».

## Paso 2 · Brillo difuminado

- `src/components/BotGlow.tsx`: gradiente radial con `react-native-svg` (sin borde duro), id único por instancia.
- `BotDetailScreen` lo usa en lugar del círculo plano; la capa de resultado lo reutiliza.
- Commit: «Bots: brillo difuminado en la ficha».

## Paso 3 · La capa del resultado

- `src/components/GameResultLayer.tsx`: fondo `bg` al 92 % con fundido; dos columnas (980 px) y una en el celular.
  - Izquierda: cuerpo entero (380/220/160 px), sombra, `BotGlow` (dorado/verde/blanco), globo con la frase (`onLose` si ganaste, `onWin` si perdiste, `onDraw` en tablas) y la reacción (encogerse, dos saltitos, balanceo; quieto con reducir movimiento).
  - Derecha: rótulo «Partida contra {bot} · nivel {elo}», resultado en 46 px, motivo con número de jugada, pastillas (monedas, premio del día, racha, racha recuperada), historial, monedas que vuelan del bot a la pastilla, «Revisar la partida», «Jugar otra vez»/«Practicar otra vez», «Elegir otro bot»/«Volver a la apertura» y «Ver el tablero».
  - Accesibilidad: foco en el resultado, Escape cierra, `role="dialog"`.
- `CoinReward`: extraer el vuelo a `FlyingCoins` (origen y destino en px, `onLand`) para que la capa lo use; `CoinReward` conserva su comportamiento.
- Commit: «Resultado: capa con el bot, el marcador y las monedas».

## Paso 4 · Enganche en la partida

- `GameScreen`: al terminar, 600 ms de espera y la capa; «Ver el tablero» la cierra y deja el panel actual.
- Commit: «Partida: la capa del resultado al terminar».

## Paso 5 · Textos

- Claves nuevas en los cinco idiomas (motivos con jugada, historial, pastillas, botones; a mano si Ollama sigue caído, anotado).
- Commit: «Resultado: textos en los cinco idiomas».

## Paso 6 · Comprobación y publicación

1. `npm test`, `npx expo lint`, `npx tsc --noEmit`, `npm run build:web`.
2. `npx wrangler dev -c wrangler.local.jsonc --port 8788`, a 1366 y 375: ganar con y sin monedas de hoy, perder, tablas, abandonar, práctica; «Revisar la partida» y «Ver el tablero»; con reducir movimiento; el brillo de la ficha del bot; sin errores de consola.
3. Push según «Push a GitHub» y `npx wrangler deploy --name ajedrez-app` (autorizado por el autor el 14-11; pedir confirmación si el clasificador lo bloquea).
4. Anotar en la fila 37.
