# Temario nuevo: lecciones que faltan · propuesta

Fecha: 9-11-2026. Estado: **propuesta, sin aprobar**. No se escribió ninguna lección.

## De dónde sale

Se cotejaron las 41 lecciones de Aprender y los 28 cursos de aperturas con los libros de `C:\dev\material para lecciones` y con el libro de Levy Rozman *How to Win at Chess* (2023). Los libros que más aportaron:

| Libro | Qué aporta |
|---|---|
| Rozman, *How to Win at Chess* | Táctica intermedia, cuándo cambiar piezas, espacio, finales intermedios, trampas de gambitos. Es el modelo de tono. |
| Rozman, *How to Win at Chess: Next Level* | Ataque, defensa, convertir ventajas, hacer un plan. |
| Capablanca, *Chess Fundamentals* (1921, dominio público) | Finales (peón pasado, alfil contra caballo, dama contra torre), ataque. |
| Seirawan, *Play Winning Chess* | Espacio, tiempo, cadenas de peones. |
| Chernev, *Logical Chess Move by Move* | Partidas comentadas jugada por jugada, útiles para pasos `line`. |
| Resumen Bookey de *The Complete Idiot's Guide to Chess* | Lista de temas tácticos (enfilada, sobrecarga, interferencia). |

**Derechos de autor:** salvo Capablanca, los libros tienen derechos vigentes y el repositorio va a ser público. Se toman ideas, temas y posiciones (que son hechos), nunca el texto. Cada explicación se escribe de cero con la voz del profesor de la lección.

## Qué se toma del estilo de Rozman

- Primero la idea en una posición ideal y después con un rival que responde (sus «diez jugadas de oro»).
- Nombres simples: «lo que ve cada pieza», «mates de una sola pieza», «mates de dos piezas».
- Un dato curioso por lección (estadísticas de partidas, historia).
- Reglas en forma de tabla de sí y no (por ejemplo, cuándo cambiar piezas).
- Cierre corto con lo que hay que recordar, y puzzles reales del tema.

## Resumen de la propuesta

| Bloque | Lecciones | Prioridad |
|---|---|---|
| A. Agregados a unidades existentes | 3 | 1 (rápido y tapa huecos visibles) |
| B. Unidad 7 · Táctica intermedia | 8 | 2 |
| C. Unidad 8 · Finales intermedios | 8 | 3 |
| D. Unidad 9 · Piezas y peones | 8 | 4 |
| E. Unidad 10 · Ataque, defensa y plan | 7 | 5 |
| F. Aperturas | 2 cursos + 1 texto | 6 |

En total, unas 34 lecciones nuevas (la ruta pasaría de 41 a unas 75).

---

## A. Agregados a unidades existentes

| Unidad | Lección nueva | Dónde va | Por qué |
|---|---|---|---|
| 3 · Táctica básica | **La enfilada** | Después de «La clavada» | Es el hueco más visible: la revisión de partidas ya le dice «enfilada» al usuario y ninguna lección la enseña. Rozman la presenta como «la clavada al revés». |
| 4 · Apertura y estrategia | **Trampas que vas a ver** | Después de «Errores típicos de apertura» | Gambito Englund y Blackburne-Shilling: Rozman cuenta que la trampa del Blackburne-Shilling funcionó cientos de miles de veces en partidas en línea. Se enseña a no caer y a castigarlas. |
| 5 · Finales | **Mate en escalera** | Primera lección de la unidad, antes de «Mate con dama» | Es el mate más fácil (dos piezas pesadas que se turnan) y prepara los otros dos. |

**Efecto en el progreso guardado:** una lección insertada en una unidad no borra nada. Las lecciones terminadas siguen terminadas y la nueva aparece como la actual (`lessonStates` en `src/progress/path.ts`). Ids nuevos sin renumerar los viejos: `u3-l09`, `u4-l07`, `u5-l06`; el orden lo da la posición en el JSON.

---

## B. Unidad 7 · Táctica intermedia

Continúa la Unidad 3. Mismo formato: explicación, ejercicios `move` y `line`, y puzzles de Lichess del tema al final.

1. **La atracción.** Llevar al rey o a una pieza a una casilla mala con un sacrificio. Pareja natural de «La desviación».
2. **La sobrecarga.** Una pieza que defiende dos cosas a la vez no puede con las dos.
3. **La jugada intermedia.** Antes de recapturar, un jaque o una amenaza mayor.
4. **La interferencia.** Poner una pieza en medio de la línea de defensa.
5. **Mates de una sola pieza.** El mate de la coz (caballo contra un rey encerrado por sus piezas) y el mate en diagonal. El pasillo ya está en la Unidad 3: se repasa en un paso.
6. **Mates de dos piezas.** La batería: dama apoyada por alfil o por caballo, y la pieza que vigila la casilla de escape.
7. **Sacrificar para abrir al rey.** El sacrificio como inversión, no como regalo (el de calidad ya está en la Unidad 6).
8. **Calcular: mate en dos y en tres.** El método de jaques, capturas y amenazas aplicado a secuencias forzadas, con pasos `line`.

Fuentes: Rozman cap. 5 y 14; Guía Completa cap. 8 y 9.

---

## C. Unidad 8 · Finales intermedios

Continúa la Unidad 5. Usa mucho el paso `practice` (contra Stockfish, solo es error la jugada que deja escapar el resultado).

1. **El rey activo.** En el final el rey es una pieza más y va al centro.
2. **El peón pasado alejado.** La gran arma de los finales de peones: distrae al rey rival mientras el tuyo come del otro lado.
3. **Dama contra peón.** Cómo frenar a un peón que corona (y el caso de los peones de alfil y de torre, que hacen tablas).
4. **La posición de Philidor.** La defensa de torre contra torre y peón (pareja de «Lucena»).
5. **Cortar al rey con la torre.** La idea general de los finales de torre.
6. **Alfiles de distinto color.** Por qué suelen ser tablas aun con peones de menos.
7. **Alfil contra caballo en el final.** Cuándo gana el alfil, cuándo el caballo, y dar la pieza por el último peón para salvar la partida.
8. **Las dos debilidades.** Atacar de un lado para ganar del otro.

Opcional, como desafío aparte: mate con alfil y caballo (difícil y raro; Capablanca §15).

Fuentes: Rozman cap. 13; Capablanca cap. I, II y V; *Next Level* cap. 8.

---

## D. Unidad 9 · Piezas y peones

Continúa la Unidad 4. Más pasos `quiz` («¿qué plan tiene sentido acá?») y ejercicios que aceptan todas las jugadas que cumplen la idea, como en la Unidad 4.

1. **Piezas sueltas.** Una pieza defendida por una sola pieza, o por ninguna, es un blanco.
2. **El espacio.** Contar las casillas del campo rival que ven tus piezas; el que tiene menos espacio cambia piezas.
3. **Posiciones abiertas y cerradas.** Qué piezas brillan en cada una.
4. **Alfil bueno y alfil malo.** El alfil y sus propios peones.
5. **Torres: conectarlas, la séptima fila y la torre levantada.**
6. **Peón retrasado y cadenas de peones.** Atacar la base de la cadena.
7. **Rupturas y mayorías de peones.** Cómo se abre el juego y cómo se crea un peón pasado (Capablanca §11).
8. **Cuándo cambiar piezas.** Tabla de sí y no: cambiar con ventaja de material, cuando te atacan, para dejar una debilidad o cuando te falta espacio; no cambiar con material de menos, cuando atacás o cuando tenés más espacio. Ejercicios de «¿cambio o no?».

Fuentes: Rozman cap. 8 y 15; *Next Level* cap. 2 y 3; Seirawan, principios de espacio y estructura.

---

## E. Unidad 10 · Ataque, defensa y plan

La más difícil. Usa partidas comentadas (pasos `line`) además de ejercicios.

1. **El rey sin enrocar.** Abrir el centro y castigar al que no enroca.
2. **Atacar con enroques del mismo lado.** Piezas primero, peones con cuidado.
3. **Enroques opuestos.** La avalancha de peones y la carrera entre los dos ataques.
4. **Defender al rey.** Cambiar las piezas que atacan, no mover los peones del enroque sin motivo.
5. **Defenderse con material de menos.** Buscar el jaque perpetuo, el ahogado y las tablas.
6. **Convertir una ventaja.** Simplificar cuando se va ganando, y no relajarse.
7. **Hacer un plan.** Varias posiciones donde hay que elegir el plan antes que la jugada (Rozman, *Next Level* cap. 1 y 9).

La última unidad termina con un repaso de puzzles, como hoy la Unidad 6.

Fuentes: *Next Level* cap. 5, 6, 7 y 9; Capablanca cap. III y IV; Chernev, partidas 1 a 16 (ataque al rey).

---

## F. Aperturas

- **Curso nuevo: Apertura Española (Ruy López).** La más jugada en la élite, y la usan Capablanca y Chernev. Falta por completo.
- **Curso nuevo: Defensa Holandesa.** Rozman la recomienda como apertura de esquema fijo contra 1.d4. Hoy solo aparece dentro de otros cursos.
- **Texto en la pestaña Aperturas: «Cómo elegir tu repertorio».** Elegir una sola apertura con blancas y una contra 1.e4 y 1.d4, según el estilo y el tiempo que tiene cada uno.

Los cursos nuevos siguen el formato de `aperturas-v3.json` (Idea, Línea principal, guías por variante y Repaso), con las líneas revisadas con Stockfish como las demás.

---

## Qué implica cada lección (igual que las unidades actuales)

- Contenido en español en `src/data/unidad-N-*.json` y en los otros cuatro idiomas en `src/data/i18n/<lang>/unidad-N.json` (inglés propio; de, it y fr con gemma4 vía Ollama, revisando puntuación y términos).
- Registrar la unidad en `src/data/units.ts` y su profesor en `PATH_TEACHERS` (`src/data/teachers.ts`).
- Validar todas las posiciones y soluciones con chess.js y revisarlas con Stockfish probando todas las jugadas legales (en la Unidad 3, casi todos los errores fueron mates en la última fila que no se veían).
- Puzzles reales de Lichess del tema al final de cada lección.
- Agregar las lecciones nuevas a `docs/contenido-lecciones-aperturas.md` y a `docs/formato-lecciones.md`.

## Decisiones (9-11-2026)

1. **Unidades separadas:** D (Piezas y peones) y E (Ataque, defensa y plan) quedan como dos unidades distintas. En total serán 10 unidades.
2. **Repaso final:** pasa al fondo de la ruta, como última lección de la Unidad 10, y repasa los temas de todas las unidades. Hasta que exista la Unidad 10 se queda donde está (final de la Unidad 6).
3. **Profesores (decidido el 9-11-2026):** cada bot sigue enseñando lo que dice su ficha (`teaches` en bots.json y `2026-10-30-personajes-design.md`: Sofía tácticas, Ivo finales, Tomás trampas, Don Ramiro principios de apertura, Camila peones). Las unidades 7 a 10 se reparten por tema según esas fichas. La regla de «un bot por unidad en orden de nivel» queda descartada por ahora; el usuario piensa revisar las fichas más adelante y entonces se puede volver a ver.

## Estado

- **Bloque A hecho el 9-11-2026:** La enfilada (`u3-l09`), Trampas que vas a ver (`u4-l07`) y Mate en escalera (`u5-l06`). Cinco idiomas (de, it y fr traducidos con gemma4 vía Ollama y corregidos a mano, sin revisión de nativos). Los profesores de esas tres siguen las fichas actuales: Sofía, Tomás e Ivo. Detalle de la validación en `docs/formato-lecciones.md`.
- **Bloque B hecho el 9-11-2026:** Unidad 7, Táctica intermedia (8 lecciones; ver `docs/formato-lecciones.md`). Las ocho lecciones usan puzzles reales de Lichess; la sobrecarga se armó con una búsqueda propia. Profesores según las fichas: Tomás (atracción, jugada intermedia), Sofía (sobrecarga, interferencia, calcular), Pipo (mates de una pieza) y Valentina (mates de dos piezas, sacrificios).
- **Bloque C hecho el 9-11-2026 (parcial):** Unidad 8, Finales intermedios, con 6 de las 8 lecciones previstas (rey activo, peón pasado alejado con las dos debilidades, dama contra peón, Philidor, cortar al rey con la torre, alfiles de distinto color). Todas las enseña Ivo. Quedó pendiente «Alfil contra caballo» (ver `docs/formato-lecciones.md`).
- **Bloque D hecho el 9-11-2026 (parcial):** Unidad 9, Piezas y peones, con 6 de las 8 lecciones previstas (piezas sueltas, cuándo cambiar piezas, el espacio, posiciones abiertas y cerradas, alfil bueno y malo, peón retrasado y cadenas). Quedaron pendientes «Torres activas» y «Rupturas y mayorías de peones».
- **Bloque E hecho el 9-11-2026 (parcial):** Unidad 10, Ataque y defensa, con 4 lecciones (el rey sin enrocar, enroques del mismo lado, enroques opuestos, defender al rey) más el Repaso final movido al fondo de la ruta y ampliado a 16 puzzles. Quedaron pendientes «Defenderse con material de menos», «Convertir una ventaja» y «Hacer un plan» (ver `docs/formato-lecciones.md`).
- Falta: el bloque F (cursos Apertura Española y Defensa Holandesa y el texto «Cómo elegir tu repertorio») y las lecciones pendientes de las unidades 8, 9 y 10.
