# Comentarios tácticos en el análisis de partida

Fecha: 2026-11-05 · Estado: borrador para aprobar

## Intención y por qué

En «Análisis de partida» (`/revision`), el comentarista dice cosas genéricas («con X le das aire al rival») que no enseñan nada. Quien revisa su partida quiere entender **qué pasó en el tablero**, con las palabras que la app ya enseña en las lecciones de táctica: orquilla (ataque doble), clavada, enfilada, ataque descubierto, jaque doble, pieza colgada, mate del pasillo, mate en N.

Causa en el código: `factsFor` (`src/review/build.ts`) solo conoce jaque, mate, captura y enroque. Si la jugada permite algo más sutil, no hay hecho que contar y se cae a una plantilla de ánimo.

Éxito = **cada jugada de la partida lleva información concreta y verificada** (piezas y casillas reales), no una frase intercambiable.

Ejemplos pedidos por el usuario:
- «Esa jugada habilita a tu rival a realizar una orquilla con Cxe5.»
- «¡Encontraste el ataque descubierto!»
- «Esa jugada habilita a tu rival a realizar un mate en 3.»

## Objetivos

1. Detector táctico puro (chess.js, sin React Native, con pruebas) que reconoce: orquilla, clavada, enfilada, ataque descubierto, jaque doble, pieza colgada, mate del pasillo, mate en N.
2. Dos direcciones, para el usuario y para el rival:
   - **Lo que hizo la jugada** («Encontraste una orquilla: el caballo ataca la dama y una torre»).
   - **Lo que permite** al rival, probando la mejor respuesta del motor (`replyUci`) («Esa jugada habilita a tu rival a hacer una orquilla con Cxe5»). El mate en N sale de la evaluación de mate que ya devuelve Stockfish (`score` = ±(10000 − n)): sin análisis extra.
3. **Jugadas sin táctica** (apertura tranquila, desarrollo normal): explicar el plan con hechos verificados, p. ej. «desarrolla el caballo hacia el centro», «libera al alfil», «amenaza capturar tal pieza», «controla el centro», «enroca».
4. Textos en los cinco idiomas (`src/review/coach/<idioma>.json`), con los nombres de las tácticas iguales a los de la app (glosario de las lecciones y `puzzleTheme.*` de `src/i18n`).
5. La frase de ánimo del bot (estilo del personaje) se mantiene; la explicación concreta va debajo y es lo principal.

## Fuera de alcance

- Cambiar el motor, la profundidad (11) o el tiempo de análisis.
- Usar un LLM para los textos: siguen siendo plantillas, como hoy.
- Tácticas raras (desviación, atracción, sacrificio de línea, etc.): se pueden sumar después; el diseño debe permitirlo.
- Revisión de nativos de las traducciones (siguen siendo de IA, como ahora).

## Antiobjetivos (sería un fracaso aunque funcione)

- **Inventar tácticas**: toda afirmación sale de comprobarla en el tablero. Si no hay certeza, no se dice (mejor el plan genérico verificado que una táctica falsa).
- Frases que se repiten idénticas jugada tras jugada.
- Textos tan largos que no caben en el globo del comentarista.
- Romper las claves guardadas, las pruebas existentes o los cinco idiomas.

## Restricciones

- Lógica en `src/review/` sin React Native; se prueba con `npm test` (tsx + node:test).
- `Facts` (`types.ts`) crece; lo existente (`did`, `allows`, `missed`) debe seguir funcionando.
- `coachText.test.ts` ya exige que los cinco idiomas tengan la misma forma y marcadores: se mantiene.
- `noHardcoded.test.ts`: nada de texto español fijo en pantallas.
- La notación del usuario (`fmt`) se aplica a todas las jugadas citadas.
- Un texto español nuevo se escribe también en en, de, it y fr (traducido con gemma4 vía Ollama, como la última vez).

## Decisiones tomadas con el usuario

- Explicar el plan en las jugadas sin táctica (propuesta aceptada el 2026-11-05).
- Información concreta en **cada** jugada, no solo en las destacadas.

## Mis decisiones (a revisar)

- Las tácticas se detectan con reglas sobre el tablero y no con el motor; el motor solo aporta la mejor respuesta y el mate en N.
- Prioridad cuando hay varios hechos: mate > táctica > captura > jaque > plan. Se muestran como mucho dos o tres líneas.
- Umbral para decir que una orquilla «vale»: solo si lo atacado es de más valor que la pieza que ataca o está sin defensa (para no marcar orquillas inofensivas).
- Para «permite», solo se avisa en imprecisiones, errores y errores graves (como hoy en `allows`); en jugadas buenas se felicita lo que se hizo.

## Aclaraciones tras la revisión del diseño (mis decisiones, a revisar)

- **Jugadas de ambos bandos.** La revisión ya comenta las jugadas del usuario y las del rival (`subject: 'you' | 'opponent'` en `coachText.ts`). Se mantiene: cada hecho nuevo lleva su versión en segunda persona («encontraste») y en tercera («el rival encontró»), como los textos actuales (`...You` / `...Opp`).
- **Sin táctica y sin plan reconocible.** Se amplía el catálogo de planes (desarrollo, centro, enroque, torre a columna abierta o semiabierta, avance o ruptura de peón, cambio de piezas, retirada, activación del rey en finales). Si aun así nada aplica, el último recurso es una descripción neutra y verificada de lo que hizo la pieza («mueve la torre a la columna d»), nunca una frase de ánimo vacía. Así «cada jugada con información» se puede probar.
- **Pantalla.** Sigue siendo texto que sale de `coachText` y se muestra en el globo existente; no se rediseña `GameReviewScreen`. Tope de tres líneas de explicación por jugada; si hay más hechos, se descartan los de menor prioridad.
- **«Permite».** Solo cuenta la mejor respuesta inmediata del motor (`replyUci`). Si falta, no se dice nada de lo que permite. No se busca a más jugadas de profundidad.
- **Mate en N.** N se cuenta en jugadas completas del bando que da el mate, igual que el motor (UCI `mate n`). Se informa tanto el mate que el usuario encontró como el que permitió al rival.
- **Convivencia con `allows` y `missed`.** Los hechos tácticos se suman a los actuales; no los reemplazan. Una jugada puede «encontrar el ataque descubierto» y a la vez ser un error grave; el texto lo dice con las dos cosas.

## Lo que queda a criterio de quien construya

- Estructura interna del detector (un archivo `tactics.ts` o varios).
- Forma exacta de las plantillas, la variedad de frases y el orden de las líneas.
- Casos límite de cada táctica, siempre cubiertos con posiciones de prueba (se pueden tomar de los puzzles de Lichess de cada tema en `src/puzzles/`).
