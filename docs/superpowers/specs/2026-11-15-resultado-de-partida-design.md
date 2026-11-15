# Resultado de una partida contra un bot

Fecha: 15-11-2026 · Diseño: opus · **Referencia visual:** `prototipo-revision.html` (raíz del repo, fuera de git), vista «3 · Resultado contra un bot», con los tres finales.

Hoy, al terminar una partida (`GameScreen`, `resultBody`), aparece una tarjeta de color en el panel (o al pie, en el celular) con «Ganaste», el motivo, las monedas, la racha y tres botones del mismo peso. El bot, que tiene personalidad y frases propias (`lines.onWin` / `lines.onLose` en `bots.json`), no aparece: el final no se siente como haberle ganado (o perdido) a alguien.

## 1. Qué se ve

Al terminar, el tablero se queda quieto un momento (600 ms, para ver el mate: el rey caído de `FallenKing`) y aparece encima una capa con el resultado (fondo `bg` al 92 %, fundido de 250 ms). Pantalla ancha: dos columnas (máximo 980 px).

**Izquierda · el bot**
- El **bot de cuerpo entero** (`assets/bots/cuerpo/<id>.webp`, 380 px de alto) sobre una sombra ovalada en el piso y un brillo redondo detrás (difuminado, sin borde duro).
- Arriba, su **globo de diálogo** blanco con la colita hacia abajo y la frase:
  - Ganaste: `lines.onLose` del bot («Me descubriste. Bien visto.»).
  - Perdiste: `lines.onWin` («Te dije que había un truco.»).
  - Tablas: `lines.onDraw`, **frase nueva** por bot en los cinco idiomas (por ejemplo Tomás: «Ni tú ni yo. Otra y desempatamos.»).
- **Reacción** (una sola vez, 0,7 a 1,2 s): si ganaste, el bot se encoge y se inclina un poco (se deja caer 10 px y gira −4°); si perdiste, da dos saltitos; tablas, un balanceo corto. Con «reducir movimiento» queda quieto.
- El brillo de atrás: dorado si ganaste, verde suave si perdiste, blanco tenue en tablas.
- Más adelante se pueden generar poses propias (festeja / lamenta) como los 10 cuerpos; no hace falta para esta tarea.

**Derecha · el resultado**
- Rótulo: «PARTIDA CONTRA TOMÁS · NIVEL 1000».
- **«Ganaste»** en 46 px: `gold` si ganaste, blanco cálido si perdiste, `textMuted` en tablas.
- Cómo terminó: «Jaque mate en la jugada 28 · jugaste con blancas», «Tomás dio jaque mate en la jugada 31», «Ahogado en la jugada 54», «Abandonaste en la jugada 19», «Tablas por acuerdo»…
- **Lo que ganaste**, en pastillas: monedas (borde y texto `gold`, con la moneda), premio del día, racha («Racha encendida · 7 días», naranja de la llama `#F5912F`; con el reencendido de la tarea de la llama si fue la primera acción del día) y racha recuperada. Si ganaste y ya habías cobrado hoy a ese bot, la nota de hoy (`game.coinsNote`) como texto gris debajo.
- **Las monedas vuelan:** al ganar, 10 monedas salen del bot y entran en la pastilla, que late una vez (reusar `CoinReward` de la tarea del premio de monedas; no inventar otra animación).
- **El historial contra ese bot**, de `progress.games`: «Contra Tomás: **4 – 1**», y una nota corta: «le ganaste 3 de las últimas 4» / «revisa la partida y mira dónde cambió» / «1 tablas». Solo si hay al menos 2 partidas con ese bot.
- **Botones:** «Revisar la partida» (principal, a lo ancho; abre la revisión de esta partida, igual que hoy «Analizar»), y debajo, en dos columnas, «Jugar otra vez» y «Elegir otro bot» (secundarios). En práctica de apertura: «Practicar otra vez» y «Volver a la apertura», como hoy.
- Una «×» o tocar «Ver el tablero» cierra la capa y deja ver la posición final con los botones en el panel (lo que hay hoy).

**Celular:** una columna. El bot más chico (220 px) con el globo arriba, el resultado y las pastillas debajo, y los tres botones al pie (fijos). El bot no tapa los botones: si la pantalla es baja, el bot baja a 160 px.

## 2. Lo que no cambia

Cuándo se ganan monedas (Elo/100, una vez por día y por bot, no en práctica), el premio del día, la racha, el guardado de la partida, la revancha y la revisión.

## Accesibilidad y textos

- Al aparecer, el foco va a «Ganaste» (encabezado) y el lector dice el resultado, la frase del bot y lo ganado. Escape o «Ver el tablero» la cierra.
- Los colores no son la única señal: el título siempre dice el resultado.
- Textos nuevos de tú, sin exclamaciones, en los cinco idiomas: la frase `onDraw` de los 10 bots, «Partida contra {bot} · nivel {elo}», los motivos con número de jugada, «Contra {bot}: {g} – {p}», las notas del historial, «Ver el tablero». de/it/fr con gemma4 vía Ollama, revisando puntuación y términos.

## Cómo se comprueba

- `npm test` (historial contra un bot a partir de `progress.games`: ganadas, perdidas, tablas, últimas 4), `npx expo lint`, `npx tsc --noEmit`, `noHardcoded`.
- Navegador (`web-compilada`) a 1366 y 375 px: ganar (con y sin monedas de hoy), perder, tablas, abandonar, partida de práctica; «Revisar la partida» abre la revisión correcta; «Ver el tablero»; con «reducir movimiento».
- Celular: que entren el bot, el resultado y los botones sin desplazarse en el Redmi.
