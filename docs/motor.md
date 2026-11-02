# Motor de ajedrez (Stockfish)

## Qué se usa
- **Stockfish.js 19.0.1**, versión "lite single-threaded", del paquete npm `stockfish` (Nathan Rugg / Chess.com). Es Stockfish 19 compilado a WebAssembly, con una red neuronal chica.
  - Pesa 1,8 MB (wasm) + 28 KB (js).
  - Funciona sin conexión.
  - Aunque es más débil que el Stockfish completo, sigue siendo muchísimo más fuerte que cualquier persona.
- **Licencia: GPL v3.** El texto está en `src/engine/stockfish/COPYING.txt`. El código fuente está en https://github.com/nmrugg/stockfish.js y https://github.com/official-stockfish/Stockfish.

Desde el 2-11-2026 los bots eligen sus jugadas con **Maia** (ver `maia.md`). Stockfish sigue en el análisis, la revisión de partidas, las prácticas de las lecciones y, en las partidas contra bots, para evaluar las jugadas (frases y tablas) y como seguro de los bots fuertes.

## Cómo está armado
```
scripts/build-engine.js        genera stockfishAssets.ts desde node_modules/stockfish (npm run build:engine)
src/engine/stockfish/          archivos de Stockfish SIN MODIFICAR (js como texto, wasm en base64) + COPYING.txt
src/engine/engineHtml.ts       página del WebView: arma el motor en un Worker
src/engine/EngineView.tsx      WebView invisible; se monta en la pantalla de partida
src/engine/uci.ts              UciEngine: habla UCI por texto (search, MultiPV, UCI_Elo)
src/bots/                      lógica de los bots (libro + Maia + Stockfish); no conoce el WebView
```

- **Separación:** Stockfish corre en un Worker dentro del WebView, que es otro motor de JavaScript distinto al de la app. La app y el motor solo se pasan **texto UCI**: `position…`, `go…`, `bestmove…`. Ningún código de la app se mezcla con el de Stockfish, y sus archivos van tal cual vienen en el paquete.
- **Cambiar de motor:** cualquier motor UCI compilado a WebAssembly (por ejemplo, Arasan, con licencia MIT) se puede usar cambiando `scripts/build-engine.js` y `engineHtml.ts`. `uci.ts` y los bots no cambian. Lo que sí hay que recalibrar es el nivel de los bots: un mismo `UCI_Elo` no juega igual en dos motores distintos.
- **Probado:**
  - La página del motor, en Chrome sin ventana (el mismo motor de navegador que el WebView de Android): arranca y llega a profundidad 14 en unos 0,3 s.
  - Los bots, en Node con el mismo motor: todas sus jugadas son legales, usan su libro y piensan con el motor según su tipo.
- **Detalle técnico:** `go movetime 0` hace que Stockfish piense sin límite. Por eso `uci.ts` pone un mínimo de 100 ms.

## Licencia de la app: GPL v3 o posterior (decidido el 29-10-2026)
Antes de publicar se evaluaron tres opciones: app GPL, app cerrada con Stockfish como «programa separado» o cambiar a Arasan (MIT). Se eligió **publicar la app como software libre bajo la GNU GPL v3 o posterior**:
- Es la opción sin riesgo legal y no exige cambiar el motor.
- El argumento del «programa separado» era débil: Stockfish viaja dentro del mismo paquete de la app (como texto, en `stockfishAssets.ts`), y el equipo de Stockfish hace cumplir su licencia (demanda contra ChessBase en 2021).
- La GPL permite cobrar o poner anuncios. A cambio, cualquiera puede copiar y redistribuir el código y el contenido, siempre bajo la misma licencia.

Qué se hizo:
- `LICENSE`: texto completo de la GPL v3 (el mismo que `src/engine/stockfish/COPYING.txt`). Reemplazó la licencia MIT de Expo que venía con la plantilla y no correspondía a la app.
- `README.md`: aviso de copyright y licencia, cómo ejecutar y regenerar los archivos, y la tabla de componentes de terceros.
- `package.json`: `"license": "GPL-3.0-or-later"`.
- Créditos: tarjeta «Esta app» con la licencia, el aviso de que no hay garantía y el enlace al código. Piezas y sonidos pasan a «GPL v3 o posterior, como la app».
- Revisión del historial antes de hacer público el repositorio: no hay claves, contraseñas ni archivos de configuración privados. Lo único personal es el nombre de usuario y el correo del autor de los commits.

Para cumplir la GPL al publicar:
- El repositorio de GitHub tiene que ser público y corresponder a la versión publicada. Conviene etiquetar cada versión que se sube a Google Play (`git tag v1.0.0`).
- Si alguna vez se agregan piezas, sonidos o código de otra persona, tienen que tener una licencia compatible con la GPL v3.

Esto no es asesoramiento legal.
