# Motor de ajedrez (Stockfish)

## Qué se usa
- **Stockfish.js 19.0.1**, versión "lite single-threaded", del paquete npm `stockfish` (Nathan Rugg / Chess.com). Es Stockfish 19 compilado a WebAssembly, con una red neuronal chica.
  - Pesa 1,8 MB (wasm) + 28 KB (js).
  - Funciona sin conexión.
  - Aunque es más débil que el Stockfish completo, sigue siendo muchísimo más fuerte que cualquier persona.
- **Licencia: GPL v3.** El texto está en `src/engine/stockfish/COPYING.txt`. El código fuente está en https://github.com/nmrugg/stockfish.js y https://github.com/official-stockfish/Stockfish.

## Cómo está armado
```
scripts/build-engine.js        genera stockfishAssets.ts desde node_modules/stockfish (npm run build:engine)
src/engine/stockfish/          archivos de Stockfish SIN MODIFICAR (js como texto, wasm en base64) + COPYING.txt
src/engine/engineHtml.ts       página del WebView: arma el motor en un Worker
src/engine/EngineView.tsx      WebView invisible; se monta en la pantalla de partida
src/engine/uci.ts              UciEngine: habla UCI por texto (search, MultiPV, UCI_Elo)
src/bots/                      lógica de los bots (libro + motor); no conoce el WebView
```

- **Separación:** Stockfish corre en un Worker dentro del WebView, que es otro motor de JavaScript distinto al de la app. La app y el motor solo se pasan **texto UCI**: `position…`, `go…`, `bestmove…`. Ningún código de la app se mezcla con el de Stockfish, y sus archivos van tal cual vienen en el paquete.
- **Cambiar de motor:** cualquier motor UCI compilado a WebAssembly (por ejemplo, Arasan, con licencia MIT) se puede usar cambiando `scripts/build-engine.js` y `engineHtml.ts`. `uci.ts` y los bots no cambian. Lo que sí hay que recalibrar es el nivel de los bots: un mismo `UCI_Elo` no juega igual en dos motores distintos.
- **Probado:**
  - La página del motor, en Chrome sin ventana (el mismo motor de navegador que el WebView de Android): arranca y llega a profundidad 14 en unos 0,3 s.
  - Los bots, en Node con el mismo motor: todas sus jugadas son legales, usan su libro y piensan con el motor según su tipo.
- **Detalle técnico:** `go movetime 0` hace que Stockfish piense sin límite. Por eso `uci.ts` pone un mínimo de 100 ms.

## Licencia: qué falta decidir antes de publicar (hito 7)
Mientras la app solo se prueba en el celular del desarrollador no hay distribución, y por lo tanto ninguna obligación. Antes de publicar en Google Play hay que elegir una de estas opciones:
1. **Publicar la app como GPL v3**: código abierto, por ejemplo en GitHub. Es la opción segura.
2. **Mantener la app cerrada**, con el argumento de que Stockfish es un programa separado que se comunica por UCI y va sin modificar. Hay que mostrarle esta arquitectura a un abogado.
3. **Cambiar a un motor con licencia MIT** (Arasan) antes de publicar.

En todos los casos: pantalla de créditos con la licencia de Stockfish y el enlace a su código (hito 6). Si la app es GPL, el set de piezas también tiene que tener una licencia compatible.

Esto no es asesoramiento legal.
