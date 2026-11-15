# Sets de piezas con ChatGPT (reemplaza la etapa 2 con ComfyUI)

Fecha: 15-11-2026 · Diseño: opus · Decisión del autor: «ya que estamos en ChatGPT, probemos con las piezas; las de hielo me gustan como están, y las clásicas y las góticas tampoco las cambies». Sigue a `2026-11-15-sets-de-piezas-design.md`: las secciones 1 a 3 (qué es cada set) y 5 (código) siguen valiendo; esta spec cambia **cómo se generan las siluetas** (sección 4), porque con ComfyUI y ControlNet no salieron sets completos (tareas 45 y 46).

## Alcance

| Set | Qué se hace |
|---|---|
| Clásico | **No se toca.** |
| Gótico | **No se toca.** |
| Hielo | **No se toca:** queda con la silueta del Clásico, su textura, la nieve, los carámbanos y el copo. |
| Contorneado | No se toca (el autor no lo pidió; se puede sumar después). |
| Minimalista → **Geométrico** | Silueta nueva con ChatGPT. |
| Redondeado → **Juguete** | Silueta nueva con ChatGPT. |
| **Madera** | Silueta torneada nueva con ChatGPT + texturas nuevas. |
| **Mármol** | Silueta de estatuaria nueva con ChatGPT + texturas nuevas. |
| **Magma** | Silueta de obsidiana nueva con ChatGPT; se mantienen sus detalles (`volcano.ts` se adapta a la silueta) y se regenera el tablero con menos contraste. |

## Quién hace qué

- **Siluetas:** la sesión `sonnet`, en ChatGPT, cuando termine las poses de la tarea 47 (es la misma ventana de ChatGPT). El autor aprueba a medida que salen.
- **Texturas** (madera, mármol, tablero de magma) y **vectorización e integración:** lingling.

## Pedido a ChatGPT (una imagen por set)

Texto común (en inglés):

> Flat vector chess piece set for a mobile app, six pieces in one row in this exact order from left to right: king, queen, rook, bishop, knight, pawn. Front orthographic side view, all standing on the same baseline, same scale, king tallest and pawn shortest, generous even spacing, pure white background, no shadows, no gradients, no textures, no text. Top row: the white pieces, drawn with a thick black outline and a few black interior detail lines on a white fill. Bottom row: the same six shapes as solid black pieces, with the interior details as thin white lines. Clean icon style that can be traced into vectors. Theme: «TEMA».

Tema de cada set:

- **Geométrico:** `built only from simple geometric primitives: the pawn is a circle on a small base, the rook a rectangle with three square battlements, the bishop a drop with a diagonal cut, the knight an angular block with one round eye, the queen a circle crown with five points, the king a square cross; no ornaments, almost no interior lines, bold modern look`.
- **Juguete:** `chunky toy chess pieces: big rounded heads, short bodies, wide low bases, soft rounded shapes like wooden toys for kids; the knight is a friendly horse head with a big round eye; no faces on the other pieces`.
- **Madera:** `hand-turned wooden Staunton pieces: lathe rings and collars, wide beveled base, elegant tapered bodies, the knight a carved horse head with grooves in the mane; the interior lines show the turned rings`.
- **Mármol:** `classical Greek marble statuary: the rook is a fluted column tower with battlements, the bishop wears a mitre, the knight is a horse head from a Greek frieze, king and queen wear simple diadems, the pawn is a small column with a capital`.
- **Magma:** `volcanic obsidian rock pieces: jagged broken edges, faceted rough stone, crowns made of rock spikes; still clearly classic chess pieces: the pawn is short with a round head (not a torch), the bishop has a pointed cut top, the rook has battlements`.

## Cómo se revisa cada imagen (antes de mostrarla)

1. **Están las seis, en orden y sin repetir:** rey, dama, torre, alfil, caballo, peón. El caballo es una cabeza de caballo.
2. **Se distinguen a 40 px:** achicar la imagen y comprobar que el rey no se confunde con la dama ni el alfil con el peón (en magma, la vez anterior, el peón parecía una antorcha).
3. **Alturas en orden** (rey > dama > alfil ≥ caballo ≥ torre > peón) y todas sobre la misma línea.
4. **Fila de abajo = mismas formas** que la de arriba, solo que macizas.
5. Fondo blanco liso, sin sombra ni degradé.

Si algo falla, pedir el arreglo puntual en la misma conversación («the bishop and the pawn look alike: make the pawn shorter with a round head») antes de regenerar todo.

**Punto de control:** cada set aprobado se guarda en `assets/fuente/piezas/<set>.png` y se muestra en la nota del vault «Gradus - Piezas nuevas» (sección nueva «Con ChatGPT»). El autor aprueba; recién después se vectoriza.

## Vectorizar (lingling)

`scripts/build-piece-sets.ts`, como dice la spec anterior:
- Separa las 12 piezas de cada imagen (columnas y filas por los huecos blancos), umbral a blanco y negro y trazado con potrace (la librería `potrace` de npm es GPL v2; es una herramienta de desarrollo y no entra en la app).
- Por cada pieza blanca: `sil` = el contorno exterior relleno; `ink` = lo negro (contorno y detalles). Por cada negra: `sil` = el contorno exterior; `ink` = lo negro, con los detalles blancos como huecos. Es el mismo formato de `pieceSets.ts` (viewBox 0 0 100 100, `evenodd`).
- Escala y línea de base iguales al Clásico: cada tipo de pieza a su misma altura (±5 %), centrada, con el margen de `Piece.tsx`.
- Regenera `pieceSets.ts` (sets planos) y el mapa de siluetas de material (madera, mármol y magma). Hielo, Clásico, Gótico y Contorneado quedan como están: el script no los toca.

## Texturas (lingling, con ComfyUI)

- **Madera:** boj claro (blancas) y nogal (negras) con veta fina, recta y de poco contraste; tablero de arce y nogal.
- **Mármol:** Carrara blanco con vetas grises finas y Marquina negro con vetas blancas finas; tablero pulido.
- **Tablero de magma:** el mismo tema con menos contraste y menos brillo, la lava solo en las juntas, para que las piezas se lean.
- SDXL base (CreativeML Open RAIL++-M, ya anotado en `docs/design.md`) con el modo sin costuras (tiling); el LoRA de texturas solo si su licencia lo permite. 256 px para la app, originales de 768 px en `assets/fuente/texturas/`, las anteriores a `*-anterior/`.
- Hoja de contacto con un tablero completo de cada material (posición inicial y mitad de partida) en la misma nota del vault, para aprobar.

## Cómo se comprueba

Lo de la spec anterior: `npm test` (con pruebas del script: alturas por tipo, línea de base, caja dentro del viewBox), `tsc`, lint, `noHardcoded`; navegador a 1366 y 375 px con cada set en la tienda, una lección, un puzzle y una partida; el rey caído del mate; Créditos (`credits.pieces.what`, en los cinco idiomas, dice qué sets salieron de ChatGPT) y los nombres de Geométrico y Juguete en los cinco idiomas.
