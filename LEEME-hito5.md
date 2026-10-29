# Hito 5 · Puzzles

## Cómo probarlo
No hay dependencias nuevas para la app; `fzstd` es solo para el script que elige los puzzles. Inicia el servidor como siempre:
```
cd C:\dev\ajedrez-app
npx expo start -c
```

## Qué verás
- **Pestaña Puzzles:**
  - Arriba: "0 de 10.000 resueltos · de la base abierta de Lichess".
  - **Puzzle del día:** uno distinto cada día, de nivel medio. Si ya lo hiciste, dice "resuelto ✓".
  - **Práctica:** eliges dificultad (Fácil 500–1200, Medio 1200–1800 o Difícil 1800–2500) y un tema (Todos, Mate en 1, Mate en 2, Mate en 3, Horquilla, Clavada, Enfilada, Ataque a la descubierta, Jaque doble, Pieza colgada…). Después tocas **Practicar**.
- **Resolver un puzzle:**
  - El rival hace su jugada y después te toca. Arriba dice qué buscar: "Juegan las negras · Mate en 2" o "Encuentra la mejor jugada".
  - **Error:** la jugada se hace en el tablero y, en lugar de los botones, aparece **Incorrecto** con el botón **Reintentar**. Al tocarlo, la jugada se deshace y sigues desde ahí.
  - **Entre puzzles:** el siguiente aparece con un fundido suave, sin pantalla blanca.
  - **Pista:** marca la pieza que hay que mover.
  - **Ver solución:** muestra la solución jugada por jugada; el puzzle queda pendiente para otra vez.
  - **Al resolverlo:** "Resuelto · Sin errores" (o con cuántos errores), los temas del puzzle (por ejemplo, Horquilla) y, en práctica, **Siguiente puzzle**.
  - Abajo hay un enlace para ver el puzzle en Lichess.
- Cada puzzle cuenta para tu racha y tu meta diaria.

## Qué probar
1. Puzzles → **Resolver** el puzzle del día. Al volver, la tarjeta tiene que decir "resuelto ✓".
2. Práctica → **Fácil** → **Mate en 1** → Practicar. Equivócate a propósito: la jugada tiene que verse en el tablero, con **Incorrecto** y **Reintentar** en el lugar de los botones. Toca **Reintentar**: la pieza vuelve a su lugar. Después resuélvelo y toca **Siguiente puzzle** varias veces: no tiene que aparecer ninguna pantalla blanca.
3. En otro puzzle, toca **Pista** y después **Ver solución**: la solución se juega sola.
4. Práctica → **Difícil** → **Horquilla**: tienen que costar bastante más.
5. Toca el enlace de Lichess en algún puzzle: se abre en el navegador (o en la app de Lichess, si la tienes).

## Cómo está armado
- `src/puzzles/puzzles.json` tiene los 10.000 puzzles (1,36 MB). La app pasó de 5,7 a 7 MB y todo funciona sin internet.
- Los eligió `scripts/build-puzzles.js` a partir de los 6,1 millones de Lichess: los más populares y jugados, repartidos en ratings de 500 a 2500 y con variedad de temas. Detalle en `docs/puzzles.md`.
- Pantallas: `src/screens/PuzzlesScreen.tsx` y `PuzzleScreen.tsx`. Rutas: `src/app/(tabs)/puzzles.tsx` y `src/app/puzzle.tsx`.
- **Pruebas que hice en la PC:**
  - Recorrí los 10.000 puzzles con la misma lógica de la pantalla: todas las jugadas son legales, siempre juegas con tu color y los de mate terminan en mate.
  - El puzzle del día no se repite en un año.
  - La práctica respeta nivel y tema.

## Limitaciones de esta versión
- No hay rating de puzzles propio: solo resuelto o no resuelto, como pedía el mapa.
- Los puzzles que coronan en otra pieza que no sea dama quedaron afuera, porque el tablero todavía corona siempre a dama.
- No se probó en el celular al escribirlo: si ves un error, copia el mensaje y lo corregimos.
