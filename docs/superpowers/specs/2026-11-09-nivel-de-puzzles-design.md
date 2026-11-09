# Nivel de puzzles: práctica automática según tu nivel

Fecha: 9-11-2026. Estado: **borrador, espera aprobación**.

## 1. Para qué

Hoy, en Puzzles › Práctica, cada uno elige la dificultad a mano (Fácil, Medio, Difícil, Experto). El usuario quiere algo más práctico: que la app sepa tu nivel de puzzles y te dé puzzles a tu medida sin tener que elegir nada, como el rating de puzzles de Lichess o chess.com, pero sencillo.

Decidido por el usuario en la conversación del 9-11-2026:

- La sección **Dificultad** de Práctica tiene dos botones: **Automático** (por defecto) y **Elegir dificultad**. Con «Elegir dificultad» aparecen debajo los cuatro botones de hoy, que funcionan igual que ahora.
- Con «Automático», debajo de los dos botones hay un recuadro que dice solo **«Tu nivel de puzzles: 1340»** (sin otro texto).
- El número se puede **mostrar u ocultar** con un ajuste, porque a algunas personas les frustra pensar en su nivel. Oculto, el nivel se sigue calculando y los puzzles se siguen ajustando por detrás.
- **Todos los puzzles mueven el nivel**: los de Automático, los de «Elegir dificultad» (así quien siente que todo es fácil sube más rápido con puzzles más difíciles) y el puzzle del día.
- **Solo suma si se resuelve sin errores ni pista.** Cualquier jugada equivocada, la pista o «Ver solución» cuentan como fallo, aunque después se resuelva (como en Lichess).
- La app recuerda la opción elegida (Automático o Elegir dificultad).
- El nivel inicial sale del nivel elegido en la bienvenida.
- Al terminar cada puzzle se ve el nivel y cuánto cambió, por ejemplo «Nivel 1340 (+8)», solo si el nivel está visible.
- Funciona igual en el celular (los 50.000 de la app) y en la web (la base completa por trozos).

Boceto aprobado: `.superpowers/brainstorm/1358-1794233925/content/dificultad-v2.html` (fuera de git).

## 2. Objetivos, no objetivos y lo que no puede pasar

**Objetivos**
- Que alguien que abre Práctica y toca «Practicar» reciba puzzles cerca de su nivel, sin pensar.
- Que el nivel se acomode rápido al principio (las primeras partidas) y después se mueva de a poco.
- Que quien no quiere ver números no vea su nivel en ningún lado.

**No objetivos (fuera de este trabajo)**
- Glicko u otros sistemas con desviación; historial o gráfico del nivel; tablas de posiciones; un nivel por tema.
- Mostrar el nivel de puzzles en Perfil (se puede sumar después).
- Que los ejercicios de las lecciones o el quiz de puntos de giro de la revisión muevan el nivel: no son puzzles de Lichess con rating.

**Lo que no puede pasar**
- Que el nivel se pueda inflar repitiendo puzzles ya hechos.
- Que con el nivel oculto aparezca el número propio en algún lugar (recuadro, panel de resultado).
- Que la práctica automática se quede sin puzzles (un tema con pocos puzzles cerca del nivel) o deje de funcionar sin conexión en la web.
- Perder el nivel al sincronizar o al cargar una copia de Ajustes › Datos.
- Que cambien las monedas, la racha o lo que ya guarda `progress.puzzles`.

## 3. Cómo se calcula el nivel (decisión del constructor, validada solo en lo general)

Elo sencillo, con el rating de Lichess del puzzle como «rival»:

- Esperado: `E = 1 / (1 + 10^((ratingPuzzle − nivel) / 400))`.
- Resultado: 1 si se resolvió sin errores ni pista (`clean`); 0 en cualquier otro caso (`solved` con errores o pista, `failed` por «Ver solución»).
- Cambio: `round(K × (resultado − E))`. **K = 40 en los primeros 20 puzzles con nivel y 20 después**, para que se acomode rápido al principio.
- El nivel se mantiene entre 400 y 3000.
- **Solo la primera vez** que se juega cada puzzle (si ya está en `progress.puzzles` o ya se calificó, no cambia el nivel). Así no se puede subir repitiendo ni bajar por volver a mirar uno viejo. El puzzle del día que se vuelve a abrir con «Ver de nuevo» tampoco cuenta.
- **El fallo se cobra en el momento** (decidido por el usuario tras la revisión): con la primera jugada equivocada, al pedir la pista o al tocar «Ver solución», el nivel baja ahí mismo, aunque después se salga del puzzle sin terminarlo. Si no, se podría inflar el nivel saliendo cada vez que uno se equivoca. Un puzzle calificado así ya no vuelve a mover el nivel, aunque después se resuelva. El acierto (sin errores ni pista) se cobra al resolverlo.
- Nivel inicial según la bienvenida: `nuevo` 800, `basico` 1100, `casual` 1400; sin nivel elegido, 1000.

Lógica pura en un módulo nuevo (por ejemplo `src/progress/puzzleRating.ts`), con pruebas.

## 4. Cómo elige la práctica automática (decisión del constructor)

Para cada puzzle: un objetivo `nivel + azar entre −100 y +100` (variedad, y que a veces toque uno un poco más difícil). Se busca un puzzle pendiente (no resuelto ni visto en la sesión, como hoy) del tema elegido con rating cerca del objetivo: primero ±100, después ±200, después ±400 y, si no hay, cualquiera del nivel de dificultad que contiene el objetivo (y, como hoy, uno repetido si no queda ninguno pendiente).

- **Celular:** filtra la lista de 50.000.
- **Web:** pide el trozo del nivel de dificultad que contiene el objetivo (Fácil, Medio, Difícil o Experto, con los mismos límites de hoy) y busca dentro del trozo con la misma ventana. Un trozo de 1.000 de Medio tiene unos 300 puzzles dentro de ±100, así que en general alcanza con uno; si no, aplica los mismos reintentos y la misma búsqueda sin conexión que hoy. El trozo queda en memoria y se reutiliza mientras el nivel no se aleje.
- El nivel que usa «Siguiente puzzle» es el ya actualizado por el puzzle que se acaba de terminar.
- Lógica pura en `chunks.ts` / `puzzles.ts` (con pruebas): la ventana y el orden de búsqueda.

## 5. Pantallas

**Puzzles › Práctica** (`PuzzlesScreen`)
- Sección «Dificultad»: dos botones del mismo estilo que los de nivel de hoy, «Automático» y «Elegir dificultad». Por defecto, Automático.
- Automático + nivel visible: recuadro con «Tu nivel de puzzles: {n}». Automático + nivel oculto: nada debajo de los dos botones.
- Elegir dificultad: los cuatro botones de hoy (en la web, Experto; en el celular, sin Experto como ahora) y, como hoy, «N puzzles con esta elección» debajo de Practicar. En Automático, ese texto de cantidad no aparece (decisión del constructor: la cantidad depende del nivel y confunde).
- Se guarda la opción elegida. El nivel elegido a mano también se recuerda (decisión del constructor); la primera vez, el que contiene tu nivel de puzzles.

**El puzzle** (`app/puzzle.tsx`, `PuzzleScreen`)
- La ruta de práctica acepta `nivel=auto` (o sin nivel): Automático.
- El chip de arriba dice «Práctica · Automático · Horquilla» (o «Práctica · Medio · Horquilla» como hoy).
- Al terminar (resuelto o con «Ver solución»), si el nivel está visible y el puzzle movió el nivel, el panel del resultado suma «Nivel 1340 (+8)» o «Nivel 1322 (−18)». Si no lo movió (ya jugado antes), no se muestra nada nuevo.

**Ajustes**
- Fila nueva con interruptor: «Mostrar mi nivel de puzzles» (encendido por defecto, decisión del constructor). Va en la sección donde están los ajustes de juego.
- Ocultar el nivel solo oculta el número propio. El rating de cada puzzle («Nivel 1047» en el puzzle del día y al terminar) se sigue viendo (decisión del constructor; ver sección 9).

**Textos**: todos nuevos en los cinco idiomas, de/it/fr con gemma4 vía Ollama revisando términos y puntuación (memoria del proyecto). Sin exclamaciones (design.md).

### Diseño visual (antislop, modo «durante»)

Dirección: `docs/design.md`. Nada de esto inventa estilo nuevo: la pantalla ya existe y se extiende con sus mismos componentes.

> Lectura: ampliación de una pantalla existente (Puzzles › Práctica) para quien aprende ajedrez, en el lenguaje de Gradus (oscuro verde, botones 3D, Nunito). Diales: ENERGÍA 2 / RITMO 1 / MOVIMIENTO 1.

- **Diales:** ENERGÍA 2 porque la app ya tiene el tono de Duolingo y esto no debe destacar más que el puzzle del día; RITMO 1 porque es una sección más de una lista de ajustes y tiene que parecerse a las otras; MOVIMIENTO 1 porque no se suma ninguna animación nueva (solo los estados de presionado de siempre).
- **Botones «Automático» / «Elegir dificultad»:** el selector de dos opciones de design.md (§5, el de Blancas/Negras y Dificultad). Motivo: es exactamente una elección entre dos modos, y así se lee igual que el selector de nivel de abajo. En alemán y francés el texto se achica para entrar en una línea, nunca se corta (design.md §7).
- **Recuadro del nivel:** tarjeta `surface` con borde 2px `surface-raised` y borde inferior 4px `surface-shadow` (la tarjeta de design.md), sin sombras difusas. «Tu nivel de puzzles:» en cuerpo (14px, 700, `text-muted`) y el número en 20px, 800, color `gold`. Motivo del dorado: design.md lo reserva para «rachas, puntos, logros», y el nivel es un logro; es el único acento de la sección (el verde ya marca la opción elegida). Contraste: dorado `#F7C631` sobre `#302E2B` supera 4,5:1.
- **Cambio de nivel al terminar:** una línea más en el panel del resultado, «Nivel 1340 (+8)» o «Nivel 1322 (−18)», con el mismo color de texto que el resto del panel (blanco sobre el verde de «Resuelto»: 7,8:1). El signo dice si subió o bajó; no se usa color. Motivo: el verde `primary` sobre el panel verde da 3,2:1 y `text-muted` 4,4:1, los dos por debajo de 4,5:1; y el rojo para una bajada repetiría el castigo que el usuario quiere evitar para quien se frustra con su nivel. Se usa el signo menos (−), no un guion largo.
- **Accesibilidad:** los dos botones son `radio` con estado elegido (como el selector de nivel de hoy); el recuadro se lee como un solo texto («Tu nivel de puzzles: 1340»); la fila de Ajustes es la `SettingRow` con interruptor de siempre, con nombre accesible. Toques de 44px como mínimo. En la web, foco visible y uso con teclado como el resto de los botones de la pantalla.
- **Estados:** el nivel sale del progreso guardado, que ya está cargado cuando se dibuja la pestaña (no hay estado de carga propio). Sin puzzles con nivel todavía: se muestra el nivel inicial, sin texto extra. Los estados de carga y error de los puzzles (`PuzzlesStatus`) no cambian.
- **Sin recursos nuevos:** no se crean íconos, imágenes ni ilustraciones.
- **Celular:** a 375px los dos botones entran en una fila (ya entran los cuatro niveles); el recuadro ocupa el ancho de la columna.
- **Antes de entregar:** compuerta de entrega de antislop con la prueba en el navegador (web compilada, 375px y escritorio) y el recorrido de cada control: Automático, Elegir dificultad, cada nivel, el interruptor de Ajustes, Practicar y Siguiente puzzle.

## 6. Dónde se guarda

- **Nivel** en el progreso (`progress.puzzleRating = { rating, rated, at }`: valor, cuántos puzzles lo movieron y fecha del último cambio). Es un campo opcional: si no está, se usa el nivel inicial de la bienvenida. No hace falta subir la versión del progreso (sigue siendo la 4) si el campo es opcional y `migrate`/`merge` lo aceptan.
- **Puzzles calificados sin terminar**: `progress.puzzleRating.pending` guarda los ids que ya movieron el nivel (por un fallo cobrado en el momento) pero todavía no están en `progress.puzzles`, porque se salió sin terminar. Cuando ese puzzle se termina, sale de la lista. Así la lista queda chica (solo los abandonados) y `progress.puzzles` no cambia de forma. Decisión del constructor: tope de 500 ids, se descartan los más viejos.
- Una función nueva del progreso cobra el fallo en el momento (`PuzzleScreen` la llama en la primera jugada mala, la pista o «Ver solución»). `withPuzzleFinished` recibe además el rating del puzzle, cobra el acierto si corresponde y devuelve el cambio de nivel del puzzle (el de ahora o el ya cobrado en el fallo), o null, para el panel del resultado. Monedas y racha no cambian.
- **Mezcla** (`merge.ts`, sincronización y copias): para el valor, gana la copia con más puzzles con nivel (`rated`); si empatan, la más reciente (`at`). `pending` se une. Borrar el progreso (`resetProgress`) borra el nivel.
- **Ajustes** (`@ajedrez/settings`, `sanitize.ts`): `showPuzzleRating: boolean` (true), `puzzleMode: 'auto' | 'manual'` ('auto') y `puzzleLevel` (el nivel manual recordado, opcional). Con pruebas en `sanitize`/`serialize`.

## 7. Pruebas

- Cálculo: esperado, K 40/20, límites 400–3000, solo la primera vez, nivel inicial por bienvenida.
- Fallo cobrado en el momento: baja el nivel una sola vez, queda en `pending`, salir sin terminar no lo devuelve, resolverlo después no suma y lo saca de `pending`.
- `withPuzzleFinished`: cambia el nivel solo en la primera vez y devuelve el cambio; monedas y racha iguales que antes.
- Mezcla: gana el de más `rated`; empate por fecha; un lado sin nivel.
- Elección automática: ventana que se agranda, pendientes antes que repetidos, tema respetado, nivel de dificultad del objetivo en la web, sin conexión con trozos guardados.
- Ajustes: valores por defecto y saneado de valores inválidos.
- `noHardcoded.test.ts` sigue pasando (sin texto español fijo).
- Comprobación en el navegador (web compilada con los trozos locales) y prueba en el Redmi con Expo Go.

## 8. Lo que queda para el constructor

Nombres de módulos y claves, el estilo exacto del recuadro (el del boceto: mismo fondo y borde que los botones de nivel), dónde va exactamente la fila en Ajustes y cómo se reparte el código entre `puzzles.ts`, `chunks.ts` y el módulo nuevo.

## 9. Decisiones del constructor para revisar

- Números del Elo: K 40 los primeros 20 y 20 después; límites 400–3000; niveles iniciales 800 / 1100 / 1400 (1000 sin bienvenida).
- Solo la primera vez que se juega cada puzzle mueve el nivel.
- Lista `pending` con tope de 500 para los puzzles calificados y abandonados.
- Ventana de elección: objetivo ±100 al azar, y búsqueda en ±100, ±200, ±400.
- El interruptor del nivel arranca encendido.
- Ocultar el nivel no oculta el rating de cada puzzle.
- En Automático no se muestra «N puzzles con esta elección».
- El nivel manual elegido se recuerda.
