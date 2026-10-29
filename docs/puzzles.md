# Puzzles

## Origen y licencia
- **Base abierta de puzzles de Lichess:** https://database.lichess.org/#puzzles. Tiene 6.157.341 puzzles (archivo del 2 de octubre de 2026, 293 MB comprimido).
- **Licencia CC0** (dominio público): se puede usar, modificar y redistribuir sin pedir permiso, en una app gratuita o comercial, abierta o cerrada. No exige crédito, pero lo damos igual: la pantalla del puzzle muestra "Puzzle #id de Lichess" con enlace, y Créditos (hito 6) debe mencionarlo.

## Selección que trae la app
`src/puzzles/puzzles.json`: **10.000 puzzles, 1,36 MB.** Lo genera `scripts/build-puzzles.js`:
```
npm run build:puzzles -- <ruta a lichess_db_puzzle.csv.zst>
```
El script lee el archivo descomprimiéndolo sobre la marcha (con `fzstd`), sin descomprimirlo a disco, y tarda unos 30 segundos. El archivo bajado está guardado en `C:\dev\datos-lichess\lichess_db_puzzle.csv.zst`, fuera del proyecto. Si se pierde, se vuelve a bajar de Lichess.

**Criterios:**
- **Ratings de 500 a 2500,** en 20 franjas de 100 puntos con 500 puzzles cada una.
- **Calidad:** popularidad ≥ 85, al menos 1.000 partidas jugadas y desviación del rating ≤ 80.
  - En las franjas de menos de 800 no alcanzan, así que se completan con filtros más flexibles: popularidad ≥ 60, 300 partidas y desviación ≤ 110. Se usaron para 835 puzzles.
- **Largo:** como mucho 8 jugadas, es decir, la del rival más hasta 4 del usuario.
- **Excluidos:** los que coronan en otra pieza que no sea dama, porque el tablero corona siempre a dama.
- **Variedad:** dentro de cada franja se toma de a un puzzle por tema principal, en ronda. Los temas que se pueden elegir en Práctica reciben el doble de lugar.
- **Verificación:** cada puzzle elegido se comprueba con chess.js (todas sus jugadas son legales).

**Formato de cada puzzle:** `[id, fen, jugadas UCI, rating, temas]`. Igual que en Lichess, el FEN es la posición *antes* de la jugada del rival, y la primera jugada es la del rival.

## Cómo funciona en la app
- **Puzzle del día:** sale de los 3.000 puzzles de nivel 1000–1600. Cambia a medianoche y es el mismo para todos. No se repite en más de 8 años.
- **Práctica:** dificultad Fácil (500–1200), Medio (1200–1800) o Difícil (1800–2500), y "Todos" o un tema. Toca un puzzle pendiente al azar; cuando están todos resueltos, se repiten.
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

  Se guarda el mejor resultado de cada puzzle. Cada puzzle terminado cuenta para la racha y la meta diaria, pero no da XP.
- **Temas en español:** `src/puzzles/themes.json`. Los nombres son traducciones propias, no copiadas de Lichess.

## Pendiente
- Rating de puzzles del usuario: hoy no hay puntuación, solo resuelto o no resuelto, como pedía el mapa.
- Agregar más puzzles: cambiar `PER_BAND` o los filtros en el script y volver a generarlo.
