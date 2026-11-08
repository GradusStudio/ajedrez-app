# Design system · App de ajedrez

Estilo: paleta oscura verde (referencia chess.com) + tipografía y botones 3D redondeados (referencia Duolingo).
Este archivo es la fuente de verdad visual. Cualquier pantalla o componente nuevo debe usar estos tokens.

## 1. Colores

### Marca y acción
| Token | Hex | Uso |
|---|---|---|
| `primary` | `#81B64C` | Botón principal, progreso, estados correctos |
| `primary-shadow` | `#45753C` | Borde inferior 3D del botón principal |
| `on-primary` | `#262421` | Texto e íconos sobre `primary` (6,43:1) |
| `gold` | `#F7C631` | Rachas, puntos, logros |
| `danger` | `#FA412D` | Errores, acciones destructivas |
| `danger-shadow` | `#A02A1E` | Borde inferior 3D de estados incorrectos |

### Superficies y texto
| Token | Hex | Uso |
|---|---|---|
| `bg` | `#262421` | Fondo de pantalla |
| `surface` | `#302E2B` | Tarjetas |
| `surface-raised` | `#3C3A37` | Botón secundario, pistas de barras, bordes de tarjeta |
| `surface-shadow` | `#2B2926` | Borde inferior 3D de tarjetas y botón secundario |
| `outline` | `#5A5753` | Contornos finos sobre `bg` |
| `text` | `#FFFFFF` | Texto principal |
| `text-muted` | `#C3C2C1` | Texto secundario, descripciones |

### Estados de respuesta
| Estado | Fondo | Borde | Borde inferior |
|---|---|---|---|
| Correcto | `#3F5A2A` | `#81B64C` | `#45753C` |
| Incorrecto | `#5A2A26` | `#FA412D` | `#A02A1E` |

### Tablero
| Token | Hex |
|---|---|
| `board-light` | `#EBECD0` |
| `board-dark` | `#779556` |

## 2. Tipografía

Fuente única: **Nunito** (Google Fonts), pesos 600, 700 y 800. Fallback: `system-ui, sans-serif`.

| Rol | Tamaño | Peso | Color |
|---|---|---|---|
| Título de pantalla | 24px | 800 | `text` |
| Subtítulo de sección | 20px | 800 | `text` |
| Pregunta / enunciado | 16px | 800 | `text` |
| Cuerpo | 14px | 700 | `text-muted` |
| Notación de jugadas | 14px | 600 | `text-muted` |
| Etiqueta / caption | 12px | 600 | `text-muted` |
| Texto de botón | 14px | 800 | según botón |

Reglas: sentence case en todo el texto. Los botones de acción (Continuar, Practicar, Salir) van en MAYÚSCULAS con `letter-spacing: 0.5px`. Las opciones de respuesta (jugadas) NO van en mayúsculas ni con letter-spacing.

## 3. Forma y espaciado

- Radio de botones, tarjetas y chips de respuesta: **16px**.
- Radio de barras de progreso: 8px.
- Escala de espacio: 4 · 8 · 12 · 16 · 24 · 32.
- Padding de tarjeta: 12px 14px. Padding de pantalla: 16px.
- Sin sombras difusas: la profundidad se logra solo con el borde inferior de color.

## 4. Botones

Todos: `border-radius: 16px`, padding `12px 18px`, borde inferior de **4px** (efecto 3D), fuente Nunito 800 14px.

| Variante | Fondo | Texto | Borde inferior | Uso |
|---|---|---|---|---|
| Primario | `primary` | `on-primary` `#262421` (6,43:1; el blanco daba 2,41:1) | `primary-shadow` | Acción principal (máximo uno por pantalla) |
| Secundario | `surface-raised` | `#FFFFFF` | `surface-shadow` | Acciones alternativas |
| Destructivo | transparente, borde 2px `surface-raised` | `danger` | 4px `surface-raised` | Salir, abandonar |
| Opción de respuesta | `surface-raised` | `#FFFFFF` | `surface-shadow` | Jugadas en lecciones y puzzles |

Estados:
- **Hover** (web): aclarar el fondo ~6%.
- **Presionado**: `translateY(2px)` y borde inferior de 2px, duración 100ms.
- **Seleccionado**: usar el estilo Correcto/Incorrecto de la sección 1 cuando se evalúe; antes de evaluar, borde 2px `primary`.
- **Deshabilitado**: evitar. Preferir dejar el botón activo y explicar el motivo al usarlo.

## 5. Componentes

### Tarjeta
Fondo `surface`, radio 16, borde 2px `surface-raised`, borde inferior 4px `surface-shadow`, padding 12px 14px.

### Barra de progreso
Alto 14px, radio 8, pista `surface-raised`, relleno `primary`. Junto a ella, contador de racha en `gold`, peso 800.

### Tablero de ajedrez
Casillas `board-light` y `board-dark`. Valores en `boardHighlight` de `src/theme.ts`:

| Resaltado | Color |
|---|---|
| Última jugada | `gold` al 40% |
| Pieza seleccionada | `gold` al 60% |
| Jugada legal sugerida | punto `primary` al 60% |
| Jaque o error | `danger` al 40% |
| Casilla marcada en una explicación o ejercicio | `gold` al 70% con borde `gold` |
| Casilla tocada antes de comprobar (`select_squares`) | azul `#4FA3E0` al 70% con borde `#4FA3E0` |

El azul es la única excepción a la paleta: se eligió en el hito 1 (v2) para que la casilla tocada no se confunda con las marcadas en dorado.

### Barra de pestañas
Fondo `surface`, borde superior 2px `surface-raised`. Ícono y etiqueta activos en `primary`, inactivos en `text-muted`. Etiqueta Nunito 700 de 11px (con 6 pestañas, 12px no entra en un celular). Íconos de 24px. Alto: 62px más el margen inferior del sistema, con un mínimo de 10px. Como la barra de navegación de Android está oculta, ese margen suele ser 0, y sin el mínimo las esquinas redondeadas de la pantalla cortan la barra.

### Nodo de lección (ruta de Aprender)
Círculo de 64px con canto 3D de 4px (`Circle3D`), número de la lección en Nunito 800 22px y el título debajo (13px, 700).
- Completado: `primary`, borde `primary-shadow`, con ✓.
- Actual: igual que completado, con anillo de 3px `primary` y pulso suave (escala 1 → 1,08, 700 ms).
- Bloqueado: `surface-raised`, número en `outline`, título en `text-muted`.
- La línea que une los nodos mide 6px: `primary` hasta la última lección completada y `surface-raised` después.

### Íconos de racha y monedas
Llama (racha) y moneda (círculo `gold` con borde y marca #B8901C) en `gold`, con el número al lado en Nunito 800 `gold` (`StatIcon`, nombres `streak` y `coin`).

### Piezas
- **5 sets vectoriales** en `src/pieces/pieceSets.ts`: Clásico (el que viene por defecto), Minimalista, Gótico, Redondeado y Contorneado. Cada pieza tiene dos trazados con `fillRule="evenodd"`:
  - una silueta rellena de `#FFFFFF`;
  - una "tinta" rellena de `#111111`, con los contornos y las piezas negras.

  Los detalles blancos de las piezas negras son huecos de la tinta.
- **Tamaño:** el tablero dibuja cada pieza del tamaño completo de la casilla. Algunos sets llegan al borde: pendiente revisar en el celular si conviene achicarlas un poco.
- **Pantalla Piezas:** una tarjeta por set, con el estilo de las tarjetas (sección 5), nombre (18px, 800), descripción en cuerpo y una vista previa de 6 piezas de 46px sobre casillas del tablero. El set en uso tiene borde `primary` y "✓ En uso" en `primary`.

### Chip de estado
Píldora con fondo `surface-raised`, texto Nunito 700 12px en `text-muted`, padding 3px 10px. Se usa para el color de la apertura ("Juegas con blancas") y el estilo de bot ("Bot tranquilo").

### Selector de dos opciones (Blancas / Negras)
Dos botones del mismo ancho, radio 16, borde 2px. Sin elegir: fondo `surface`, borde `surface-raised` y texto `text-muted`. Elegido: fondo `surface-raised`, borde `primary` y texto `text` (sección 4, estado "Seleccionado").

### Paso `line` (lección de apertura)
- Debajo del tablero: el enunciado y el turno en 12px `text-muted` ("El rival jugó d5 · Tu turno · juegas con negras").
- Modo guiado: una tarjeta con la jugada que toca y su explicación. Antes de jugarla: borde `primary`, título "Tu jugada: Af4" con la jugada en `primary`. Después: borde normal y "Jugaste Af4". El origen y el destino se marcan en el tablero con el resaltado dorado de las explicaciones.
- Más abajo, las jugadas hechas en estilo "Notación de jugadas" (14px, 600).
- En modo guiado, tras un error, una flecha en el tablero marca la jugada correcta.
- En todos los pasos, al equivocarse aparece el panel rojo "Incorrecto" con la pista y el botón primario "Reintentar". No se va solo: mientras está a la vista, el paso no acepta jugadas ni respuestas. "Reintentar" deshace lo equivocado (la jugada en el tablero) y deja seguir desde la misma posición.

### Círculos 3D
En formas redondas, el efecto 3D **no** se hace con `borderBottomWidth`: Android lo dibuja como una media luna que se afina hacia los costados y se ve rara. Se usa `Circle3D`: dos círculos iguales, el de abajo (canto, color `*-shadow`) corrido 3 o 4 px hacia abajo. Al presionar, la cara baja hasta la mitad del canto. Lo usan los nodos de la ruta, los avatares de bots y los números de las lecciones de apertura. Las tarjetas y los botones (radio 16, lados rectos) siguen con `borderBottomWidth`.

### Avatar de bot
Círculo con canto 3D de 3px (`Circle3D`), con el color de su estilo:
- `tranquilo`: `primary`.
- `equilibrado`: `gold`.
- `posicional`: el azul `#4FA3E0`.
- `agresivo`: `danger`.

Adentro va el personaje del bot (`assets/bots/<id>.webp`, registrado en `AVATARS` de `BotAvatar.tsx`): imagen cuadrada con fondo transparente, cabeza y hombros, hecha con ChatGPT. Si ya viene recortada en círculo, lo llena entero (`scale: 1`); si no, se achica y se apoya abajo para que nada se corte (Ada, `scale: 0.89`). Los 10 bots tienen personaje; si se agrega uno nuevo sin imagen, muestra su inicial (Nunito 800, blanco).

### Profesor en la lección (globo)
- Debajo del tablero, una fila: la cara del bot (`BotAvatar` de 52 px, con la expresión del paso) a la izquierda y, a la derecha, un globo `surface-raised` con radio 16 y padding `md` arriba y abajo y 14 a los costados. Separación de `md` entre cara y globo; alineados arriba.
- Texto del globo: Nunito 700 18px en `text`, interlineado 26. Sin alto fijo: con letra grande el globo crece y baja con la página.
- Bienvenida (solo en el primer paso de una lección empezada de cero): arriba del globo, el nombre del bot en Nunito 800 14px `primary` y la frase en Nunito 700 14px `text-muted`, interlineado 20.
- En el resultado de la lección, la misma fila con la cara de acierto y la frase de cierre, con `xl` de separación arriba.

### Partida contra un bot
- Arriba, el bot: avatar de 40px, nombre, nivel y estado en 12px `text-muted`. Debajo, un globo `surface-raised` con su frase.
- Debajo del tablero: "Tú", tu color, "Apertura: …" en `gold` y la lista de jugadas en español.
- Acciones: "Ofrecer tablas" (secundario) y "Rendirse" (destructivo).
- Resultado: panel inferior con el fondo del estado (verde `correctBg` si ganas, rojo `incorrectBg` si pierdes, `surface` si son tablas), título en el color del estado, motivo, y los botones "Revancha" (primario) y "Elegir otro bot" (secundario).

### Puzzles
- **Puzzle del día:** tarjeta con borde `gold` (borde inferior `#B8901C`), "PUZZLE DEL DÍA" en `gold` 12px y 800, el objetivo en 20px y 800, y el nivel en cuerpo.
- **Selector de tema:** chips de píldora con borde 2px. Sin elegir: `surface` con texto `text-muted`. Elegido: `surface-raised` con borde `primary` y texto `text`.
- **Dificultad:** el mismo selector de opciones que Blancas/Negras, con el rango de rating debajo en 11px.
- **Pantalla del puzzle:** chip con el modo, tablero, enunciado (16px, 800) y estado en 12px `text-muted`. Debajo, "Pista" (secundario) y "Ver solución" (destructivo).
- **Error en un puzzle:** la jugada equivocada se ve en el tablero. En el lugar de los botones aparece una tarjeta de estado Incorrecto (fondo `incorrectBg`, borde `danger`, borde inferior `danger-shadow`), con el título "Incorrecto" (18px, 800, `danger`), una frase y el botón primario "Reintentar". No desaparece sola: espera a que se toque "Reintentar".
- **Entre puzzles:** fundido de entrada de 0,2 s, sin cambiar de pantalla.
- **Al terminar:** panel verde "Resuelto" o neutro "Solución", y chips con los temas.
- **Crédito:** "Puzzle #id de Lichess · ver en lichess.org", en 12px `text-muted` subrayado.

### Temas del tablero
`boardThemes` en `src/theme.ts`. Se eligen en Ajustes, y las vistas previas de la pantalla Piezas usan el elegido:

| Tema | Casilla clara | Casilla oscura |
|---|---|---|
| Verde (el original) | `#EBECD0` | `#779556` |
| Madera | `#F0D9B5` | `#B58863` |
| Azul | `#DEE3E6` | `#8CA2AD` |
| Gris | `#E3E3E3` | `#969696` |
| Morado | `#EAE3F2` | `#9C83B8` |

Las coordenadas usan el color de la casilla contraria.

### Animación de las jugadas
- La pieza que se mueve se desliza en 260 ms (curva "ease out").
- La pieza capturada se achica (hasta 0,4) y se desvanece en el mismo tiempo, debajo de la que llega.
- El enroque mueve rey y torre a la vez.
- No se anima un cambio de posición que no sea una jugada (más de 2 piezas o casillas cambiadas).

### Sonidos y vibración
- **Sonidos sintetizados** (`scripts/build-sounds.js`):
  - Mover: golpe de madera corto.
  - Capturar: golpe más grave.
  - Correcto: dos notas que suben.
  - Incorrecto: tono grave que baja.

  Suenan en todas las jugadas del tablero y al acertar o fallar en lecciones y puzzles, así como al ganar o perder una partida.
- **Vibración:** "Confirmar" al acertar y "Rechazar" al fallar (respuesta háptica de Android). Nunca en cada jugada.

### Ajustes
- **Filas** (`SettingRow`): tarjeta con etiqueta en 16px 700, una descripción opcional en 12px `text-muted`, y a la derecha un interruptor (verde `primary` encendido, `outline` apagado) o el valor y "›".
- **Selector de opciones** (`Segmented`): el mismo de Blancas/Negras, con un subtítulo opcional en 11px.
- **Tema del tablero:** muestras de 2×2 casillas.

### Bienvenida
- Tres puntos de avance (barras de 28×8, `primary` las hechas) y "Saltar" arriba.
- Título de pantalla y cuerpo en `text-muted`.
- Las opciones son tarjetas tocables con título (16px, 800) y descripción.

### Pantalla "Próximamente"
Para las pestañas sin contenido: título de pantalla y una tarjeta con "Próximamente · hito N" en `gold` (12px, 800) y la descripción en cuerpo.

## 6. Pantallas principales (a diseñar con este sistema)

1. Aperturas: lista de aperturas y lecciones por apertura.
2. Lección: tablero + explicación + botón Continuar.
3. Drills: repetición de líneas aprendidas con estados correcto/incorrecto.
4. Puzzles: tablero + pista + resultado.
5. Bots: selección de personalidad y partida.

## 7. Voz y textos

- Español, sentence case, tuteo ("Aprende", "Practica").
- Botones de 1 a 3 palabras, verbo primero: "Continuar", "Practicar", "Reintentar".
- Errores: qué pasó y qué hacer, en una frase. Sin "por favor" ni signos de exclamación en mensajes del sistema.
- Textos largos (alemán y francés): las etiquetas de pestañas y de `Segmented` se achican para entrar en una línea (ajuste de fuente), nunca se cortan. En francés las monedas se llaman *jetons*.
- Los bots pueden tener tono propio, pero siempre dentro de la paleta y tipografía de la app.

## Icono de la app

- Dibujo: cabeza de caballo verde (#81B64C, sombras #45753C) que sube una escalera de tres escalones, con una flecha dorada (#F7C631) que sale del último. Une las dos ideas de la app: ajedrez y avanzar paso a paso (*gradus*). Hecho con ChatGPT (mencionado en Créditos).
- Original: `assets/fuente/icono-figura.png` (1254 px, fondo transparente).
- Archivos que salen de él (se escalan con Chrome sin ventana, centrados según la caja de la figura):
  - `icon.png`: 1024 px, fondo #262421, figura con radio del 41 % del ancho.
  - `android-icon-foreground.png`: 1024 px, transparente, figura con radio del 29 % (el círculo seguro de Android mide 30,5 %; lo que queda afuera puede recortarse).
  - `android-icon-monochrome.png`: igual, en blanco y con el ojo hueco (iconos temáticos de Android 13 en adelante).
  - `android-icon-background.png`: liso #262421 (y `backgroundColor` en app.json).
  - `splash-icon.png`: transparente, figura casi a tamaño completo. Pantalla de carga con el plugin `expo-splash-screen` (app.json): fondo #262421 y la figura a 160 dp de ancho. La app la mantiene visible hasta cargar fuentes, progreso y ajustes (`src/app/_layout.tsx`, con un tope de 8 s).
  - `favicon.png` (48 px) y `assets/tienda/icono-512.png` (ficha de Google Play).
- En Expo Go se ve el icono de Expo Go: el propio aparece al instalar la versión de prueba.

## 8. Pendiente por definir

- Piezas: ~~elegir el set~~ resuelto. Hay 5 sets a elegir (ver "Piezas" en la sección 5), dibujados al 89 % de la casilla y con su origen (ChatGPT) en Créditos.
- Iconografía: por ahora, íconos SVG propios (`TabIcon.tsx`, `StatIcon.tsx`), dibujados con trazo de 2px y puntas redondeadas. Se puede pasar a una librería más adelante.
- Avatares y colores de acento por personalidad de bot.
- Sonidos y animaciones de feedback.
- Modo claro (por ahora solo oscuro).
