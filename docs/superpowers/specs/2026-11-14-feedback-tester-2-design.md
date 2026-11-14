# Feedback del tester, segunda tanda: fondo, primeros pasos, volver atrás y «el motor»

Fecha: 14-11-2026 · Diseño: opus · Fuente: vault, `gradus feedback.md` (líneas nuevas) y un comentario al autor sobre el fondo.

| # | Lo que dijo | Respuesta |
|---|---|---|
| 1 | «El fondo se ve muy plano y muy gris» | Fondo con luz cálida en toda la app (variante A, elegida por el autor) |
| 2 | «La primera impresión fue: no sé cómo se usa» (se perdió **al entrar a la app**, según el autor) | Inicio de primeros pasos para la cuenta nueva y un consejo que explica las pestañas |
| 3 | «Capacidad de volver al paso anterior en lecciones y aperturas» | Botón para volver al paso anterior en la lección y jugada anterior en las líneas |
| 4 | «En la herramienta de análisis, una explicación dice “el motor ve que…”; evitemos esas expresiones» | El comentarista habla como persona; se reescriben las tres plantillas |

## 1. Fondo con luz cálida

**Referencia:** `prototipo-fondo.html` (raíz del repo, fuera de git), variante «A · Luz cálida». Es la misma idea que la portada: la app y la portada se sienten parte de la misma escena.

- **Capas** (de arriba hacia abajo), fijas a la ventana:
  1. Luz: elipse radial de `70vmax × 55vmax` centrada en `30% 20%`, color `rgb(255 196 128)` al 13 % en el centro, 4 % al 55 % y nada al 80 %.
  2. Viñeta: los bordes se oscurecen hasta 45 % de negro (elipse de 130 % × 110 % centrada en `40% 30%`, transparente hasta el 50 %).
  3. Base: degradé vertical de `#2A2724` arriba a `#1D1B19` abajo.
- **Tarjetas:** fondo `linear-gradient(180deg, rgba(60,58,55,.78), rgba(48,46,43,.78))`, borde de 2 px `rgba(255,255,255,.07)`, un filete de luz arriba (`inset 0 1px 0 rgba(255,255,255,.05)`) y sombra `0 10px 24px rgba(0,0,0,.28)`. Se separan del fondo sin cambiar el color de la app.
- **Barra lateral** (pantalla ancha): `rgba(20,19,17,.45)` con borde `rgba(255,255,255,.06)`; deja ver la luz.
- **Implementación:** un componente `AppBackground` con `react-native-svg` (`RadialGradient` para la luz y la viñeta, `LinearGradient` para la base) a pantalla completa detrás de las pestañas y las pantallas, que pasan a fondo transparente. Funciona igual en la web y en el celular, sin dependencias nuevas. En pantallas con tablero (lección, puzzle, partida), la luz queda detrás del tablero, como en la portada.
- `theme.ts`: tokens nuevos `bgTop #2A2724`, `bgBottom #1D1B19`, `lamp 'rgba(255,196,128,0.13)'`, `cardTop`, `cardBottom`, `cardBorder`. `colors.bg` (#262421) queda para los textos oscuros sobre verde (auditoría, hallazgo 02) y para la barra del sistema.
- Contraste: el texto secundario `#C3C2C1` sobre la zona más clara de la luz (≈ `#3A342D`) da 8,5:1 o más; revisar con la sonda al implementar.

## 2. Primeros pasos para la cuenta nueva

El autor ubicó la confusión **al entrar a la app**: no queda claro qué hacer primero ni para qué es cada sección. Inicio ya existe, pero con una cuenta nueva muestra seis tarjetas del mismo peso y 11 controles en la primera pantalla.

- **Inicio de la cuenta nueva** (hasta que se completen los tres primeros pasos):
  - Saludo de Pipo: «Hola, soy Pipo. Te muestro cómo empezar.»
  - Tarjeta grande **«Tus primeros pasos»** con tres pasos en fila, cada uno con su ícono, su estado (hecho, siguiente, después) y un solo botón verde en el siguiente:
    1. **Tu primera lección** · «Aprende a mover las piezas.» → abre `u1-l01`.
    2. **Tu primer puzzle** · «Encuentra la mejor jugada en una posición fácil.» → un puzzle de nivel Fácil (no el del día, que puede ser de 1400).
    3. **Tu primera partida** · «Juega contra Pipo, que también está aprendiendo.» → partida con Pipo.
  - Debajo, en tamaño chico y sin botones verdes: racha y «Más para explorar» (Aperturas, Bots, Análisis), cada uno con una línea de qué es.
  - Al completar los tres, la tarjeta festeja una vez («Ya sabes usar Gradus») y desaparece; Inicio pasa al de siempre.
- **Consejo de las pestañas** (uno solo, la primera visita a Inicio, antes de los dos de hoy): ilumina la barra lateral (o las pestañas de abajo en el celular) y explica en una línea cada sección: «Aprender: la ruta de lecciones · Aperturas: cursos para empezar bien la partida · Puzzles: ejercicios cortos · Bots: partidas contra personajes · Análisis: revisa tus partidas · Perfil: tu progreso y la tienda».
- **Textos en tú**, como el resto de la app.
- Lógica pura y probada: los tres pasos se leen del progreso (`progress.lessons`, puzzles resueltos, partidas jugadas); no hace falta guardar nada nuevo salvo «festejo de primeros pasos visto» en los ajustes, junto a `seenTips`.

## 3. Volver al paso anterior

**Lección:**
- Botón **←** (44 × 44 px, círculo 3D `surfaceRaised`, etiqueta «Paso anterior») a la izquierda de la barra de progreso, al lado de la ×. Desactivado en el primer paso.
- Lleva al paso anterior **ya resuelto**: el tablero y el texto como quedaron al terminarlo, sin pedir la jugada otra vez, sin cobrar errores y sin dar monedas. El botón de abajo dice «Seguir» y vuelve al paso donde estaba el usuario. Se puede retroceder varios pasos.
- En el repaso de errores, igual.

**Aperturas (pasos `line`):**
- Debajo del tablero, dos flechas chicas **‹ ›** («Jugada anterior», «Jugada siguiente») para mirar las jugadas ya hechas de la línea, como un visor. Mientras se mira una jugada anterior, el tablero no acepta jugadas y aparece «Volver a la jugada actual».
- El botón ← de la barra superior funciona igual que en las lecciones (paso anterior completo).

## 4. Sin «el motor» en el comentarista

El comentarista es un personaje (el bot elegido); no habla de una máquina. Plantillas de `src/review/coach/es.json` (líneas 547, 551 y 555) y sus equivalentes en en, de, it y fr:

| Antes | Después |
|---|---|
| «El motor ve {seq}: ganas {n} puntos de material.» | «Mira cómo sigue: {seq}. Ganas {n} puntos de material.» |
| «El motor ve {seq}: pierdes {n} puntos de material.» | «Mira cómo sigue: {seq}. Pierdes {n} puntos de material.» |
| «El motor veía {seq}: ganabas {n} puntos de material.» | «Había una continuación mejor: {seq}. Ganabas {n} puntos de material.» |

- Regla para textos nuevos de comentarista y profesores: nada de «el motor», «Stockfish», «la máquina» ni «la evaluación»; se dice «mira», «había», «la mejor jugada». Los mensajes del sistema (por ejemplo «El motor de ajedrez no responde») y Créditos pueden nombrar al motor.
- de, it y fr con gemma4 vía Ollama, revisando que `{seq}` y `{n}` queden intactos.

## Orden sugerido

4 (textos, minutos) → 1 (fondo, un componente) → 3 (volver atrás) → 2 (primeros pasos).

## Cómo se comprueba

- `npm test` (pruebas nuevas: estado de los primeros pasos; volver atrás en `LessonPlayer` sin cobrar ni pagar), `npx expo lint`, `npx tsc --noEmit`, `noHardcoded`.
- Navegador (`web-compilada`) a 1366 y 375 px: cuenta nueva (primeros pasos, consejo de pestañas), una lección con ← en el paso 3, una línea de apertura con ‹ ›, una revisión de partida con una táctica (sin «el motor»), y el fondo en Inicio, Aprender, lección y Puzzles.
