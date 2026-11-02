# Hito 6 · Perfil, Ajustes, Créditos y bienvenida

## Cómo probarlo
Hay tres módulos nuevos (`expo-audio`, `expo-haptics` y `expo-notifications`). Ya quedaron instalados y vienen incluidos en Expo Go.
```
cd C:\dev\ajedrez-app
npx expo start -c
```

## Qué verás
- **Bienvenida:** la primera vez que abras la app después de esta actualización, también tú, aparece la bienvenida en 3 pasos:
  1. "Empezar".
  2. Tu nivel.
  3. Tu meta diaria.

  Se puede saltar en cualquier momento, y tu progreso no se toca.
- **Perfil:**
  - Tu racha (y la mejor), XP total, lecciones hechas y puzzles resueltos.
  - Las aperturas que empezaste, con su barra.
  - Tus partidas contra cada bot.
  - Accesos a Ajustes y a Créditos.
- **Ajustes:**
  - Meta diaria (5, 10 o 15 minutos).
  - **Recordatorio diario:** al encenderlo, el teléfono te pide permiso para las notificaciones. Después eliges la hora.
  - **Tema del tablero:** Verde, Madera, Azul, Gris o Morado. Se aplica en todos los tableros.
  - Piezas (lo que ya tenías).
  - **Notación:** española (Cf3) o inglesa (Nf3).
  - **Sonido** y **Vibración**, con interruptores.
  - **Borrar progreso,** con confirmación. No borra los ajustes.
- **Créditos y licencias:** Stockfish (GPL, con los enlaces a su código), los puzzles de Lichess, chess.js, la fuente Nunito, el origen de las piezas y los sonidos.
- **Animación de las jugadas:** las piezas se deslizan un poco más lento y suave. La pieza capturada se achica y se desvanece mientras llega la otra.
- **Sonidos:**
  - Al mover y al capturar, un golpe de madera.
  - Al acertar, dos notas que suben; al fallar, un tono que baja.

  Se callan con el teléfono en silencio.
- **Vibración:** al acertar y al fallar en lecciones y puzzles.
- **Bots:** Pipo, Lola, Tomás y Valentina ahora juegan bastante más flojo, sobre todo Pipo: comete errores de verdad, como dejar piezas colgadas. Ver "Calibración" en `docs/bots.md`.

## Qué probar
1. Abre la app: tiene que aparecer la bienvenida. Elige "Juego de vez en cuando" y 10 minutos. En Puzzles, la dificultad tiene que arrancar en **Medio**.
2. Perfil → Ajustes → **Tema del tablero → Madera**. Ve a Análisis: el tablero tiene que estar en marrón.
3. En Análisis, mueve piezas y captura alguna: tiene que sonar, deslizarse y la capturada desvanecerse. Apaga **Sonido** en Ajustes y comprueba que ya no suena.
4. En un puzzle, equivócate y después acierta: tiene que vibrar distinto en cada caso.
5. Ajustes → **Notación → Inglesa**. En una partida contra un bot, las jugadas tienen que verse como Nf3, Bc4…
6. Ajustes → **Recordatorio diario** → enciéndelo y acepta el permiso. Si quieres probarlo ya, elige la hora más próxima. El aviso llega a esa hora en punto.
7. Juega contra **Pipo**: tiene que equivocarse seguido.

## Limitaciones de esta versión
- El nivel de la bienvenida hoy solo cambia la dificultad inicial de los puzzles: todavía hay una sola unidad.
- Los niveles de los bots se calibraron midiendo partidas entre bots. Con partidas tuyas se pueden afinar más.
- No se probó en el celular al escribirlo: si ves un error, copia el mensaje y lo corregimos.

## Corrección del 1-11-2026: sonido, vibración y recordatorio
Al probar en un Redmi (Android 15, Expo Go) fallaban los tres. **Quedó solucionado y probado en el celular:** los sonidos se oyen aunque el teléfono esté en vibración (`playsInSilentMode: true`), el error vibra con el vibrador directo y el recordatorio se puede activar (el canal de notificaciones es opcional). Causas y detalles en `CLAUDE.md`. Pendiente: confirmar el recordatorio en un build de desarrollo o de prueba, porque Expo Go no lo soporta del todo.
