# Explicar cómo aprovechar (o qué permite) una jugada, con la línea del motor y en la voz del bot

Fecha: 2026-11-05 · Estado: borrador para aprobar · Etapa 1 de 3 · Continúa `2026-11-05-comentarios-tacticos-design.md`

## Intención y por qué

Con los comentarios tácticos de la rama anterior, el usuario probó una partida y encontró este caso: el rival desarrolló un caballo y esa jugada le permitía a él capturar otro caballo que defendía un peón (concepto «eliminar al defensor»: capturar al caballo con el alfil, esperar la recaptura y ganar el peón de d4). El análisis dijo: «El rival cometió un error grave, aprovéchalo» y, al abrir el comentario, «Con Axf6 puedes capturar un caballo» y «Lo mejor para el rival era c6, que desarrolla el caballo de b8 a c6». No explicó la táctica ni cómo explotarla, y solo describió lo positivo de la jugada equivocada.

Causas verificadas en el código:
- No existe un detector de «eliminar al defensor» (`src/review/tactics.ts` solo tiene horquilla, clavada, enfilada, ataque a la descubierta, jaque doble, pieza colgada y mate del pasillo).
- Solo se mira **una** jugada de la línea del motor (`replyUci`). `evaluatePosition` (`src/review/analyze.ts`) descarta la variante completa que el motor ya calcula (`lines[0].pv`) y se queda con la mejor jugada. Una táctica como esta necesita 3 jugadas: captura, recaptura y captura del peón.
- Cuando la jugada del rival no captura ni da jaque, se muestra su «plan» (`facts.plan`) como un mérito, aunque la jugada sea un error.
- La voz del bot sobre las jugadas del rival (`opp` en `src/review/coach/<idioma>.json`) son 6 frases sin estilo, iguales para los 10 bots, y la explicación (hechos neutros) se muestra aparte, en otro tono.

Inspiración de una app parecida (Chess-Review, T-Julsgaard, GPL v3), de la que se toman ideas sin copiar código: usar la línea completa del motor para hablar de material ganado o perdido, elegir **una sola cosa destacada por jugada** con una escalera de prioridad, y poner un **tope de largo** al texto filtrando variantes. Lo que Gradus agrega es explicar la táctica con el nombre que enseñan las lecciones y cómo explotarla.

Éxito = cuando el rival se equivoca, el usuario lee **cómo aprovechar el error** (con el concepto nombrado y la secuencia concreta); cuando el error es suyo, lee qué táctica permitió; y todo suena como un solo texto dicho por el bot elegido.

## Decisiones tomadas con el usuario

- Etapa 1 primero (esta). Después, por separado: etapa 2 (historia de la partida: punto de giro, cambio de ventaja, damas fuera, salida de teoría, rachas, resumen final, nombre de la apertura) y etapa 3 (pista antes de revelar la mejor jugada y reintentar los errores).
- **Opción A**: la explicación va en la voz del bot, como un solo texto (no dos bloques ni un interruptor).
- Se toman ideas positivas de la otra app y se les da el enfoque propio de Gradus (nombrar el concepto y explicar cómo explotarlo).

## Objetivos

1. Conservar la variante completa del motor (`pv`, en UCI) en cada `PositionEval`, hasta 8 jugadas.
2. Un detector puro nuevo de líneas (`src/review/lines.ts`, con chess.js) que, dada una posición y una variante, reproduce las jugadas legalmente y reconoce, solo si el tablero lo prueba:
   - **Eliminar al defensor**: la primera jugada captura una pieza que defendía a otra (pieza o peón) y, tras la recaptura, la variante gana ese objetivo, con ganancia neta de material para quien juega la línea. Devuelve las piezas y casillas reales.
   - **Material neto** de la línea (puntos ganados o perdidos para quien mueve primero), para frases como «pierdes una pieza en la línea del motor».
3. Usar la variante correcta según el caso, sin búsquedas nuevas:
   - Error del rival (el usuario explota): la variante tras la jugada del rival (`after.pv`).
   - Error propio (qué permite): la misma variante, que es la mejor respuesta del rival.
   - Oportunidad perdida: la variante antes de la jugada (`before.pv`).
4. Un solo texto en la voz del bot: la explicación se compone con un **marco por estilo** (`tranquilo`, `equilibrado`, `posicional`, `agresivo`) alrededor del hecho neutro, en los 5 idiomas. Las frases sobre el rival (`opp`) pasan a tener estilo también.
5. Orden pensado en enseñar, con **una cosa destacada primero**. Cuando el rival se equivoca: primero cómo aprovecharlo (concepto y secuencia), luego qué quiso hacer el rival y por qué falló, al final la mejor jugada del rival. El «plan» de una jugada mala ya no se dice como un mérito: se dice como intención («quería desarrollar el caballo, pero…») o se omite. Para jugadas buenas se mantiene el plan positivo.
6. Tope de largo: cada variante de texto ya rellena debe entrar en el límite; se descartan las que no entran y, si aun así el texto compuesto es largo, se quitan primero las cláusulas de menor prioridad (intención, mejor jugada del rival).

## Fuera de alcance

- Etapas 2 y 3 (ver arriba).
- Cambiar la profundidad del motor (11), las búsquedas, la clasificación de jugadas o la precisión.
- Rediseñar `GameReviewScreen`: el globo sigue mostrando la voz siempre y la explicación al abrir «Mejor»; solo cambia el texto.
- Otras tácticas nuevas (desviación, atracción, despeje...); el diseño de `lines.ts` debe permitir sumarlas.
- Un LLM para generar texto: siguen siendo plantillas.
- Nuevos ajustes o interruptores.

## Antiobjetivos

- Inventar una táctica o una ganancia: todo sale de reproducir la variante con chess.js y de comprobarla. Si la variante es ilegal, está truncada o no prueba la ganancia, no se dice nada (cae a lo que ya existe).
- Decir que una jugada mala «es buena» o describir solo su lado positivo.
- Textos repetidos idénticos jugada tras jugada, o que no entren en el globo.
- Romper los 5 idiomas o las claves de progreso guardadas. Ningún dato nuevo se persiste.
- Frases del bot que se burlen del usuario o suenen hirientes cuando el error es suyo.

## Restricciones

- Lógica en `src/review/` sin React Native; se prueba con `npm test` (tsx + node:test); hoy son 211 pruebas y deben seguir en verde.
- `PositionEval.pv` es **opcional** para no romper las pruebas ni las evaluaciones guardadas en memoria; sin `pv`, el comportamiento actual no cambia.
- Los textos nuevos existen en es, en, de, it y fr con la misma forma y los mismos marcadores (la prueba de marcadores de `coachText.test.ts` lo exige). Nombres de tácticas iguales a los de las lecciones: «Eliminar al defensor» ya existe como `puzzleTheme.capturingDefender` en `src/i18n/<idioma>.ts`.
- Antislop (modo durante): sin raya larga, sin frases de relleno ni palabras de marketing; cada línea nombra piezas y casillas reales.
- Los de, it y fr se traducen con el modelo local (gemma4 vía Ollama) y se revisan a mano los casos gramaticales; siguen sin revisión de nativos.
- Git solo desde Git Bash; un commit por tarea terminada.

## Mis decisiones (a revisar)

- Se sigue en la misma rama (`feat/comentarios-tacticos`), porque es la misma función y el usuario todavía no probó ni fusionó la anterior.
- Largo: el titular de la voz sigue corto (como hoy, unos 40 caracteres de media) y el texto compuesto de la explicación tiene un tope de unos 220 caracteres; si hay que recortar, se quita primero la intención y después la mejor jugada del rival, nunca el concepto ni la secuencia.
- «Eliminar al defensor» solo se afirma si la ganancia neta de la variante es de al menos 1 punto de material y el objetivo estaba defendido por la pieza capturada (comprobado antes de la primera jugada).
- La secuencia se muestra con notación del usuario (`fmt`) y, como mucho, 3 jugadas.
- Los marcos de voz son pocos (por estilo: aprovechar el error del rival, error propio, oportunidad perdida, jugada sin problema) y se combinan con hechos neutros; no se escribe una plantilla por hecho y por estilo.

## Aclaraciones tras la revisión del diseño (mis decisiones, a revisar)

- **Frases de solo material, sí.** La mayoría de los errores no son «eliminar al defensor», así que el material neto de la línea también se dice, como un hecho de segunda prioridad: «en la línea del motor ganas/pierdes N puntos de material». Solo se dice si la línea reproduce legalmente y la ganancia o pérdida es de al menos 2 puntos.
- **Escalera de prioridad** (una cosa destacada primero, como mucho 2 hechos en el texto): mate (`mateIn` y `did.mate`) > eliminar al defensor (es lo más específico, se prueba con varias jugadas) > otras tácticas (`found`, `allowsTactic`) > material de la línea > lo que hizo la jugada (captura, jaque, enroque) > lo permitido o perdido ya existente (`allows`, `missed`) > intención del plan. Las tácticas de la rama anterior no se reemplazan: compiten en esa escalera.
- **Qué jugadas activan «aprovechar» y «qué permite»:** las mismas que hoy tienen `allows`/`missed`, es decir calidad imprecisión, error o error grave, sin umbrales nuevos. «Oportunidad perdida» (`before.pv`) usa esa misma condición.
- **Líneas truncadas:** el material se mide sobre como mucho las 4 primeras jugadas de la variante. Si la última jugada medida es una captura de quien gana y la variante termina ahí (sin respuesta del rival), esa jugada no se cuenta, para no exagerar la ganancia. «Eliminar al defensor» exige que la variante contenga las tres jugadas (captura, recaptura o respuesta y captura del objetivo).
- **Prueba de regresión del caso del usuario:** vale una posición armada a mano con la variante armada a mano, y además al menos una posición real de un puzzle de Lichess del tema `capturingDefender` (la solución del puzzle hace de variante).
- **Largo:** el tope de ~220 caracteres vale solo para el texto de la explicación (lo que se ve al abrir «Mejor»); el titular de la voz no cambia. Si concepto más secuencia no entran, primero se acorta la secuencia (3, 2, 1 jugadas) y recién después se quita lo de menor prioridad; el concepto nunca se quita. Es una meta de diseño comprobada con pruebas en es y en; de, it y fr pueden pasarse un poco, porque el globo tiene desplazamiento.
- **Estilos de los bots:** cada bot ya tiene uno de los cuatro estilos en `bots.json`, sin cambios.
- **Frases `opp` y plan:** las 6 frases sin estilo se reemplazan por frases por estilo (no quedan como respaldo, porque el estilo siempre existe). En una jugada mala, el plan se dice como intención solo para `develop`, `center`, `rookFile`, `pawnBreak`, `pawnAdvance`, `kingActive` y `retreat`; para `trade` y `plain` se omite. Sin `pv`, el comportamiento actual no cambia, salvo por el orden y el plan.

## Lo que queda a criterio de quien construya

- Estructura interna de `lines.ts` y de los marcos de voz; reparto de las tareas.
- Redacción exacta de los marcos y de las intenciones, respetando el estilo de cada bot (`tranquilo`, `equilibrado`, `posicional`, `agresivo`) y el tope de largo.
- Posiciones de prueba para cada caso (pueden salir de puzzles de Lichess con el tema `capturingDefender`, que ya están en `src/puzzles/`) y el caso del usuario como prueba de regresión.
