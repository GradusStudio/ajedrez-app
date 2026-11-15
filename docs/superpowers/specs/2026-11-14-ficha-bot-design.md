# Ficha del bot con cuerpo entero

Fecha: 14-11-2026 · Diseño: opus · **Referencia visual:** `prototipo-ficha-bot.html` (raíz del repo, fuera de git; arriba a la derecha se elige cualquiera de los diez bots).

Hoy la ficha (`BotDetailScreen`) es una columna de texto: avatar de 72 px, nombre, frase, rasgo, «Te enseña», aperturas como texto corrido, el selector de color y «Jugar». No dice cómo te fue contra él ni aprovecha el arte nuevo.

## Pantalla ancha (columna de 1000 px)

Arriba: «‹ Bots» para volver. Debajo, dos columnas.

### Izquierda (360 px): el personaje
- **Cuerpo entero** (`assets/bots/cuerpo/<id>.webp`) de 400 px de alto, parado sobre una sombra en el piso, con una luz suave del **color de su estilo** detrás (equilibrado `gold`, tranquilo `primary`, agresivo `danger`, posicional `blue`, al 28 %).
- **Globo blanco** arriba con su saludo (`lines.greeting`) y la cola hacia el personaje, como el globo de la lección.
- Más adelante, cuando haya animación (Rive, en pausa), es el primer lugar donde moverlo.

### Derecha: quién es y cómo te fue
1. «BOT 4 DE 10» (12 px, color del estilo), el **nombre** (40 px, 900) y la frase («La atacante», 18 px, `textMuted`).
2. Chips: «Nivel 1200» con una **barrita de 10 segmentos** (`gold` hasta su nivel, ⌈elo/220⌉) y su estilo con el borde y el texto del color del estilo.
3. El **rasgo** (`trait`) en 17 px.
4. Dos tarjetas lado a lado:
   - **Te enseña** (`teaches`).
   - **Sus aperturas:** una fila por apertura, con un cuadradito blanco o negro según el color, y el nombre como **enlace al curso** de esa apertura. Sin libro: «Sin libro: juega por principios».
5. **Tus partidas contra {bot}:** ganadas (en `gold`), perdidas y tablas en grande, y a la derecha las **últimas 5** como puntos (dorado = ganada, gris = perdida, gris claro = tablas). Si hay una **partida sin terminar** con él (`ongoingGame`): «Partida sin terminar · jugada 14, te toca a ti» y el botón secundario «Continuar». Si nunca jugaste: «Todavía no jugaste contra {bot}. Gánale una vez y suma {elo/100} monedas.»
6. **Tú juegas con:** tres botones grandes (64 px de alto) con un rey dibujado blanco, gris o negro y el texto «Blancas», «Al azar» y «Negras». El elegido lleva el borde verde. Al lado, **«Jugar»** (botón primario de 64 px, texto oscuro sobre verde).
7. Debajo, alineado a la derecha: «¿Quieres prepararte? **Practica la {primera apertura} contra {bot} ›**», que abre la práctica de aperturas que ya existe.

## Celular

Una columna: el personaje centrado (unos 260 px de alto) con el globo arriba; nombre, chips y rasgo; «Te enseña» y «Sus aperturas» una debajo de la otra; tus partidas; colores en fila y «Jugar» de ancho completo, fijo abajo si la pantalla no alcanza.

## Datos

Todo existe: `bots.json` (nombre, frase, nivel, estilo, rasgo, «te enseña», repertorio y saludo), `progress.games` (récord y últimas partidas por bot), `progress.ongoingGame`, los cursos de aperturas para los enlaces, y las monedas por victoria (`elo / 100`, una vez por día). No hay datos nuevos.

## Accesibilidad y textos

- El cuerpo entero lleva `accessibilityLabel` con el nombre del bot; el globo se lee como texto.
- Los botones de color son un grupo de radio (como hoy) con etiqueta completa.
- Los puntos de las últimas partidas tienen una etiqueta («Últimas partidas: ganada, perdida, ganada»).
- Textos de tú, sin exclamaciones, en los cinco idiomas, usando los nombres por idioma de la spec de bots cuando se implementen.

## Cómo se comprueba

- `npm test`, `npx expo lint`, `npx tsc --noEmit`, `noHardcoded`.
- Navegador (`web-compilada`) a 1366 y 375 px: un bot sin partidas (Ada), uno con récord (Tomás), uno con una partida sin terminar, uno sin libro con negras (Pipo); el enlace a un curso de apertura y a la práctica; elegir color y jugar.

## Aperturas de cada bot (revisión del 14-11-2026, aprobada por el autor)

Revisadas contra la personalidad de cada bot. Problema encontrado: **9 cursos no los jugaba ningún bot** (Dragón, Ataque Indio de Rey, Moderna, Pirc, Blackmar-Diemer, Rossolimo, Alapin, Gambito de dama aceptado y Holandesa), y `botForOpening` (`src/data/bots.ts`) caía en Don Ramiro, que no tiene esas aperturas en su libro. Además, Valentina y Sofía jugaban casi lo mismo (Gambito de rey y Najdorf).

Cambios en `repertoire` de `src/data/bots.json` (y de cada `src/data/i18n/<lang>/bots.json` si repite el repertorio):

| Bot | Blancas | Negras |
|---|---|---|
| Valentina | vienna, kings-gambit, danish, **bdg** | **dragon** (en lugar de sicilian) |
| Bruno | london, **kia** | caro-kann, french, **dutch** |
| Lola | london | scandinavian, **pirc** |
| Camila | english, catalan, queens-gambit, **queens-gambit-accepted** | queens-gambit-declined |
| Maestro Ivo | ruy-lopez, queens-gambit, **rossolimo** | nimzo-indian, queens-gambit-declined |
| Ada | london, italian, vienna, ruy-lopez, queens-gambit, **alapin** | scandinavian, petrov, sicilian, nimzo-indian, **modern** |
| Pipo, Tomás, Don Ramiro, Sofía | sin cambios | sin cambios |

- Comprobar que el libro de cada bot (`book`: corto, medio, largo) se arma también con los cursos nuevos y que el bot los juega desde la primera jugada (`src/bots/brain.ts`).
- Prueba nueva: **todo curso de `aperturas-v3.json` tiene al menos un bot** que lo juega del color del curso; si falla, la prueba nombra el curso.
- `botForOpening` ya elige al bot de menor nivel que juega el curso: con esto, la práctica de cada curso es contra alguien que lo conoce.
- Revisar en `docs/bots.md` el repertorio de cada ficha y actualizarlo.

## Ada juega con Stockfish (decisión del autor, 14-11-2026)

Ada es «la máquina»: no tiene que jugar como una persona. Deja de usar Maia y juega con **Stockfish limitado por Elo**, que hoy ya es su respaldo en `bots.json`:
- `engine` pasa a `{ "type": "stockfish-elo", "uciElo": 2200, "multipv": 1, "thinkMs": [1500, 3500] }` (lo que hoy está en `fallback`). El `fallback` puede quedar igual o quitarse si el tipo `stockfish-elo` no lo necesita.
- **Recalibrar** con partidas entre bots vecinos, como en `docs/maia.md` «Calibración»: Ada contra Maestro Ivo (1950) tiene que ganar alrededor del **76 %** (regla de 200 puntos). Si da mucho más o mucho menos, ajustar `uciElo` (Stockfish no baja de 1320) y repetir. Anotar el resultado en `docs/maia.md` y `docs/bots.md`.
- Las frases y las tablas siguen evaluándose con Stockfish como hoy.
- Si Ada era el único bot con la red de Maia 1900, no: Sofía e Ivo la siguen usando; la red se queda.
- Actualizar `docs/maia.md` (los bots que juegan con Maia pasan a ser nueve) y la ficha de Ada en `docs/bots.md`.
