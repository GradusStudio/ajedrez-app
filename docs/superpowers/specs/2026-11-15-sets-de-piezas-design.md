# Sets de piezas nuevos: formas propias por estilo y por material

Fecha: 15-11-2026 · Diseño: opus · Pedido del autor: «Clásico, Minimalista y Redondeado se ven prácticamente iguales; las texturas de madera y mármol no me convencen; que magma tenga detalles como el set de hielo, pero en su temática; que lingling use ComfyUI para generar los sets nuevos y otras texturas, y que la forma de las piezas cambie según la temática».

**Referencias visuales (raíz del repo, fuera de git):**
- `prototipo-piezas-actual.html`: los 9 sets de hoy lado a lado. Se ve el problema: los cinco planos son la misma figura Staunton de ícono, y los cuatro de material son la silueta del Clásico rellena con una textura.
- `prototipo-magma.html`: hielo de hoy y la propuesta de detalles de magma, dibujados en código sobre la silueta del Clásico.

## 1. Sets planos

Los ids no cambian (`clasico`, `minimalista`, `redondeado`), así se conserva lo que cada usuario eligió. Cambian el dibujo y, donde se indica, el nombre visible en los cinco idiomas.

| Set | Qué es ahora | Qué pasa a ser |
|---|---|---|
| Clásico | Staunton de ícono | **Se queda igual** (es el de siempre y el predeterminado). |
| Minimalista | El Clásico con líneas más finas | **«Geométrico»**: cada pieza armada con formas simples, sin detalles internos. Peón: un círculo sobre una base; torre: un rectángulo con tres almenas cuadradas; alfil: una gota con un corte diagonal; caballo: un bloque en ángulo con un ojo; dama: un círculo con cinco puntas; rey: una cruz cuadrada. Se distingue a 40 px solo por la forma. |
| Redondeado | El Clásico con bordes más suaves | **«Juguete»**: proporciones de pieza de juguete (cabeza grande, cuerpo corto, base ancha y baja), todo redondeado y grueso, y un caballo simpático con ojo grande. Pensado para quien recién empieza. |

Gótico y Contorneado también se parecen al Clásico, pero quedan fuera de esta tarea; se revisan después, si el autor quiere.

## 2. Sets de material, cada uno con su forma

Hoy `pathSetOf` manda los cuatro materiales a las siluetas del Clásico. Ahora cada material tiene **su propia silueta** y su textura:

- **Madera · piezas torneadas.** Anillos y collares de torno, base ancha con bisel, caballo tallado con la crin en surcos. **Texturas nuevas:** boj claro para las blancas y nogal oscuro para las negras, con una veta fina, recta y de poco contraste (sin nudos ni manchas grandes: el ruido de hoy es lo que molesta). Tablero de arce y nogal, con la misma veta suave.
- **Mármol · estatuaria clásica.** Torre como columna estriada con almenas, alfil con mitra, caballo como cabeza de friso griego, dama y rey con una diadema simple, peón como columnita con capitel. **Texturas nuevas:** Carrara blanco con vetas grises finas y suaves, y negro Marquina con vetas blancas finas. Tablero pulido. Se mantiene el filo dorado de las negras.
- **Hielo · cristal facetado.** Siluetas con cortes planos, como talladas en hielo, y las coronas de dama y rey en cristales puntiagudos. Se mantienen la nieve, los carámbanos y el copo (`winter.ts` ya los calcula a partir de la silueta, así que se adaptan solos a la forma nueva). La textura se puede quedar.
- **Magma · obsidiana volcánica.** Siluetas de roca con bordes quebrados y coronas de puntas de roca. Los detalles nuevos se describen en la sección 3. La textura de las piezas se puede quedar; **el tablero de magma está muy cargado** y las piezas se pierden: hay que regenerarlo con menos contraste y menos brillo, dejando la lava en las juntas.

## 3. Detalles de magma (como los de hielo)

Un módulo puro nuevo, `src/pieces/volcano.ts` (igual que `winter.ts`, con pruebas), calcula a partir de la silueta:

1. **Lava que chorrea desde arriba:** cubre la punta de la pieza (7 % del alto) con cinco goteos de largo distinto, rellena con un degradé de amarillo `#FFD54A` a naranja `#FF7A12` y a rojo `#D93A00`. Se recorta con la silueta: con `sil` en las blancas y con `ink` en las negras.
2. **Grietas encendidas:** dos zigzags que bajan por el cuerpo y una rama corta, con un trazo naranja difuminado de 1,8 y un núcleo amarillo de 0,7. También recortadas con la silueta.
3. **Gotas de lava en la base:** cuatro gotas que cuelgan, como los carámbanos del hielo, con el mismo degradé y el contorno de la pieza.
4. **Brasas:** tres puntos chicos encima de la pieza, con un halo difuso.
5. En las negras, el filo naranja (`rim`) pasa de 0,7 a **1,1** de grosor y opacidad plena, para que la pieza se separe de la casilla oscura.

En el tablero, todo **quieto**. En la vista previa de la tienda, las brasas pueden latir (opacidad de 0,6 a 1 en 2 s); con «reducir movimiento», quietas. En `MATERIAL_SETS`, magma suma `volcano: true` (como `winter: true` en hielo).

El prototipo lo dibuja sobre la silueta del Clásico. Con la silueta de obsidiana el cálculo es el mismo; revisar a ojo que las grietas no tapen los detalles de las piezas negras.

## 4. Cómo se generan (lingling, con ComfyUI)

**Modelos:** SDXL base (ya instalado) y solo LoRAs o ControlNets cuya licencia permita el uso comercial y distribuir las imágenes. Cada modelo se anota (nombre, versión, licencia y enlace) en `docs/design.md`, sección nueva «Piezas y texturas con ComfyUI», y se actualiza Créditos (`credits.pieces.what` en los cinco idiomas: qué sets salieron de ChatGPT y cuáles de ComfyUI). **Anima no se usa nunca dentro de la app.**

**Siluetas, por set:**
1. Generar una hoja con las seis piezas de frente: vista lateral ortográfica, fondo blanco liso, sin sombra ni perspectiva. Usar ControlNet (lineart o canny) con las siluetas del Clásico como guía, a fuerza media, para que se mantengan el orden de alturas (rey la más alta, peón la más baja) y la proporción, mientras la forma cambia según la temática. Probar varias semillas.
2. Si img2img o ControlNet deforman de más (pasó con el hielo el 2-11), bajar la fuerza o generar pieza por pieza con la misma semilla y el mismo prompt.
3. **Punto de control: el autor aprueba antes de vectorizar.** Por cada set, una hoja de contacto PNG con las seis piezas blancas y las seis negras, sobre el tablero verde y sobre su propio tablero, a 40 px y a 120 px. Se guarda en el vault, en la nota nueva «Gradus - Piezas nuevas». No se integra nada sin el visto bueno.
4. Vectorizar lo aprobado con un script nuevo, `scripts/build-piece-sets.ts` (umbral → potrace → `sil` e `ink`): mismo formato de `pieceSets.ts` (viewBox 0 0 100 100, `evenodd`), misma línea de base y altura por tipo de pieza que el Clásico (±5 %), centradas. El script regenera `pieceSets.ts` (su cabecera ya dice «GENERADO»). Las imágenes aprobadas van a `assets/fuente/piezas/<set>/`.

**Texturas** (madera, mármol, tablero de magma y, si hace falta, hielo): 256 px y sin costuras para la app, con los originales de 768 px en `assets/fuente/texturas/`; las anteriores se mueven a `*-anterior/`, como ya se hizo con el hielo. Hoja de contacto con un tablero completo en la posición inicial y a mitad de partida, para que el autor la apruebe.

**Legibilidad, en todas:** a 40 px se tiene que distinguir cada pieza (rey de dama, alfil de peón), y las negras tienen que separarse de la casilla oscura de su propio tablero.

## 5. Código

- `materials.ts`: `pathSetOf(id)` devuelve el set propio de cada material; `PIECE_PATHS` (o un mapa aparte, generado por el mismo script) suma `madera`, `marmol`, `hielo` y `magma`. `pieceClipIds` sigue funcionando con el set nuevo.
- `Piece.tsx`: dibuja los detalles de `volcano.ts` como hoy dibuja los de `winter.ts`.
- `PIECE_SET_META`: los nombres y las descripciones de Geométrico y Juguete, en los cinco idiomas (de, it y fr con gemma4, revisando puntuación y términos).
- No cambian los precios, las compras guardadas ni los ids.

## 6. Etapas

1. **Magma con detalles** (`volcano.ts` sobre la silueta de hoy): no depende de ComfyUI y se puede publicar enseguida.
2. **Generar con ComfyUI** las siluetas de los seis sets nuevos (Geométrico, Juguete, Madera, Mármol, Hielo y Magma) y las texturas → hojas de contacto → **aprobación del autor**.
3. **Integrar** lo aprobado: script de vectorización, `pieceSets.ts`, `materials.ts`, Créditos, textos y publicación.

## Cómo se comprueba

- `npm test` (más `volcano.test.ts` y pruebas del script: alturas por tipo, línea de base, caja dentro del viewBox), `npx tsc --noEmit`, `npx expo lint`, `noHardcoded`.
- Navegador (`web-compilada`) a 1366 y 375 px: la tienda con cada set (vista previa y miniaturas), una lección, un puzzle y una partida con cada uno; el rey caído del mate (`FallenKing`) con las siluetas nuevas; la animación de arrastre.
- Celular (Expo Go): que se lean a 40 px y que el tablero no se ponga lento con los detalles de magma (16 piezas con degradés y difuminados).
