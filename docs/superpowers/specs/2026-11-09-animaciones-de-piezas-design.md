# Animaciones de piezas

Fecha: 9-11-2026. Estado: **decidido por el autor; en construcción**.

## Referencia
Grabación del autor en taketaketake.com (ejercicios), revisada cuadro a cuadro. Se toma solo la idea del movimiento; colores, letra y piezas siguen siendo los de Gradus (`docs/design.md`).

Lo que se vio:
- La pieza arrastrada se ladea hacia donde se mueve.
- Al soltarla vuelve a quedar derecha con un vaivén de cerca de 1 s.
- En el mate, el rey vencido se cae de costado, su casilla se pone roja y las vecinas, naranjas.
- Al resolver, una casilla verde con «+5» crece al lado de la pieza (esto **no** se toma: el autor no lo eligió).

## Qué se hace (elegido por el autor el 9-11-2026)
| Animación | En Gradus |
|---|---|
| Inclinación al arrastrar | Según la velocidad horizontal del dedo, hasta 12° (`dragTilt`). Vuelve a 0° si el dedo se queda quieto. |
| Aterrizaje con resorte | La pieza soltada se asienta desde su inclinación con un resorte corto. La pieza que se desliza sola (jugada del bot, de una lección, tocando destino) se inclina 8° hacia donde va y se asienta igual (`slideTilt`). |
| Rey caído en el mate | El rey vencido cae de costado (90°) al terminar la jugada; su casilla, roja casi llena (`boardHighlight.mate`, 92 %; subido desde 75 % el 9-11-2026 porque se veía pálido). |
| Casillas de escape en el mate | Idea del autor: las casillas vacías alrededor del rey se tiñen de rojo (`boardHighlight.mateEscape`, 55 %) (`mateSquares`). |

Vale para todo `Board`: lecciones, puzzles, partidas, revisión, análisis libre y quiz. Una posición de mate que se muestra quieta (una explicación) también muestra el rey caído.

## Accesibilidad
Con «reducir movimiento» del sistema: sin inclinación ni vaivén; el rey aparece ya caído y las casillas, sin fundido.

## Comprobación
`npm test` (funciones puras de `src/components/boardMotion.ts`), lint, tipos, y en el navegador: arrastrar una pieza, una jugada del bot, un mate en un puzzle y en una lección, en pantalla ancha y a 375 px.
