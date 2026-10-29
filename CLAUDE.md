# App de ajedrez para aprender (estilo Duolingo / Chessly)

## Contexto
- Usuario: hispanohablante (Argentina), primera vez que desarrolla una app. PC con Windows 11 (PowerShell), prueba en un Redmi Note 13 con Expo Go.
- Explicar los pasos con claridad y en español. Pedir confirmación antes de cambios grandes.
- Objetivo: app gratuita para Android con lecciones de aperturas, ejercicios, puzzles y bots con personalidad que juegan las aperturas enseñadas.
- Por ahora la app es 100% gratis: si el usuario falla, se muestra una pista y puede reintentar al instante. Sin vidas. Dentro de cada unidad, las lecciones se desbloquean de a una; las unidades están todas abiertas para que cada uno elija su nivel (`LOCK_LESSONS` en `src/progress/path.ts`). Monetización: decidir más adelante.

## Tecnología
- Expo (blank-typescript) + React Native + TypeScript, solo Android.
- chess.js v1.x (reglas), react-native-svg (piezas y flechas), @expo-google-fonts/nunito, expo-navigation-bar (oculta la barra del sistema).
- Navegación: Expo Router (no React Navigation directo). Pantallas en `src/app/`, pestañas en `src/app/(tabs)/`. Ya no existen App.tsx ni index.ts: el punto de entrada es `expo-router/entry`.
- 6 pestañas: Aprender, Aperturas, Puzzles, Bots, Análisis (tablero libre con Stockfish en vivo: barra de evaluación y 3 mejores variantes, `UciEngine.analyze`) y Perfil. Las que no tienen contenido muestran `ComingSoonScreen`.
- Progreso: AsyncStorage en `src/progress/` (`useProgress()`). Guarda lecciones, avance a medias, racha, XP total y del día, minutos de práctica y pasos fallados. Modelo en `mapa-de-pantallas.md`, sección 4.
- Motor: Stockfish.js 19 lite (WebAssembly, GPL v3) en un WebView invisible; la app le habla solo por texto UCI (`src/engine/`). Archivos de Stockfish sin modificar, generados con `npm run build:engine`. Ver docs/motor.md.
- Puzzles: `src/puzzles/puzzles.json` (10.000 de Lichess, CC0) generado con `npm run build:puzzles -- C:\dev\datos-lichess\lichess_db_puzzle.csv.zst` (archivo de 293 MB bajado de database.lichess.org; guardado ahí, fuera del proyecto). Ver docs/puzzles.md.
- Ajustes: `src/settings/SettingsContext.tsx` (`useSettings()`, clave `@ajedrez/settings`, aparte del progreso). Sonido y vibración: `useFeedback()` en `src/feedback/` (expo-audio, expo-haptics). Recordatorio: `src/settings/reminders.ts` (expo-notifications, notificación local). Sonidos propios generados con `npm run build:sounds`.
- `react-dom` está instalado a propósito (versión del SDK): sin él, npm trae una versión incompatible y fallan las instalaciones.
- Proyecto en `C:\dev\ajedrez-app`. Se inicia con `npx expo start -c`.
- Git: repositorio desde el 29-10-2026, rama `main`, subido a GitHub (privado hasta publicar; con la GPL tiene que pasar a público): https://github.com/GradusStudio/ajedrez-app (remoto `origin`; la sesión de GitHub la guarda el administrador de credenciales de Git). No hay `gh` instalado. Git no está en el PATH de PowerShell: usarlo desde Git Bash. `.gitattributes` fija finales de línea LF. Guardar un commit después de cada cambio terminado y comprobado.

## Documentos (en /docs)
- `design.md`: colores, tipografía, botones 3D, textos (español, sin exclamaciones en mensajes del sistema).
- `formato-lecciones.md`: tipos de paso (explain, move, select_squares, quiz, line, practice) y listado de contenido.
- `mapa-de-pantallas.md`: pantallas y plan de hitos.
- `bots.md` / `bots.json`: 10 bots con personalidad y aperturas que juegan.
- `contenido-lecciones-aperturas.md`: temario de unidades.
- `aperturas-v3.json`: 28 cursos de apertura (4 lecciones cada uno). La app usa la copia de `src/data/`: si se corrige una línea, cambiarla en los dos lugares. Líneas validadas como legales y revisadas con Stockfish a profundidad 20.
- Unidad 1 (`src/data/unidad-1-lo-basico.json`, única copia): 12 lecciones, 77 pasos. «El peón» incluye coronación y subpromoción.
- Unidad 2 (`src/data/unidad-2-reglas-especiales.json`): 6 lecciones, 46 pasos (enroque, al paso, coronar bien, ahogado, otras tablas, notación). Validada con chess.js y posiciones clave con Stockfish (detalle en formato-lecciones.md). 
- Unidad 3 (`src/data/unidad-3-tactica-basica.json`): 8 lecciones, 75 pasos de táctica. Usa pasos `line` para combinaciones (con `success` y `hint`) y puzzles reales de Lichess al final de cada lección. Ejercicios revisados con Stockfish probando todas las jugadas legales (detalle en formato-lecciones.md).
- Unidad 4 (`src/data/unidad-4-apertura-y-estrategia.json`): 6 lecciones, 47 pasos de estrategia (principios y errores de apertura, estructura de peones, columnas abiertas, casillas débiles, pareja de alfiles). Los ejercicios aceptan todas las jugadas que cumplen la idea y están a menos de medio peón de la mejor.
- Unidad 5 (`src/data/unidad-5-finales.json`): 5 lecciones, 39 pasos de finales (mate con dama, mate con torre, oposición, regla del cuadrado, Lucena). Usa el paso `practice`: el usuario juega libre contra Stockfish y solo es error la jugada que deja escapar el resultado (`src/lesson/steps/PracticeStep.tsx`). Las prácticas se simularon con Stockfish jugando por los dos lados.
- Unidad 6 (`src/data/unidad-6-conceptos-avanzados.json`): 4 lecciones, 40 pasos (zugzwang con triangulación y práctica contra Stockfish, profilaxis, sacrificio de calidad y un repaso final con 8 puzzles de Lichess de toda la ruta). Con ella la ruta de Aprender queda completa (41 lecciones).
- Cada unidad nueva se suma en `src/data/units.ts`. Al crear posiciones propias, revisar siempre con Stockfish: casi todos los errores de la Unidad 3 fueron mates en la última fila que no se veían y posiciones donde cualquier jugada ganaba.
- `motor.md`: Stockfish, cómo está armado y opciones de licencia.
- `puzzles.md`: origen (Lichess, CC0), criterios de selección y funcionamiento de los puzzles.

## Arquitectura clave
- `Board` es "tonto": recibe fen, orientation, lastMove, interactive, onMove, highlight, arrows, showMovesFrom, pickedSquares, onSquarePress. La partida la guarda quien lo usa. Se juega tocando pieza y destino o arrastrando la pieza (una capa transparente encima del tablero recibe los toques). Anima el deslizamiento de piezas al cambiar el fen (salvo la pieza recién soltada). Al coronar muestra un selector (dama, caballo, torre, alfil); `BoardMove.promotion` lleva la pieza elegida y las soluciones de 5 letras (`e7e8n`) la exigen.
- Transiciones: pantallas con `ios_from_right` (bienvenida y resultado con fundido), pestañas con fundido. Textos de lecciones y paneles de acierto/error aparecen con `FadeIn` (`src/components/FadeIn.tsx`). Botón de los avisos de error: `Button3D` variante `danger` (rojo).
- `LessonPlayer` maneja índice, estado (idle/correct/wrong), errores y panel de feedback. Cada paso se renderiza con `key={step.id}` para empezar con estado limpio.
- Los ids de lección y de paso deben ser únicos (un id repetido rompe las listas).
- Diseño de pasos: el tablero va siempre arriba, en la misma posición; el texto, opciones y botones van debajo.
- Piezas: 5 sets vectoriales (clasico, minimalista, gotico, redondeado, contorneado) en `src/pieces/pieceSets.ts`, generados a partir de imágenes hechas con ChatGPT (copyright de obras de IA incierto; mencionar origen en Créditos). `Piece.tsx` usa el set elegido en Perfil > Piezas (`PieceSetContext`, clave AsyncStorage `@ajedrez/pieceSet`). El set anterior quedó en `PieceLegacy.tsx`.

## Hitos
1. Reproductor de lecciones: HECHO.
2. Guardar progreso + 6 pestañas + ruta de Aprender, racha, meta diaria y repaso de errores: HECHO (probado en el celular).
3. Paso `line` (aperturas guiadas y drill, con explicación antes de cada jugada) + pestaña Aperturas con los 28 cursos: HECHO (ver LEEME-hito3.md).
4. Bots con Stockfish (pestaña Bots, ficha, partida, práctica de aperturas): HECHO (probado en el celular; ver LEEME-hito4.md). Niveles de Pipo a Valentina recalibrados midiendo partidas entre bots vecinos (docs/bots.md, "Calibración").
5. Puzzles: 10.000 de la base abierta de Lichess (CC0), puzzle del día y práctica por nivel y tema: HECHO (probado en el celular; ver LEEME-hito5.md y docs/puzzles.md).
6. Perfil, Ajustes, Créditos, bienvenida, sonidos, vibración, recordatorio diario, 5 temas de tablero y animación de jugadas: HECHO (probado en el celular; ver LEEME-hito6.md). Después: arrastrar piezas, transiciones, selector de coronación y análisis en vivo.
7. Prueba cerrada en Google Play (12 testers, 14 días).

## Pendientes y avisos
- Licencia: la app es software libre, GPL v3 o posterior (decidido el 29-10-2026; `LICENSE`, `README.md`, Créditos). Motivo y obligaciones en docs/motor.md. Antes de publicar, el repositorio de GitHub tiene que ser público y corresponder a la versión subida (etiquetar cada versión). No es asesoramiento legal.
- Piezas: la app usa solo los 5 sets de `pieceSets.ts` (hechos con ChatGPT). El set anterior (`PieceLegacy.tsx`, "Sombra lateral") ya no se importa en ningún lado y no viaja en la app. Si algún día se agrega un set de otra persona (por ejemplo, el de un amigo), hace falta su permiso por escrito, los archivos originales y una licencia compatible con la GPL v3.
- Líneas de apertura revisadas con Stockfish (profundidad 20): Danés corregido; Albin se deja como está a propósito (gambito de trampas). Detalle en docs/formato-lecciones.md. Si se agregan aperturas nuevas, revisarlas igual.
- Lint (`npx expo lint`): 0 errores. Los 4 avisos de dependencias de efectos (Board, LineStep, GameScreen, PuzzleScreen) son a propósito y están comentados.
- Revisión final de las piezas en el celular: en algunos sets llegan al borde de la casilla y podrían tapar las coordenadas (Board dibuja la pieza del tamaño de la casilla, `Board.tsx`, línea ~338).
- Cuando algo falle, el usuario pega el mensaje de error: explicar la causa y la corrección en pasos simples.
