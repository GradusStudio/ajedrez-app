# Premio de monedas sobre el tablero

Fecha: 14-11-2026 · Diseño: opus · Tarea 3 de `agentes.md` (quedó afuera de las animaciones de piezas del 9-11-2026).

**Referencia visual:** `prototipo-monedas.html` (raíz del repo, fuera de git). Se abre con doble clic; tiene tres botones: puzzle resuelto (+2), puzzle con errores (+1) y partida ganada a un bot (+12 con el bono del día +10).

## Idea

Hoy las monedas que se ganan en un puzzle, en una partida o en el quiz de puntos de giro aparecen solo como texto («Ganaste 2 monedas»). Ahora el premio se ve donde pasó: **las monedas saltan de la casilla de la jugada que las ganó y vuelan a una pastilla dorada en la esquina del tablero, que va sumando.** El texto sigue en el panel, para lectores de pantalla y para quien no mire el tablero.

## Cuándo

- **Puzzle resuelto** (`PuzzleScreen`): +2 o +1, solo la primera vez (las reglas de hoy). Casilla: destino de la última jugada del usuario.
- **Quiz de puntos de giro** (`TurningPointQuizScreen`): igual que un puzzle.
- **Partida ganada a un bot** (`GameScreen`): Elo / 100, una vez por día y por bot. Casilla: la del rey vencido si es mate; si no (abandono o tiempo), el centro del tablero.
- **Bono del día** (+10, primera acción válida del día): si cae junto con alguna de las anteriores, va como segunda tanda (abajo).
- En las lecciones no: el premio se cuenta en la pantalla de resultado, que ya tiene sus monedas animadas.
- Si no se ganan monedas (puzzle repetido, práctica, partida ya premiada hoy), no hay animación.

## Secuencia (unos 1,3 s con una tanda; 2,3 s con el bono)

Empieza 250 ms después de que la pieza aterriza (que se vea la jugada antes del premio).

1. **0–420 ms · destello:** un borde dorado de 4 px (`gold`) en la casilla crece de 0,7 a 1,08 y se apaga en 1,2. A los 120 ms aparece la **pastilla** arriba a la derecha del tablero (10 px del borde): fondo `rgba(38, 36, 33, 0.92)`, borde de 2 px `gold`, canto de 4 px `#B8901C` (`COIN_EDGE`), moneda de 26 px y el número «+0» en 20 px, 900, `gold`, con cifras de ancho fijo. Entra con escala 0,6 → 1,06 → 1 (300 ms).
2. **260 ms en adelante · las monedas:** una moneda por moneda ganada, **8 como máximo** (con +12 se ven 8 y la pastilla igual llega a +12). Tamaño: 46 % de la casilla. Cada una sale 70 ms después de la anterior y vuela 820 ms:
   - Primer 45 %: sube desde el centro de la casilla hasta un punto entre 1,3 y 1,65 casillas más arriba, abierta en abanico (de −0,9 a +0,9 casillas a los costados), creciendo de 0,4 a 1,1.
   - Último 55 %: viaja a la moneda de la pastilla con una curva suave (media casilla de arco), achicándose a 0,55.
   - Gira sobre su eje vertical dos vueltas completas (`rotateY` 0 → 720°; en React Native, `scaleX` con `cos`, que es lo que hace una moneda que gira).
   - Al llegar desaparece y la pastilla suma su parte con un latido (escala 1 → 1,12 → 1, 180 ms). El número siempre termina en el total exacto.
3. **Bono del día (si corresponde):** al llegar la última moneda, debajo del número aparece «con el bono del día» (10 px, `textMuted`) y sale una segunda tanda de 5 monedas desde la misma casilla, que suma +10.
4. **Final:** la pastilla se queda 900 ms y se va hacia arriba con fundido (10 px, 300 ms).

Con `useReducedMotion`: sin monedas ni destello; la pastilla aparece con el total final (y el rótulo del bono), se queda 1,5 s y se va con fundido.

El tablero sigue usable durante la animación (la capa no recibe toques). Si el usuario pasa al siguiente puzzle antes de que termine, la animación se corta y la pastilla se va.

## Cómo se arma (para quien programe)

- Componente nuevo **`CoinReward`** (`src/components/CoinReward.tsx`), que se dibuja **encima** del tablero como capa absoluta (`pointerEvents="none"`), hermano de `Board` dentro del contenedor del tablero. **No toca `Board.tsx`** (reservado por el premove, tarea 6), así que esta tarea no tiene que esperar.
- Props: `boardSize` (el de `BoardSizeContext` o `boardPixels`), `orientation`, `square` (o `null` para el centro), `amount`, `bonus?`, y una `key` o contador para dispararla. Calcula la posición de la casilla con la orientación.
- Animaciones con `Animated` de React Native y `useNativeDriver: true` (traslación, escala y opacidad); sin dependencias nuevas. La curva de cada moneda se puede armar con `Animated.Value` de 0 a 1 interpolado en 8 a 12 puntos (`inputRange` / `outputRange`), como el prototipo.
- La moneda dibujada es la de `StatIcon name="coin"` con un brillo blanco arriba a la izquierda (trazo `M6.5 8.5a6.5 6.5 0 0 1 3-3`, `#FFF6C8`).
- Sonido: el de acierto que ya suena; sin sonido nuevo por ahora.
- En la web ancha (`BoardLayout`) y en el celular va igual: la pastilla siempre dentro del tablero.

## Cómo se comprueba

- Prueba pura del reparto: `amount` y `bonus` en tandas de como máximo 8 monedas, y que la suma mostrada termina exactamente en el total (con 1, 2, 12, 22 y con bono).
- `npm test`, `npx expo lint`, `npx tsc --noEmit`.
- Navegador (`web-dev`, 1280 y 375 px): resolver un puzzle nuevo (+2), uno con un error (+1), uno repetido (sin animación) y ganar una partida corta a Pipo. El celular lo prueba el autor.
