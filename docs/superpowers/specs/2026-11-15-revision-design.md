# Pantalla de revisión de partida

Fecha: 15-11-2026 · Diseño: opus · **Referencia visual:** `prototipo-revision.html` (raíz del repo, fuera de git), vistas «1 · Resumen» y «2 · Revisión». Datos de ejemplo: la partida de la Ópera.

Hoy (`GameReviewScreen`, `src/screens/review/`) la revisión funciona bien, pero se ve como una herramienta: el resumen es una tabla larga con un botón al final, el comentarista es una cara chica en un globo, hay nueve botones del mismo peso debajo del tablero («Al inicio», «Al final», «Mejor», «Línea», «Reproducir», «Siguiente»…) y la vuelta es el texto viejo «‹ Análisis». Esta tarea cambia la presentación; el análisis, los comentarios (`coachText.ts`), las calidades y los datos no cambian.

## 1. Arriba

- `BackButton` («Análisis», como en el resto de la app desde la tarea 32) en lugar de `TopBar` con texto. El engranaje de ajustes de la revisión queda a la derecha, como botón redondo del mismo estilo (40 px, `surfaceRaised`, sombra 4 px).

## 2. Resumen (antes de empezar)

Pantalla ancha: dos tarjetas lado a lado (columna de 1060 px).

**Izquierda · la partida**
- Rótulo «REVISIÓN DE PARTIDA».
- Los dos jugadores enfrentados: un **anillo de precisión** de 120 px por lado (trazo de 10 px; verde `primary` el del usuario, gris `textMuted` el del rival; número de 30 px en el centro y «precisión» debajo), el nombre («Tú» o el usuario de chess.com / Lichess; el bot con su cara si es una partida contra un bot) y el color con el que jugó.
- En el medio: el resultado en `gold` (20 px, «1–0»), cómo terminó y cuántas jugadas.
- Debajo, la tabla de calidades como hoy (símbolo de color, nombre, Tú / Rival), con los ceros en gris oscuro (`#5a5753`) para que se lean solo los números que importan.
- Si no se sabe el bando del usuario (PGN pegado), «Blancas» y «Negras» en lugar de «Tú» y «Rival».

**Derecha · momentos clave**
- Rótulo «MOMENTOS CLAVE» y «Las jugadas donde la partida cambió. Empieza por acá.»
- Una fila por cada destacada de `review.highlights` (hasta 5): el símbolo de calidad, la jugada en notación del usuario («6.Ac4 · Cf6» o «11.Axb5+»), la primera frase del comentario y la diferencia de evaluación en el color de la calidad. Tocar una fila abre la revisión en esa jugada.
- «Te lo explica Don Ramiro · cambiar»: cara de 40 px y enlace que abre el selector de comentarista de `SettingsSheet`.
- Botones: **«Empezar revisión»** (principal) y «Practicar mis errores» (secundario; mismas condiciones que hoy).
- Sin destacadas: «No hubo momentos clave: la partida fue pareja de principio a fin.» y solo «Empezar revisión».

**Celular:** una columna con la tarjeta de la partida (anillos de 96 px), los momentos clave y los botones al final, fijos al pie si la pantalla no alcanza.

## 3. Modo revisión

Pantalla ancha (`BoardLayout`): barra de evaluación (26 px) y tablero a la izquierda; panel de 380 px a la derecha. Debajo del tablero, la navegación y el gráfico.

**Panel derecho, de arriba abajo**
1. **Comentarista de cuerpo entero** (92 × 122 px, imagen de `assets/bots/cuerpo/`) a la izquierda y el globo blanco a la derecha, con la colita hacia él (mismo globo que la lección, `TeacherBubble`). Arriba del texto, en una línea, el símbolo de calidad, la jugada y el nombre de la calidad en su color («Axb5+ · Excelente»). En la posición inicial: «Empecemos. Hay 3 momentos clave en esta partida.» Si el bot no tiene cuerpo, se usa la cara de la expresión, como hoy.
2. Dos botones secundarios en una fila: **«Mostrar la mejor»** (alterna con «Ocultar la mejor»; la flecha verde) y **«Ver la línea»** (lo que hoy hace «Línea»; «Explicar» se queda dentro del globo como enlace si hay más texto).
3. **«Siguiente momento clave»** (principal, a lo ancho). Al pasar el último, vuelve al resumen con «Terminaste la revisión».
4. El filtro **Todas las jugadas / Solo destacadas** como dos pastillas (borde `primary` la elegida). Sigue decidiendo solo a qué salta el botón principal.
5. La lista de jugadas en una tarjeta con su propio desplazamiento: número, y cada jugada con su símbolo de calidad (18 px) delante. La actual con fondo dorado suave (`rgba(247,198,49,.18)`) y borde dorado. Se desplaza sola para que la actual se vea.

**Debajo del tablero**
- Cuatro botones de navegación iguales (48 × 44, `surfaceRaised`, sombra 4 px): al inicio, anterior, siguiente, al final. Las flechas del teclado siguen funcionando. «Reproducir» pasa al menú de ajustes (casi no se usa y competía con lo demás).
- El **gráfico de evaluación** (74 px de alto, a lo ancho de barra + tablero): relleno claro para las blancas, línea del medio, puntos de color en las imprecisiones, errores, errores graves y jugadas brillantes o excelentes, y una línea dorada de 3 px en la jugada actual. Tocarlo salta a esa jugada.

**Tablero:** la insignia de calidad en la esquina de arriba a la derecha de la casilla de llegada (26 px, círculo del color de la calidad, sombra), la última jugada en amarillo y las flechas de hoy (roja = lo que permite, verde = la mejor).

**Celular:** barra de evaluación horizontal arriba del tablero (como hoy); debajo del tablero, el comentarista (cuerpo de 64 px) con el globo, la fila de botones, «Siguiente momento clave», y la navegación + la lista de jugadas en una tira horizontal (`MoveStrip`). El gráfico va arriba de la tira.

## 4. Colores de calidad

Los de hoy (`src/screens/review/quality.ts`). No se cambian; solo se usan también en los puntos del gráfico y en la diferencia de los momentos clave.

## Accesibilidad y textos

- Los anillos tienen etiqueta («Tu precisión: 85,4»). Cada momento clave es un botón («Jugada 6 de las negras, Cf6, imprecisión: había una jugada más fuerte. Ir a esta jugada»).
- La insignia del tablero no es la única señal: el globo siempre dice el nombre de la calidad.
- Textos nuevos en los cinco idiomas, de tú, sin exclamaciones: «Momentos clave», «Las jugadas donde la partida cambió. Empieza por acá.», «Te lo explica {bot}», «cambiar», «Mostrar la mejor», «Ocultar la mejor», «Ver la línea», «Siguiente momento clave», «Todas las jugadas», «Solo destacadas», «Terminaste la revisión», «No hubo momentos clave…», «precisión». de/it/fr con gemma4 vía Ollama, revisando puntuación y términos.

## Cómo se comprueba

- `npm test`, `npx expo lint`, `npx tsc --noEmit`, `noHardcoded`.
- Navegador (`web-compilada`) a 1366 y 375 px con: una partida contra un bot, una de Lichess y un PGN pegado (sin bando); recorrer los momentos clave hasta volver al resumen; «Mostrar la mejor»; tocar el gráfico; teclado; abrir una revisión guardada desde Análisis.
- Celular (Expo Go): que el panel entre sin desplazarse en el Redmi y que la lista siga a la jugada actual.
