# Corona de Aprender: número y nombre de cada unidad

Fecha: 15-11-2026 · Diseño: opus · Pedido del autor: «el menú de selección solo muestra el número de unidad; identificarlos con su temario (como Finales intermedios), con los textos orientados con los gajos (la línea que va desde el centro por el medio del gajo es la línea de alineación del texto) y que giren con los gajos cuando se animan».

**Referencia visual:** `prototipo-rueda-nombres.html` (raíz del repo, fuera de git). Tiene la geometría y el resorte de `UnitWheel.tsx`, y se puede cambiar a alemán (los nombres más largos) y ver las unidades cerradas.

## Qué cambia

Hoy cada gajo de la corona (`src/components/UnitWheel.tsx`, solo en pantalla ancha) muestra solo el número, siempre horizontal. Ahora cada gajo muestra:

1. **El número de la unidad**, en 22 px los gajos de los costados y 34 px el elegido (900, como hoy pero más chico, porque ahora lo acompaña el nombre).
2. **El nombre de la unidad** debajo del número (`unit.title` del idioma actual: «Finales intermedios», «Endspiele für Fortgeschrittene»), en 12,5 px los de los costados y 15,5 px el elegido (800), en **uno o dos renglones**, centrados.
3. Si la unidad está cerrada, el candado pasa al lado del número (arriba a la derecha), no debajo.

## Orientación y giro

- Todo el texto del gajo (número, nombre y candado) se dibuja **en el sistema del gajo**: dentro del mismo `rotate(a, CX, CY)` que el gajo, centrado sobre el radio medio (`(R + RIN) / 2 + 4`) del eje del gajo. Cada renglón corre **a lo largo del eje** (de adentro hacia afuera), y los renglones se apilan a los costados del eje.
- Así, el gajo elegido (eje horizontal) se lee derecho, y los de arriba y abajo quedan inclinados ±60° siguiendo su gajo. Como la corona solo muestra la mitad derecha (de −90° a +90°), el texto nunca queda dado vuelta.
- **Gira con el gajo:** durante el resorte, el arrastre, la rueda del mouse y las flechas, el texto usa el mismo ángulo `a = (i − pos) × 60°` en cada cuadro, sin animación propia. El tamaño y el color siguen interpolándose con `e`, como hoy.
- Con «reducir movimiento», el salto es directo, como ya pasa con los gajos.

## Que entre el texto

- Largo útil sobre el eje: `R − RIN − 26` = 112 px.
- El nombre se parte por palabras en hasta **dos renglones** que entren en 112 px; si con dos renglones no entra, se achica la letra de a medio punto hasta **12 px como mínimo**. Medir con la fuente real (en la web con `measureText`, en nativo con el ancho estimado de Nunito, o calcular una vez por idioma y guardar los cortes).
- En el prototipo entran los nueve nombres de los cinco idiomas, incluidos los alemanes («Taktik für / Fortgeschrittene», «Endspiele für / Fortgeschrittene»).

## Color

- Unidad abierta: como hoy (de `textMuted` a `text` según `e`).
- Unidad cerrada: el texto del gajo de costado pasa de `outline` (#5a5753) a **#8B8986**, para que el nombre se lea (con solo el número no hacía falta). El elegido cerrado, `textMuted`.

## Accesibilidad y textos

- La etiqueta de cada gajo ya dice número y título (`home.unitWheelLabel`); no cambia.
- No hay textos nuevos: se usan los títulos de las unidades que ya están en los cinco idiomas.

## Aperturas

La misma corona se usa en Aperturas con nombres cortos (`labels="short"`). Para que las dos se vean iguales, esos nombres también giran con su gajo (mismo sistema, un renglón, mismo tope de 112 px).

## Cómo se comprueba

- `npx tsc --noEmit`, `npx expo lint`, `npm test`. Si el corte de renglones queda en una función pura (recomendado), pruebas con los nombres más largos de cada idioma.
- Navegador (`web-compilada`) a 1366 px en es y de: girar con arrastre, rueda, flechas y toque; que el texto gire pegado a su gajo en cada cuadro (sin saltos ni retraso), que los nombres entren y que las unidades cerradas se lean. Aperturas igual. A 1100 px (barra compacta), lo mismo.
