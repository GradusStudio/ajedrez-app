# Pantalla de Puzzles nueva

Fecha: 14-11-2026 · Diseño: opus · **Referencia visual:** `prototipo-puzzles.html` (raíz del repo, fuera de git; datos de ejemplo).

Hoy la pantalla (`PuzzlesScreen`) es una lista vertical: el contador, la tarjeta del puzzle del día sin tablero, «Práctica» con dos modos de dificultad, una nube de 17 etiquetas de tema y un botón «Practicar». Para practicar un tema hay que tocar dos cosas (el tema y después «Practicar»), y los temas no dicen qué son.

## Pantalla ancha (columna de 1000 px)

### Cabecera
- «Puzzles» (32 px) y debajo «33 resueltos · de una base de más de 6 millones».
- A la derecha, una pastilla con «Tu nivel **1349**» (en `gold`) y el cambio de la semana («▲ 62 esta semana» en verde; si bajó, en `textMuted`). Se oculta si el ajuste «Mostrar mi nivel de puzzles» está apagado.

### Fila de dos tarjetas
**Puzzle del día** (1,25 fr; borde dorado suave, es lo más importante de la pantalla):
- **Tablero** de 220 px con la posición inicial del puzzle (el usuario ya ve qué le espera).
- «PUZZLE DEL DÍA · 14 DE NOVIEMBRE» (12 px, `gold`), «Encuentra la mejor jugada» (26 px), quién juega con un punto blanco o negro y el nivel del puzzle.
- Botón primario **«Resolver»**.
- **Semana del puzzle del día:** siete cuadraditos L a D; dorado si ese día se resolvió el puzzle del día, gris si no, y el de hoy con borde dorado. Se calcula con `progress.puzzles` (resultado y fecha) y el id del puzzle de cada día, que ya se sabe calcular.
- Si ya se resolvió hoy: el tablero con la posición final, «Resuelto ✓» y «Vuelve mañana por otro», con «Ver otra vez» como botón secundario. Si se vio la solución, «Viste la solución».

**Práctica** (1 fr):
- «PRÁCTICA», «Puzzles a tu nivel» y una línea que explica cómo funciona: «Uno tras otro, cerca de tu nivel. El nivel sube si los resuelves sin errores.»
- **Selector de dificultad** en una fila: **Automático** (con «cerca de 1349» debajo) y los cuatro niveles (Fácil «hasta 1200», Medio «1200–1800», Difícil «1800–2500», Experto «2500+»). Reemplaza al par «Automático / Elegir dificultad» + la segunda fila: una sola elección. Cada botón con ancho mínimo para que «Automático» no se corte.
- Botón **«Practicar»** (secundario: en esta pantalla el verde es del puzzle del día).

### Practicar un tema
Tarjeta a todo el ancho con «Practicar un tema» y, a la derecha, «Toca un tema para empezar». Grilla de **4 columnas** con «Todos» y los 16 temas. Cada tema es un botón con:
- **Diagrama** de 58 px: un tablerito de 3 × 3 con dos o tres piezas y flechas doradas que muestran la idea (la horquilla, un caballo atacando a dos piezas; la clavada, alfil, pieza y rey en línea; el mate en 1, 2 o 3, con el número en una etiqueta roja). Son dibujos fijos, definidos una vez por tema (`src/puzzles/themeDiagrams.ts`), con las piezas del set del usuario.
- Nombre del tema (15 px, 900) y debajo «5 resueltos · 820 mil» (los resueltos en verde, solo si hay; la cantidad disponible en ese tema, redondeada: «6,2 M», «820 mil»).
- **Un toque empieza** la práctica de ese tema con la dificultad elegida arriba. Ya no hay que elegir y después tocar «Practicar».

**Dato nuevo:** para contar los resueltos por tema, `PuzzleRecord` suma `themes?: string[]` (los temas del puzzle, guardados al resolverlo). Es opcional y sin subir `PROGRESS_VERSION`; los puzzles resueltos antes no tienen tema, así que el contador empieza desde ahora. La cantidad disponible por tema sale de `manifest.json` en la web y de los 50.000 puzzles en el celular.

## Celular

Una columna: cabecera (con el nivel debajo del título), puzzle del día con el tablero a lo ancho, práctica, y los temas en grilla de 2 columnas.

## Accesibilidad y textos

- Cada tema es un botón con etiqueta completa («Practicar Horquilla, 5 resueltos, 820 mil puzzles»); el diagrama es decorativo.
- La semana del puzzle del día tiene etiqueta («Puzzle del día esta semana: lunes resuelto, martes resuelto, miércoles sin resolver…»).
- Plurales con `tn` («1 resuelto», «5 resueltos»). Textos de tú, sin exclamaciones, en los cinco idiomas.

## Cómo se comprueba

- `npm test` (la semana del puzzle del día, el conteo por tema, el redondeo de cantidades), `npx expo lint`, `npx tsc --noEmit`, `noHardcoded`.
- Navegador (`web-compilada`) a 1366 y 375 px: puzzle del día sin resolver, resuelto y con la solución vista; cambiar dificultad; tocar un tema y que empiece la práctica de ese tema; con el nivel oculto; sin conexión (el mensaje de siempre).
