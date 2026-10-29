# Hito 4 · Bots con Stockfish

## Cómo probarlo
Hay dependencias nuevas (`react-native-webview`, `react-dom` y `stockfish`), pero ya quedaron instaladas. Todo funciona en **Expo Go**: no hace falta una build de desarrollo.
```
cd C:\dev\ajedrez-app
npx expo start -c
```

## Qué verás
- **Pestaña Bots:** los 10 bots, de Pipo (500) a Ada (2200), con su personalidad, su nivel, su estilo y cuántas veces le ganaste.
- **Ficha del bot:** su saludo, qué te enseña y qué aperturas juega con cada color. Eliges **Blancas**, **Negras** o **Al azar**, y tocas **Jugar**.
- **La partida:**
  - Arriba, el bot con su estado ("Preparando a Lola…" mientras arranca el motor, "Pensando…", "Te toca") y un globo con lo que dice.
  - Mientras juegues una apertura que conoce, el bot la sigue. Abajo aparece "Apertura: Sistema Londres" cuando la partida coincide con una apertura enseñada.
  - Si cometes un error grave, el bot lo comenta. A veces también reconoce una buena jugada tuya.
  - **Ofrecer tablas:** el bot las acepta solo si no va ganando y ya se jugó un buen rato.
  - **Rendirse:** pide confirmación. Salir con la ✕ o "atrás" a mitad de partida también pide confirmación, y cuenta como derrota.
  - Al terminar: **Ganaste**, **Perdiste** o **Tablas**, con el motivo, y los botones **Revancha** (con los colores cambiados) o **Elegir otro bot**.
- **Practicar una apertura:** en Aperturas, en el detalle de cualquier apertura, el botón **Practicar contra un bot** abre una partida.
  - Juegas con el color de la apertura, y el bot sigue la línea del curso mientras tú la respetes. Cuando sales de la línea, avisa y juega libre.
  - El bot elegido es el de menor nivel que usa esa apertura. Si ningún bot la usa, juegas con Don Ramiro.
- **Análisis:** la lista de jugadas del tablero libre ahora está en español (Cf3 en vez de Nf3).
- Cada partida terminada cuenta para tu racha y tu meta diaria (no da XP).

## Qué probar
1. Bots → **Pipo** → Blancas → Jugar. Tiene que decir "Preparando a Pipo…" y, en uno o dos segundos, "Te toca". Juega unas jugadas: Pipo responde solo y comete errores.
2. Bots → **Lola** → Negras. Lola abre con d4 y sigue el Sistema Londres. Abajo tiene que aparecer "Apertura: Sistema Londres".
3. Ofrece tablas al principio: Lola no tiene que aceptar. Después ríndete: tiene que aparecer **Perdiste · Te rendiste**.
4. Toca **Revancha**: empieza otra partida con los colores cambiados.
5. Aperturas → Negras → **Defensa Escandinava** → **Practicar contra un bot**: el bot (Lola) juega 1.e4 y sigue la línea mientras tú juegues la Escandinava.
6. Juega contra **Ada** (2200): tiene que costar mucho ganarle.
7. Si en algún momento aparece "No se pudo iniciar el motor", toca **Reintentar** y avísame con una captura.

## Cómo está armado
- `src/engine/`: Stockfish en un WebView invisible. La app le habla solo con texto UCI. Los archivos de Stockfish van sin modificar. Detalle y licencia en `docs/motor.md`.
- `src/bots/`: el libro de aperturas de cada bot y cómo elige su jugada. Detalle en `docs/bots.md`, sección 4.1.
- `src/screens/BotsScreen.tsx`, `BotDetailScreen.tsx` y `GameScreen.tsx`, con sus rutas `src/app/(tabs)/bots.tsx`, `src/app/bot/[id].tsx` y `src/app/partida.tsx`.
- La app pasó de 2,8 a 5,6 MB, por el motor (que funciona sin internet).
- **Pruebas que hice en la PC:**
  - La página del motor, en Chrome sin ventana (el mismo motor de navegador que usa Android): arranca y piensa.
  - Los 10 bots con los dos colores, con el mismo motor, dentro y fuera de su libro: todas sus jugadas son legales.
  - El modo práctica: el bot sigue la línea completa.

## Limitaciones de esta versión
- **No lo probé en un celular.** El WebView de Android es el punto que más me preocupa: si el motor no arranca, avísame con una captura.
- Los niveles de los bots son objetivos, no medidos: hay que calibrarlos jugando.
- Los bots todavía no tienen preferencias de estilo (`bias`). Tampoco se pueden deshacer jugadas, y el bot nunca se rinde.
- Si sales de la app en medio de una partida, la partida no se guarda.
- `npx expo lint` ya funciona: se arregló instalando `react-dom` en la versión del SDK. Quedan 8 errores en `Board.tsx` (código del hito 1, sobre la animación de las piezas). Funciona bien, pero conviene revisarlos con la app a la vista.
- **Licencia:** Stockfish es GPL v3. Mientras solo pruebes en tu celular no hay obligaciones; antes de publicar hay que decidir (ver `docs/motor.md`).
