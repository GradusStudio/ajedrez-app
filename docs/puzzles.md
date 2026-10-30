# Puzzles

## Origen y licencia
- **Base abierta de puzzles de Lichess:** https://database.lichess.org/#puzzles. Tiene 6.157.341 puzzles (archivo del 2 de octubre de 2026, 293 MB comprimido).
- **Licencia CC0** (dominio público): se puede usar, modificar y redistribuir sin pedir permiso, en una app gratuita o comercial, abierta o cerrada. No exige crédito, pero lo damos igual: la pantalla del puzzle muestra "Puzzle #id de Lichess" con enlace, y Créditos (hito 6) debe mencionarlo.

## Selección que trae la app
`src/puzzles/puzzles.json`: **50.000 puzzles, 6,76 MB** (hasta octubre de 2026 eran 10.000, 1,36 MB). Lo genera `scripts/build-puzzles.js`:
```
npm run build:puzzles -- <ruta a lichess_db_puzzle.csv.zst>
```
El script lee el archivo descomprimiéndolo sobre la marcha (con `fzstd`), sin descomprimirlo a disco, y tarda menos de un minuto. De los 6,1 millones, 1,4 millones pasan los filtros normales. El archivo bajado está guardado en `C:\dev\datos-lichess\lichess_db_puzzle.csv.zst`, fuera del proyecto. Si se pierde, se vuelve a bajar de Lichess.

**Criterios:**
- **Ratings de 500 a 2500,** en 20 franjas de 100 puntos con 2.500 puzzles cada una. Las 20 se completan.
- **Calidad:** popularidad ≥ 85, al menos 1.000 partidas jugadas y desviación del rating ≤ 80.
  - En las franjas de menos de 800 no alcanzan, así que se completan con filtros más flexibles: popularidad ≥ 60, 300 partidas y desviación ≤ 110. Se usaron para 5.281 puzzles.
- **Largo:** como mucho 8 jugadas, es decir, la del rival más hasta 4 del usuario.
- **Subpromociones:** entran. El tablero tiene selector de coronación y la solución exige la pieza elegida (`e7e8n` = coronar a caballo). Hay 23 puzzles donde el usuario tiene que coronar en otra pieza que no sea dama.
- **Variedad:** dentro de cada franja se toma de a un puzzle por tema principal, en ronda. Los temas que se pueden elegir en Práctica reciben el doble de lugar. Mientras lee, el script guarda los 1.000 mejores candidatos de cada tema y franja (`KEEP_PER_THEME`), suficientes para llenar las 2.500.
- **Verificación:** cada puzzle elegido se comprueba con chess.js (todas sus jugadas son legales).

**Formato de cada puzzle:** `[id, fen, jugadas UCI, rating, temas]`. Igual que en Lichess, el FEN es la posición *antes* de la jugada del rival, y la primera jugada es la del rival.

## Cómo funciona en la app
- **Puzzle del día:** sale de los 15.000 puzzles de nivel 1000–1600. Cambia a medianoche y es el mismo para todos. No se repite en más de 40 años.
- **Práctica:** dificultad Fácil (500–1200, 17.500 puzzles), Medio (1200–1800, 15.000) o Difícil (1800–2500, 17.500), y "Todos" o un tema. El tema con menos puzzles es "Mate del pasillo" en Difícil (50). Toca un puzzle pendiente al azar; cuando están todos resueltos, se repiten.
- **Pantalla del puzzle:**
  - El rival juega la primera jugada.
  - El usuario busca la solución. Si se equivoca, la jugada se hace en el tablero y, en el lugar de los botones "Pista" y "Ver solución", aparece el aviso "Incorrecto" con el botón "Reintentar". "Reintentar" deshace la jugada equivocada y se sigue desde ahí. Mientras tanto, el tablero no acepta otras jugadas.
  - En práctica, "Siguiente puzzle" cambia el puzzle dentro de la misma pantalla, con un fundido de 0,2 s y sin navegar, para que no aparezca un fondo blanco.
  - Como en Lichess, cualquier jugada que dé mate también resuelve el puzzle.
  - "Pista" marca la pieza que hay que mover; "Ver solución" reproduce la solución.
- **Resultado guardado** (`progress.puzzles`):
  - `clean`: sin errores ni pista.
  - `solved`: resuelto con errores o con pista.
  - `failed`: se miró la solución; el puzzle sigue pendiente en Práctica.

  Se guarda el mejor resultado de cada puzzle. Cada puzzle terminado cuenta para la racha y la meta diaria. La primera vez que se resuelve da monedas: 2 sin errores ni pista, 1 con errores o pista (mirar la solución no da, pero el puzzle puede dar monedas después, al resolverlo).
- **Temas en español:** `src/puzzles/themes.json`. Los nombres son traducciones propias, no copiadas de Lichess.

## Pendiente
- Rating de puzzles del usuario: hoy no hay puntuación, solo resuelto o no resuelto, como pedía el mapa.
- Agregar más puzzles: cambiar `PER_BAND` o los filtros en el script y volver a generarlo.
- Peso al abrir la app: `puzzles.ts` importa el JSON entero y Expo Router carga todas las pantallas al arrancar, así que los 6,76 MB se leen al abrir la app (en la PC tarda ~70 ms; el paquete de Android pasa a 12 MB). Si en el celular el arranque se nota lento, cargar los puzzles recién al entrar a Puzzles o a Perfil.
