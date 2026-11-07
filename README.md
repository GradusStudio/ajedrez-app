# Gradus

Gradus es una app gratuita para Android para aprender ajedrez: una ruta de 41 lecciones (de cómo se mueven las piezas a conceptos avanzados), 28 cursos de aperturas, 50.000 puzzles, bots con personalidad que juegan las aperturas enseñadas (y eligen sus jugadas como personas, con Maia) y un tablero de análisis con Stockfish.

El nombre viene del latín *gradus*, «paso»: se aprende de a un paso, como en el clásico método *Gradus ad Parnassum*.

Hecha con Expo, React Native y TypeScript.

## Cómo ejecutarla

Requisitos: Node.js y la app Expo Go en el celular.

```bash
npm install
npx expo start -c
```

Después, escanea el código QR con Expo Go.

Los archivos generados ya están en el repositorio. Para volver a crearlos:

- `npm run build:engine`: copia Stockfish desde el paquete `stockfish` de npm (ver `docs/motor.md`).
- `npm run build:maia`: baja las redes de Maia (si faltan) y genera los archivos que usa la app (ver `docs/maia.md`).
- `npm run build:puzzles -- <ruta a lichess_db_puzzle.csv.zst>`: elige los puzzles de la base de Lichess (ver `docs/puzzles.md`).
- `npm run build:sounds`: genera los sonidos.

## Documentación

En `docs/`: diseño, formato de las lecciones, mapa de pantallas, bots, motor, Maia y puzzles.

## Licencia

Copyright (C) 2026 Gradus Studio

Este programa es software libre: puedes redistribuirlo y modificarlo según los términos de la Licencia Pública General GNU (GNU GPL) publicada por la Free Software Foundation, versión 3 o, a tu elección, cualquier versión posterior.

Este programa se distribuye con la esperanza de que sea útil, pero SIN NINGUNA GARANTÍA, ni siquiera la garantía implícita de COMERCIABILIDAD o de APTITUD PARA UN PROPÓSITO PARTICULAR. Consulta la GNU GPL para más detalles. El texto completo está en [`LICENSE`](LICENSE).

La licencia cubre el código y el contenido propio de la app: lecciones, cursos de aperturas, piezas y sonidos.

### Componentes de terceros

| Componente | Licencia | Origen |
|---|---|---|
| Stockfish 19 (Stockfish.js 19.0.1), sin modificar, en `src/engine/stockfish/` | GNU GPL v3 | https://github.com/official-stockfish/Stockfish · https://github.com/nmrugg/stockfish.js |
| Maia 1100, 1500 y 1900 (redes de los bots), sin modificar, en `src/engine/maia/redes/` | GNU GPL v3 | https://github.com/CSSLab/maia-chess |
| Tablas y cálculo de la red de Lc0, en `src/engine/maia/` | GNU GPL v3 | https://github.com/LeelaChessZero/lc0 |
| Puzzles de Lichess (`src/puzzles/lichess-puzzles.json`) | CC0 (dominio público) | https://database.lichess.org/#puzzles |
| chess.js | BSD-2-Clause | https://github.com/jhlywa/chess.js |
| Fuente Nunito | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Nunito |
| Expo, React Native, React y demás paquetes de `package.json` | MIT (en su mayoría) | ver cada paquete en `node_modules` |

Las piezas se generaron a partir de imágenes creadas con ChatGPT (OpenAI) y se pasaron a dibujos vectoriales. Los personajes de los bots y el icono también se crearon con ChatGPT.
