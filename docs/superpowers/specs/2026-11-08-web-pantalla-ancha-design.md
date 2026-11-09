# Gradus web en pantalla ancha

Fecha: 8-11-2026. Estado: **aprobada; etapas 1 y 2 hechas el 8-11-2026** (ver secciones 8 y 9). Es uno de los cinco puntos de interfaz del vault («Rediseño de bots», sección «Los cinco puntos de interfaz»).

## 1. Problema

En la computadora la app es una franja de celular de 480 px en el medio (`WebColumn.web.tsx`), con la barra de pestañas abajo como en un teléfono. En una pantalla de 1440 × 900 quedan dos tercios vacíos y el tablero mide 448 px, aunque entraría uno de unos 700. Quien juega ajedrez en la computadora está acostumbrado a otra disposición: tablero grande a la izquierda y la información a la derecha (lichess, chess.com).

Capturas del 8-11-2026 a 1440 × 900: la lección, el inicio (Aprender) y la ficha de un bot ocupan la franja central; el resto es fondo liso.

## 2. Alcance

- Solo la web, y solo con ventana ancha. En el celular (web o Expo Go) y en ventanas angostas, todo queda exactamente como hoy.
- Ancha = **ancho de ventana de 960 px o más**. Lo decide un solo gancho, `useWideLayout()` (`.web.ts`; en nativo siempre `false`), para que no haya números sueltos por las pantallas.
- Mismos colores, letra, botones y textos (`docs/design.md`). No hay textos nuevos: no hace falta traducir nada.

## 3. Dirección visual

No es un rediseño de la marca: es la misma app, ordenada para una pantalla horizontal. La regla que guía todo: **el tablero manda**. En las pantallas de juego es lo más grande y está siempre a la vista; todo lo demás se acomoda a su lado y nunca lo empuja hacia abajo.

### Navegación: barra lateral
```
┌────────────┬──────────────────────────────────────────┐
│ [♞] Gradus │                                          │
│            │                                          │
│ ▣ Aprender │           contenido de la pestaña         │
│ ◇ Aperturas│                                          │
│ ◇ Puzzles  │                                          │
│ ◇ Bots     │                                          │
│ ◇ Análisis │                                          │
│ ◇ Perfil   │                                          │
└────────────┴──────────────────────────────────────────┘
```
- Las mismas 6 pestañas, a la izquierda (`tabBarPosition: 'left'`), con el ícono de Gradus y el nombre arriba.
- Ancho 232 px con ícono y etiqueta (15 px, peso 800). Entre 960 y 1199 px de ventana, solo íconos (76 px) para dejarle lugar al tablero.
- Pestaña activa: fondo `surface-raised` con radio 16 e ícono y texto en `primary`, como un botón seleccionado. Inactivas: `text-muted`, sin fondo. Fondo de la barra: `surface`, con borde derecho de 2 px `surface-raised`.
- Las pantallas que hoy van fuera de las pestañas (lección, partida, puzzle, revisión) siguen ocupando toda la ventana, sin barra lateral, como ahora: son momentos de concentración.

### Pantallas con tablero: tablero a la izquierda, panel a la derecha
```
┌──────────────────────────────────────────────────────────┐
│ ✕  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ (barra de progreso de la lección)   │
│ ┌──────────────────────────┐  ┌─────────────────────┐   │
│ │                          │  │ (Pipo) globo        │   │
│ │                          │  │                     │   │
│ │        tablero           │  │ opciones / jugadas  │   │
│ │   (lo más grande que     │  │ / botones           │   │
│ │    entre por alto)       │  │                     │   │
│ │                          │  │                     │   │
│ └──────────────────────────┘  └─────────────────────┘   │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ panel Correcto / Incorrecto + CONTINUAR (de lado a lado) │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```
- Un componente nuevo, `BoardLayout` (tablero + panel), reemplaza el «tablero arriba, todo lo demás abajo» de cada pantalla. En una ventana angosta apila los dos en el mismo orden de hoy; en una ancha los pone lado a lado.
- **Tamaño del tablero:** el más grande que entre por alto (alto de la ventana menos encabezado, panel inferior y márgenes) y por ancho (dejando 380 px al panel), con tope de 720 px y múltiplo de 8. Hoy `Board` calcula su tamaño con el ancho de la ventana (`boardPixels`); pasa a leerlo de un contexto que fija `BoardLayout`, y sin contexto se comporta como siempre.
- Panel derecho: 380 px, con lo que hoy va debajo del tablero, en el mismo orden. Si no entra, se desplaza solo el panel; el tablero queda quieto.
- El conjunto (tablero + panel) se centra con un ancho máximo de 1180 px. A los costados, el fondo liso de siempre.
- El panel inferior de la lección (Correcto, Incorrecto, Continuar) se estira hasta ese mismo ancho máximo, como una barra al pie.
- La barra de evaluación (revisión y análisis libre) sigue pegada al tablero, a su izquierda, con el mismo alto que él.

### Pantallas de lista (Aperturas, Puzzles, Bots, Perfil, Ajustes, Aprender)
- Etapa 1: una columna centrada de 640 px dentro del área de contenido (hoy 480). Nada más.
- Etapa 3, si gusta lo anterior: las listas de tarjetas (bots, cursos de apertura, sets y tableros de la tienda) en una grilla de 2 o 3 columnas, y en Aprender una columna derecha con racha, meta diaria y monedas, que hoy van arriba.

## 4. Etapas

| Etapa | Qué entra | Pantallas |
|---|---|---|
| 1 | Gancho `useWideLayout`, barra lateral, columna de 640 px, `BoardLayout` y tamaño del tablero por contexto. Lecciones y puzzles. | Pestañas, los 6 tipos de paso de lección, `PuzzleScreen` |
| 2 | Las demás pantallas con tablero. | `GameScreen`, `GameReviewScreen`, `FreePlayScreen`, `TurningPointQuizScreen` |
| 3 | Grillas y columna derecha en Aprender. | Bots, Aperturas, tiendas, Inicio |

Cada etapa termina en un commit, probada en el navegador a 1440 × 900, 1280 × 720 y 1024 × 768, y en 375 px de ancho para confirmar que el celular no cambió.

## 5. Calidad mínima
- Nada cambia en Expo Go ni en la web del celular (se comprueba con capturas antes y después a 375 px).
- Con la ventana de 960 a 1199 px y 650 px de alto (una notebook común con el navegador abierto), el tablero y el panel entran sin desplazar la página.
- Achicar o agrandar la ventana reacomoda todo en vivo, sin recargar.
- Foco de teclado visible en la barra lateral. Las pestañas se recorren con Tab.
- `npm test`, `npx expo lint` y `npx tsc --noEmit` sin errores. Pruebas nuevas para el cálculo puro del tamaño del tablero (`boardSize.ts`).

## 6. Fuera de esta spec
- Atajos de teclado para jugar (flechas para recorrer jugadas, etc.).
- Tabletas en la app nativa (siguen como hoy).
- Cambios de colores o de textos.

## 7. Preguntas abiertas
1. ¿Arrancamos solo con la etapa 1 (lecciones y puzzles) y miramos antes de seguir, o hacemos 1 y 2 juntas?

## 8. Etapa 1, hecha (8-11-2026)
- `useWideLayout` (`src/components/useWideLayout.web.ts`, constantes en `wideLayout.ts`), `WideSidebar` (barra lateral propia pasada como `tabBar` con `tabBarPosition: 'left'`), `BoardLayout` + `BoardSizeContext` + `wideBoardPixels` (con pruebas) y `useBoardLayoutWidth` para alinear encabezado y panel inferior con el tablero.
- Las pantallas de la pila siguen en 480 px (`contentStyle` en `_layout.tsx`) salvo las pestañas, `leccion/[id]` y `puzzle`, que usan toda la ventana. Las pestañas van en una columna de 640 px (`sceneStyle`).
- En pantalla ancha, el panel de Correcto/Incorrecto de la lección y del puzzle es una barra de lado a lado con el texto alineado al tablero y el botón a la derecha.
- Medido en el navegador (servidor de desarrollo): 1440 × 900, tablero de 664 px; 1280 × 720, 488 px; 1024 × 768, 560 px con la barra lateral solo con íconos; ninguna se desplaza. A 375 px, lección, puzzle e inicio quedan como antes. Sin probar todavía en el sitio publicado.
- Nota para desarrollar: `expo start --web` sirve la app en la raíz (`/`), no en `/app` (el prefijo solo se aplica al compilar). No arrancarlo con `CI=1`: apaga la recarga al guardar.
- **Barra de desplazamiento (8-11-2026, pedido del autor):** en pantalla ancha la barra quedaba pegada a la columna. Ahora las pantallas de lista usan `ColumnScrollView`: la zona que se desplaza ocupa toda la ventana (la barra queda contra el borde derecho) y solo el contenido se centra en la columna, cuyo ancho llega por `ColumnContext` (640 px en las pestañas, 480 en la pila). La tarjeta flotante del inicio se centra en la columna. Partida, revisión, análisis libre, quiz y bienvenida siguen encerradas en la columna entera hasta la etapa 2.

## 9. Etapa 2, hecha (8-11-2026)
- **Partida** (`GameScreen`): en pantalla ancha, el bot, su globo, tus datos, las jugadas y los botones van al panel; el resultado aparece como tarjeta en el panel (en el celular sigue al pie). Reserva de alto 110 px.
- **Análisis libre** (`FreePlayScreen`): barra de evaluación y tablero a la izquierda; Stockfish, jugadas y botones a la derecha. Reserva 230 px.
- **Revisión** (`GameReviewScreen`): barra de evaluación y tablero a la izquierda; comentarista y lista de jugadas a la derecha; la barra de herramientas de abajo alineada con el tablero. Reserva 240 px (con menos, la zona se desbordaba unos píxeles, aparecía la barra de desplazamiento y corría todo 8 px). El resumen y «Analizando» van en la columna de 480 px (`ColumnScrollView`, `useColumnWidth`) y su botón de abajo se alinea con ella (`useColumnBarPadding`).
- **Quiz de errores** (`TurningPointQuizScreen`): como los puzzles; el final, en la columna.
- `useBoardSide` (`BoardSizeContext.ts`) da el lado del tablero a `Board` y `EvalBar`; `EvalGraph` acepta un ancho.
- En el celular cada pantalla conserva su orden (en la partida el bot sigue arriba del tablero).
- Medido en 1440 × 900: partida con tablero de 720 px y el resultado en el panel; análisis libre 664 px; revisión 656 px; ninguna se desplaza. A 375 px, la partida igual que antes. **El quiz no se probó en el navegador**: solo aparece después de importar una partida por usuario de chess.com o Lichess (con un PGN pegado no se sabe de qué bando se jugó).
