# Maia: bots que juegan como personas

Desde el 2-11-2026 los 10 bots eligen sus jugadas con **Maia** en lugar de Stockfish. El libro de aperturas de cada bot y su nivel (Elo) siguen igual; lo que cambia es *cómo* juega cuando sale del libro.

## Por qué Maia

- **Qué es:** Maia es una red neuronal del CSSLab (Universidad de Toronto, con Microsoft Research), publicada en KDD 2020. Usa la misma arquitectura que Leela Chess Zero (Lc0), pero en vez de aprender jugando contra sí misma, aprendió con **millones de partidas humanas de Lichess**: su objetivo es predecir la jugada que haría una persona, no la mejor jugada. Hay 9 redes, una por nivel: de Maia 1100 a Maia 1900 (rating de Lichess).
- **Imita mejor a las personas:**
  - Maia acierta la jugada humana **más del 50 %** de las veces (hasta 52 % con Maia 1900 y jugadores de 1900).
  - Stockfish limitado (por profundidad, de 1 a 15) acierta entre el **35 % y el 40 %**, y no "apunta" a ningún nivel: es igual de parecido (o de distinto) a un jugador de 1100 que a uno de 1900. Juega como Stockfish con ruido agregado.
  - Maia también predice mejor los **errores humanos**: piezas que se olvidan, tácticas que no se ven.
  - Cada red de Maia se parece más a las personas de su propio nivel.
- **Comprobado acá:** con una copia en Python del código de Lc0, sobre 864 jugadas de partidas de jugadores fuertes, Maia 1100, 1500 y 1900 acertaron 33 %, 37 % y 41 % (la de 1900, la más parecida a esos jugadores, como era de esperar).
- **Versiones más nuevas:** Maia-2 (NeurIPS 2024, un solo modelo para todos los niveles) y Maia-3 (2026, 57 % de aciertos) son mejores, pero pesan entre 20 y 300 MB y necesitan ONNX Runtime (unos 12 MB más). Para un celular se eligió **Maia 1**: cada red pesa 1,2 MB y se puede ejecutar en JavaScript puro.

Fuentes: [blog de Maia](https://www.maiachess.com/blog/maia-v1), [artículo (arXiv 2006.01855)](https://arxiv.org/abs/2006.01855), [Maia-2 (arXiv 2409.20553)](https://arxiv.org/abs/2409.20553), [código y redes](https://github.com/CSSLab/maia-chess).

## Cómo está armado

```
scripts/build-maia.js                  baja las redes originales (si faltan) y genera los .generated.ts (npm run build:maia)
src/engine/maia/redes/                 maia-1100/1500/1900.pb.gz SIN MODIFICAR + COPYING.txt (GPL v3) + los .generated.ts (base64)
src/engine/maia/maiaWorkerSource.ts    la red: lee el archivo de Lc0 y hace una pasada (como Lc0 con `nodes 1`)
src/engine/maia/lc0Tables.ts           las 1858 jugadas de la salida de Lc0 y su mapa (calculados, iguales a los de Lc0)
src/engine/maia/encode.ts              arma la entrada (112 planos) con chess.js, desde las jugadas de la partida
src/engine/maia/maiaHtml.ts            página del WebView: un Worker con la red
src/engine/maia/MaiaView.tsx           WebView invisible (como EngineView); se monta en la partida
src/engine/maia/maiaEngine.ts          MaiaEngine: le pide al Worker los logits de las jugadas legales
src/bots/brain.ts                      libro → Maia → (seguro de Stockfish) → jugada
```

- **Dónde corre:** en un Worker dentro de un WebView invisible, como Stockfish, porque ahí el JavaScript es rápido (V8 con JIT). Una jugada tarda unos 45 ms en una PC; en el celular, unos cientos de ms, dentro del tiempo que el bot "piensa".
- **Sin Lc0:** no hace falta compilar Lc0. Maia sin búsqueda es una sola pasada de la red (13 convoluciones de 3×3 sobre un tablero de 8×8), y eso se escribió en JavaScript siguiendo el código de Lc0. Se comprobó que da **los mismos números que Lc0** (diferencia máxima 0,00001 en 80 posiciones y 2393 jugadas, con enroques, promociones, al paso y repeticiones); `maia.test.ts` lo vuelve a comprobar con la red de 1500.
- **Historia:** Maia mira las 7 posiciones anteriores, así que `encode.ts` recibe todas las jugadas de la partida, no solo la posición.
- **Enroque:** para Lc0, el enroque es "el rey toma su torre" (e1h1). Con e1g1, Maia casi nunca enrocaba.

## Cómo elige un bot (`brain.ts`)

1. **Libro:** igual que antes (las líneas de su repertorio, `book` corto/medio/largo; en práctica, el curso completo).
2. **Maia:** la red da una probabilidad para cada jugada legal: qué tan probable es que una persona de ese nivel la juegue. El bot **sortea** según esas probabilidades (`maiaOrder`):
   - `net`: la red (1100, 1500 o 1900).
   - `temperature`: 1 = tal cual juegan las personas de ese nivel; menos de 1 = más fiel a la jugada favorita (más fuerte); más de 1 = más dispersa (más errores); 0 = siempre la favorita.
   - `minProb`: deja afuera las jugadas que casi nadie de ese nivel jugaría. Hace al bot bastante más fuerte.
3. **Seguro de Stockfish** (`safety`, solo los bots fuertes): Maia sola, sin buscar, juega como un jugador de unos 1650 en esta escala y no llega a 1950 ni a 2200. A Sofía, Ivo y Ada, Stockfish les revisa las primeras 4 candidatas de Maia, en el orden sorteado, y juegan la primera que no pierde más de `maxLoss` centipeones frente a la mejor. Siguen eligiendo jugadas humanas; solo dejan de regalar material.
4. **Evaluación para las frases y las tablas:** la da Stockfish (profundidad 8) sobre la jugada elegida. La evaluación propia de Maia es poco confiable (con una dama regalada, a veces marca menos de un peón).

Por eso la partida monta dos WebViews: Maia y Stockfish.

## Calibración (2-11-2026)

Se jugaron unas 750 partidas entre configuraciones de Maia y **los bots anteriores** (los de Stockfish, ya calibrados entre sí), de 10 a 16 partidas por par. Para cada configuración se calculó el nivel en la escala de los bots: el del rival más 400 × log10(puntos / (1 − puntos)), promediado entre 2 o 3 rivales. Se eligió para cada bot la configuración más cercana a su Elo.

| Bot | Red | temperature | minProb | Seguro (maxLoss) | Nivel medido (aprox.) |
|---|---|---|---|---|---|
| Pipo (500) | 1100 | 2,0 | — | — | ~500 (entre 380 con 2,3-2,5 y 740 con 1,5) |
| Lola (800) | 1100 | 2,35 | 0,01 | — | ~800 (750 con 2,5 y 860 con 2,2) |
| Tomás (1000) | 1100 | 1,5 | 0,01 | — | ~1030 |
| Valentina (1200) | 1100 | 0,7 | — | — | ~1165 |
| Don Ramiro (1350) | 1100 | 0,4 | — | — | ~1375 |
| Camila (1500) | 1500 | 0,45 | — | — | ~1545 |
| Bruno (1650) | 1500 | 0,2 | — | 500 | ~1700 |
| Sofía (1800) | 1900 | 0,3 | — | 400 | ~1765 |
| Ivo (1950) | 1900 | 0,2 | — | 275 | ~1940 |
| Ada (2200) | 1900 | 0,2 | — | 150 | ~2190 |

Todos los bots: `safety.depth` 8 y 4 candidatas como máximo. `thinkMs` y `bias` quedaron igual.

Lo que se aprendió:
- **Maia sola, sin búsqueda, juega como ~1550-1700** en esta escala, sea la red de 1100, 1500 o 1900 (la diferencia entre redes es más de *estilo* que de fuerza). Para bajar de nivel se sube la temperatura; para pasar de ~1700 hace falta el seguro de Stockfish (con 60 cp de margen ya le gana el 93 % a la Ada vieja).
- **La temperatura pesa mucho:** con la red de 1100, la favorita siempre juega como ~1550; sorteando tal cual (1) como ~1050; con 1,5 como ~740; con 3, casi al azar.
- **`minProb` 0,01 sube unos 250 puntos** (saca las jugadas que casi nadie haría): por eso Lola y Tomás lo usan con una temperatura alta.
- Con 16 partidas, el azar mueve los porcentajes ±12 puntos (unos ±90 de Elo), y los bots viejos no eran del todo transitivos (Valentina le ganaba más a Maia 1100 que Don Ramiro). Pipo y Lola quedaron interpolados entre dos mediciones. Hay que confirmarlo con partidas reales.
- **Cómo se midió:** fuera de la app, con una copia en Python de Maia (idéntica a la de la app) y Stockfish 17.1 nativo en lugar del lite de la app. A los bots `stockfish-elo` viejos se les dio una décima parte del tiempo de la app, porque el Stockfish del celular piensa unas 10 veces menos por segundo. Los scripts de medición no forman parte de la app.

## Licencia

Las redes de Maia son **GPL v3**, igual que Stockfish y que la app. Van **sin modificar** (el archivo `.pb.gz` original, en base64) y la licencia está en `src/engine/maia/redes/COPYING.txt`. Créditos tiene una tarjeta "Maia · Lc0" con los enlaces al código. `lc0Tables.ts` y `maiaWorkerSource.ts` siguen el código de Lc0 (GPL v3). Esto no es asesoramiento legal.

## Pendientes

- Probar en el celular cuánto tarda una jugada y la memoria con dos WebViews.
- El `bias` de estilo sigue sin implementar. Con Maia se podría hacer subiendo la probabilidad de las capturas o de las jugadas tranquilas antes de sortear.
- Maia-2 o Maia-3 darían un nivel continuo (cualquier Elo, no solo 1100/1500/1900) y más parecido humano, si algún día el peso no es un problema.
- La revisión de partidas tiene pendiente usar Maia ("puntos de giro"): `encode.ts` y `MaiaEngine` ya sirven para eso.
