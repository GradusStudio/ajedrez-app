# Mapa de pantallas y navegación

Estilo visual: ver `design.md`. Formato de contenido: ver `formato-lecciones.md`.
Alcance: versión 1 para Android, sin cuentas ni servidor (todo se guarda en el dispositivo). La monetización queda fuera por ahora, con puntos de enganche previstos (sección 8).

---

## 1. Estructura general

Navegación inferior con 6 pestañas. Las pantallas de acción (lección, partida, puzzle) se abren encima de las pestañas, sin barra inferior, para dar espacio al tablero.

| Pestaña | Para qué sirve | Estado |
|---|---|---|
| Aprender | Ruta de lecciones de conceptos (unidades 1 a 6) | Hecha (hito 2) |
| Aperturas | Repertorio de aperturas con blancas y con negras | Hecha (hito 3) |
| Puzzles | Táctica diaria y práctica | Hecha (hito 5) |
| Bots | Partidas contra bots con personalidad | Hecha (hito 4) |
| Análisis | Tablero libre con análisis de Stockfish en vivo | Hecha |
| Perfil | Progreso, racha y ajustes | Hecha (hito 6) |

```
Inicio de la app
 ├─ Primera vez → Bienvenida → Nivel → Meta diaria → Aprender
 └─ Siguientes veces → Aprender (pestañas)

Pestañas
 ├─ Aprender   → Lección → Resultado de lección
 ├─ Aperturas  → Detalle de apertura → Lección / Repaso → Resultado
 │                                   └→ Practicar contra bot
 ├─ Puzzles    → Puzzle → Resultado
 ├─ Bots       → Selector de bot → Partida → Resultado de partida
 ├─ Análisis   → Tablero libre
 └─ Perfil     → Ajustes → Piezas · Créditos y licencias
```

---

## 2. Pantallas

### 2.1 Carga
Carga las fuentes (Nunito) y el progreso guardado. Fondo `bg`, indicador `primary`.

### 2.2 Primera vez (3 pasos, saltables) · hecha en el hito 6
Pantalla `bienvenida`. Se abre sola mientras `profile.onboarded` no sea true (ver `(tabs)/_layout.tsx`). Arriba muestra los tres puntos de avance y "Saltar".
1. **Bienvenida:** el nombre de la app («Gradus», en dorado), "Aprende ajedrez paso a paso" y botón primario "Empezar".
2. **Tu nivel:** "Nunca jugué", "Sé mover las piezas", "Juego de vez en cuando".
   - Hoy decide la dificultad inicial de los puzzles: Medio para "Juego de vez en cuando" y Fácil para los otros dos.
   - Cuando existan las Unidades 3 y 4, podrá decidir desde dónde empieza la ruta. Por ahora todas las unidades están abiertas.
3. **Meta diaria:** 5, 10 o 15 minutos. Se cambia después en Ajustes.

Sin registro ni correo. Más adelante, "Guardar mi progreso en la nube" puede aparecer en Perfil.

### 2.3 Aprender (inicio)
- Barra superior: racha (en `gold`), XP del día y barra de meta diaria (minutos practicados hoy sobre la meta; hasta que exista la bienvenida, la meta es 10 minutos).
- Ruta vertical de lecciones por unidad, como la de Duolingo: nodos circulares en zigzag unidos por una línea (verde hasta la última completada). Estados: completada (verde con ✓), actual (verde, con anillo y pulso suave), bloqueada (gris).
- Dentro de cada unidad, las lecciones se desbloquean de a una, al terminar la anterior. Entre unidades no hay bloqueo: la primera lección de cada unidad siempre está disponible, para que cada uno empiece por la unidad de su nivel. Se controla con `LOCK_LESSONS` en `src/progress/path.ts`; con `false`, todas quedan abiertas. Tocar una bloqueada avisa qué lección terminar.
- Se muestra una sola unidad a la vez (`units` en `src/data/units.ts`). Encabezado de unidad con título, progreso ("Lo básico · 4 de 12") y una flecha: al tocarlo se abre un menú con todas las unidades y su progreso, y se elige cuál ver. Al abrir la app se muestra la unidad de la última lección empezada (`lastUnit` en el progreso) y, la primera vez, la de la lección sugerida. Empezar una lección (también con el botón flotante) cambia a su unidad.
- Botón flotante primario con la lección sugerida: "Empezar" o "Continuar" si quedó a medias. Sigue a la unidad en pantalla (su primera lección sin terminar). Si esa unidad está completa, o sin elegir unidad, la sugerida es la siguiente de la unidad donde se terminó la última lección; si esa unidad está completa, la de la unidad siguiente.

### 2.4 Reproductor de lección (pantalla completa)
Es la pantalla más importante: sirve para lecciones, aperturas y repasos.

```
┌────────────────────────────┐
│ ✕   ▓▓▓▓▓▓░░░░░░░░  (progreso)│
│                            │
│  Texto o pregunta          │
│                            │
│       [  TABLERO  ]        │
│                            │
│  Opciones (en quiz)        │
├────────────────────────────┤
│  Panel de resultado        │
│  "Correcto" / pista        │
│  [ CONTINUAR ]             │
└────────────────────────────┘
```

Un componente por tipo de paso:

| Tipo | Qué muestra | Interacción |
|---|---|---|
| `explain` | Texto, tablero, resaltados y flechas | Botón "Continuar" |
| `move` | Pregunta y tablero activo | Jugar una pieza; validar contra `solutions` |
| `select_squares` | Pregunta y tablero | Tocar casillas |
| `quiz` | Pregunta, opciones y tablero si hay | Elegir una opción |
| `line` | Tablero, lista de jugadas jugadas y nota de cada una | Jugar tu color; el rival responde solo |

Reglas:
- Panel inferior de feedback: verde (`correctBg`) al acertar, rojo (`incorrectBg`) al fallar, con la pista o explicación.
- Un error no bloquea: la jugada equivocada se ve en el tablero, el panel rojo muestra la pista y el botón "Reintentar" la deshace. Los pasos fallados se anotan para el repaso.
- Al salir con la ✕ (o el botón "atrás" de Android) se pide confirmación y se guarda el avance de la lección. El avance también se guarda en cada paso, por si se cierra la app. Al volver, la lección sigue desde el paso donde quedó.

### 2.5 Resultado de lección
XP ganado, racha actualizada y errores cometidos. Botones: "Continuar" (primario) y "Repasar errores" (secundario, solo si hubo errores).
- La XP de una lección se suma solo la primera vez. Repetirla cuenta para la racha y la meta diaria, y guarda el menor número de errores.
- "Repasar errores" abre solo los pasos fallados de esa pasada. Los que se aciertan salen de la lista de errores; los que se vuelven a fallar siguen y suman un fallo.

### 2.5.1 Análisis
Tablero libre con jugadas legales (chess.js): deshacer, voltear, reiniciar y nueva partida. Stockfish analiza en vivo (hasta profundidad 20, solo con la pestaña a la vista): barra de evaluación, flecha con la mejor jugada y las 3 mejores variantes (tocar una la juega). Se puede apagar con el interruptor. Más adelante puede cargar una partida jugada contra un bot.

### 2.6 Aperturas (lista) · hecha en el hito 3
- Selector "Blancas / Negras", con la cantidad de cursos de cada color (16 y 12).
- Tarjetas por apertura: nombre, resumen, barra de progreso (lecciones hechas de 4) y chips con el estilo de bot que la usa (`botStyles`).
- Están los 28 cursos de `aperturas-v3.json`, todos abiertos (el plan original eran 4 al inicio).

### 2.7 Detalle de apertura · hecha en el hito 3
- Encabezado con el nombre, chips con el color con el que se juega y el estilo de bot, el resumen y el progreso.
- Lista de sus 4 lecciones: Idea, Línea principal, Trampas y errores, Repaso. Se desbloquean de a una, igual que dentro de una unidad (`lessonStates`). La siguiente se resalta en verde y dice si quedó a medias.
- Botón "Practicar contra un bot": abre una partida en modo práctica (ver 2.10).
- Al terminar una lección, "Continuar" vuelve a este detalle.

### 2.8 Puzzles · hecha en el hito 5
- **Pestaña:**
  - "X de 50.000 resueltos".
  - Tarjeta dorada **Puzzle del día**, con su objetivo, su nivel y el botón "Resolver".
  - **Práctica:** dificultad (Fácil, Medio, Difícil), chips de tema (Todos, mates, horquilla, clavada…), botón "Practicar" y cuántos puzzles hay con esa elección.
- **Pantalla de puzzle** (`puzzle`):
  - Chip con el modo.
  - Tablero orientado al color del usuario, y el rival juega primero.
  - Enunciado: "Juegan las blancas · Mate en 2" o "Encuentra la mejor jugada".
  - Botones "Pista" y "Ver solución".
  - Al terminar: panel verde "Resuelto", con o sin errores, o neutro "Solución". Muestra los temas del puzzle y, en práctica, el botón "Siguiente puzzle".
  - Enlace al puzzle en Lichess.
- Sin racha de puzzles ni puntuación: solo resuelto o no resuelto.
- Origen, licencia y criterios de selección: ver `puzzles.md`.

### 2.9 Bots (selector) · hecha en el hito 4
- **Lista de los 10 bots**, de menor a mayor nivel. Cada tarjeta muestra el avatar provisorio (inicial sobre el color de su estilo), el nombre, el apodo, la personalidad, chips con el nivel y el estilo, y el registro ("Le ganaste 2 de 3").
- **Ficha del bot** (`bot/[id]`): su saludo, la personalidad, qué enseña y qué aperturas juega con cada color. Ahí eliges color (Blancas, Negras o Al azar) y tocas el botón primario "Jugar".

### 2.10 Partida contra bot · hecha en el hito 4
- Bot arriba, con su estado ("Preparando a Lola…", "Pensando…", "Te toca") y un globo con su frase. Debajo, el tablero, "Tú", el indicador "Apertura: Sistema Londres" (solo cuando la partida coincide con una única apertura enseñada) y la lista de jugadas en español.
- Acciones: "Ofrecer tablas" y "Rendirse". Deshacer queda pendiente.
- Salir con la ✕ o con "atrás" a mitad de la partida pide confirmación y cuenta como derrota.
- Resultado en un panel inferior (verde, rojo o neutro): "Ganaste", "Perdiste" o "Tablas", con el motivo (jaque mate, rey ahogado, triple repetición, etc.). Botones: "Revancha" (con los colores cambiados) y "Elegir otro bot".
- Modo práctica desde el detalle de una apertura: chip "Práctica: …", y los botones del resultado pasan a ser "Practicar otra vez" y "Volver a la apertura".
- El motor se describe en `motor.md` y el comportamiento de los bots en `bots.md`, sección 4.1.

### 2.11 Perfil · hecha en el hito 6
- **Cuatro tarjetas:** racha (con la mejor), XP total, lecciones de las unidades hechas sobre el total, y puzzles resueltos.
- **Aperturas empezadas,** con su barra de progreso.
- **Partidas contra bots,** con ganadas, perdidas y tablas por bot (sin contar las de práctica).
- **Filas a Ajustes y a Créditos y licencias.**

### 2.12 Ajustes · hecha en el hito 6
Pantalla `ajustes`. Cada cambio se guarda al instante, en `@ajedrez/settings`, separado del progreso.
- **Práctica:**
  - Meta diaria (5, 10 o 15 minutos).
  - Recordatorio diario, con interruptor y hora (9, 13, 19 o 21). Es una notificación local, que funciona en Expo Go. Si no hay permiso, se avisa y el interruptor vuelve a apagado.
- **Tablero:**
  - Tema: Verde, Madera, Azul, Gris o Morado.
  - Piezas (abre la pantalla Piezas).
  - Notación: española (Cf3) o inglesa (Nf3). Se aplica en partidas, Análisis y líneas de apertura.
- **Sonido y vibración:** dos interruptores.
  - El sonido respeta el modo silencio del teléfono.
  - La vibración usa la respuesta háptica de Android: "Confirmar" al acertar y "Rechazar" al fallar.
- **Datos:** "Borrar progreso", con confirmación. Borra lecciones, racha, XP, puzzles y partidas. No borra los ajustes, la meta ni la bienvenida ya hecha.

### 2.12.1 Piezas · hecha
- Pantalla `piezas`, que se abre desde Perfil > Ajustes. Muestra los 5 sets (Clásico, Minimalista, Gótico, Redondeado, Contorneado), cada uno con nombre, descripción y una vista previa de 6 piezas sobre casillas del tablero.
- Al tocar un set se aplica en todos los tableros de la app y se guarda en el teléfono. El elegido tiene borde verde y "✓ En uso".
- Por defecto: Clásico.

### 2.13 Créditos y licencias (obligatoria) · hecha en el hito 6
Pantalla `creditos`, con una tarjeta por componente: qué hace, su licencia y los enlaces.
- Stockfish y Stockfish.js (GPL v3), con enlaces al código y a la licencia.
- Puzzles de Lichess (CC0), chess.js (BSD-2-Clause), Nunito (OFL 1.1).
- Piezas (hechas con ChatGPT) y sonidos (propios).
- Expo, React Native y bibliotecas (MIT).

Las licencias se revisaron en el `package.json` de cada paquete.
Debe mostrar los motores y bases usados con su licencia (Stockfish, chess.js y los puzzles de Lichess, CC0), la licencia de la propia app (GPL v3 o posterior) con el enlace a su código, y el enlace al código fuente cuando la licencia lo exija. Es necesaria para cumplir la GPL. También debe decir el origen de las piezas: los 5 sets se generaron a partir de imágenes hechas con ChatGPT.

---

## 3. Flujos principales

1. **Primera sesión:** Carga → Bienvenida → Nivel → Meta → Aprender → primera lección → Resultado.
2. **Lección diaria:** Aprender → "Empezar" → pasos → Resultado → siguiente nodo.
3. **Estudiar una apertura:** Aperturas → detalle → lección guiada → repaso → "Practicar contra un bot".
4. **Partida:** Bots → elegir bot y color → partida → resultado → revancha.

---

## 4. Datos que guarda la app (en el dispositivo)

Lo que ya se guarda (versión 2, `src/progress/progressStore.ts`, clave `ajedrez:progreso` en AsyncStorage):

```json
{
  "version": 2,
  "profile": { "dailyGoalMin": 10, "level": "basico", "onboarded": true },
  "lessons": { "u1-l01": { "done": true, "errors": 1, "completedAt": "...", "completions": 2 } },
  "drafts": { "u1-l03": { "stepIndex": 2, "errors": 1, "mistakes": ["u1-l03-s03"] } },
  "streak": { "current": 3, "best": 5, "lastActiveDate": "2026-10-27" },
  "xp": { "total": 120, "today": 30, "date": "2026-10-27" },
  "practice": { "seconds": 420, "date": "2026-10-27" },
  "mistakes": [ { "stepId": "u1-l09-s05", "lessonId": "u1-l09", "count": 2, "lastSeen": "..." } ],
  "games": [ { "botId": "lola", "userColor": "w", "result": "win", "reason": "Jaque mate", "moves": ["d2d4", "..."], "practiceCourseId": "london", "playedAt": "..." } ]
}
```

- `puzzles` guarda, por id de Lichess, el mejor resultado: `{ "result": "clean" | "solved" | "failed", "at": "..." }`. Ver `puzzles.md`.
- `games` guarda las últimas 50 partidas, de la más reciente a la más vieja. Una partida terminada cuenta para la racha y la meta diaria, pero no da XP. El registro contra cada bot no cuenta las partidas de práctica.

- `lessons[].errors` es el menor número de errores en una pasada.
- `drafts` guarda el avance de las lecciones a medio hacer.
- `lastUnit` (opcional) es la unidad de la última lección empezada desde Aprender; es la que se muestra al abrir la app. Elegir una unidad en el menú sin empezar una lección no la cambia.
- `xp.today` y `practice.seconds` valen para el día de `date`; al cambiar el día empiezan en 0.
- El tiempo de práctica tiene un tope de 30 minutos por sesión, por si la app queda abierta sin usar.
- Si cambia la forma de los datos, se sube `version` y se migra en `migrate()`; la versión 1 ya se migra sola.

Las lecciones de apertura se guardan en el mismo `lessons` que las de las unidades (los ids no se repiten: `london-l01`, `u1-l01`). El progreso de cada apertura se calcula contando sus lecciones hechas, así que no hace falta un campo `openings` aparte.

Ajustes, aparte (clave `@ajedrez/settings`, `src/settings/SettingsContext.tsx`). Borrar el progreso no los borra:

```json
{ "sound": true, "vibration": true, "notation": "es", "boardTheme": "verde", "reminder": { "enabled": false, "hour": 19 } }
```

El set de piezas también va aparte, con la clave `@ajedrez/pieceSet`.

Almacenamiento: `AsyncStorage` es suficiente para empezar. Si el volumen crece (muchas partidas guardadas), pasar a `expo-sqlite`. El modelo ya permite sincronizar con la nube después.

---

## 5. Estructura de código

Navegación: **Expo Router** (decidido en el hito 2). Usa React Navigation por dentro y es lo que recomienda Expo. Cada archivo de `src/app/` es una pantalla; ya no existen `App.tsx` ni `index.ts` (el punto de entrada es `expo-router/entry`).

```
src/
  app/                  rutas (solo pantallas)
    _layout.tsx         fuentes, barra del sistema, progreso y la pila de pantallas
    (tabs)/_layout.tsx  barra de pestañas
    (tabs)/index.tsx    Aprender
    (tabs)/aperturas.tsx, puzzles.tsx, bots.tsx, analisis.tsx, perfil.tsx
    apertura/[id].tsx   detalle de apertura
    bot/[id].tsx        ficha del bot y elección de color
    partida.tsx         partida contra un bot (?bot=&color=&curso= para el modo práctica)
    piezas.tsx          elegir el set de piezas (desde Perfil > Ajustes)
    puzzle.tsx          un puzzle (?modo=dia&id= o ?modo=practica&nivel=&tema=)
    bienvenida.tsx      primera vez: bienvenida, nivel y meta diaria
    ajustes.tsx         Ajustes
    creditos.tsx        Créditos y licencias
    leccion/[id].tsx    lección de unidad o de apertura (con ?repaso=ids para el repaso de errores)
    resultado.tsx       resultado de lección
  theme.ts
  components/   Board, Piece, PieceSetPicker, Button3D, ProgressBar, FeedbackPanel, LessonNode, TabIcon, StatIcon, Chip,
                BotAvatar (PieceLegacy: set anterior, sin uso)
  puzzles/      puzzles.json (50.000 de Lichess, generado), themes.json (temas en español), puzzles.ts (del día, práctica)
  pieces/       pieceSets.ts (los 5 sets como trazados SVG; archivo generado, no editar a mano)
  settings/     SettingsContext.tsx (ajustes), PieceSetContext.tsx (set de piezas), reminders.ts (recordatorio diario)
  feedback/     feedback.ts (sonidos y vibración: useFeedback)
  components/   … también Segmented, SettingRow, Circle3D y boardAnimation.ts (cálculo de la animación del tablero)
assets/sounds/  move, capture, correct y wrong (.wav), generados con `npm run build:sounds`
  data/         unidad-1-lo-basico.json, aperturas-v3.json, bots.json, lessonTypes.ts, units.ts, openings.ts, bots.ts
  engine/       Stockfish en un WebView: EngineView, engineHtml, uci (ver motor.md)
  bots/         book.ts (libro de aperturas), brain.ts (cómo elige su jugada cada bot)
  chess/        notation.ts (notación en español)
  lesson/       LessonPlayer, steps/ExplainStep, MoveStep, QuizStep, SelectSquaresStep, LineStep
  progress/     progressStore.ts (datos y reglas), ProgressContext.tsx (useProgress), path.ts (estados de la ruta)
  screens/      HomeScreen, FreePlayScreen, LessonResultScreen, ComingSoonScreen, OpeningsScreen, OpeningDetailScreen,
                BotsScreen, BotDetailScreen, GameScreen, ProfileScreen, PieceSetScreen, PuzzlesScreen, PuzzleScreen,
                OnboardingScreen, SettingsScreen, CreditsScreen
```

---

## 6. Componentes nuevos del sistema de diseño

Se agregan a `design.md` cuando se construyan:
- **Barra de pestañas:** fondo `surface`, ícono activo en `primary`, inactivos en `textMuted`. Construida (hito 2).
- **Nodo de lección:** círculo de 64px con borde inferior 3D; completado `primary`, actual con animación de pulso suave, bloqueado `surfaceRaised`. Construido (hito 2).
- **Panel de feedback:** tarjeta inferior que sube con animación corta (150 ms). Construido sin animación (hito 1).
- **Chip de estado** (nivel del bot, color de la apertura). Construido (hito 3).
- **Ícono de racha y de XP** en `gold`. Construido (hito 2).

---

## 7. Orden de construcción

| Hito | Contenido | Resultado visible |
|---|---|---|
| 1 | Reproductor de lección: pasos `explain`, `move`, `quiz`, `select_squares` con la Unidad 1 · hecho | Puedes completar la lección 1 |
| 2 | Guardado local + 6 pestañas + ruta de Aprender, racha, meta diaria y repaso de errores · hecho | Progreso que se mantiene |
| 3 | Paso `line` + pestaña Aperturas · hecho | Estudiar los 28 cursos de aperturas |
| 4 | Pestaña Bots con Stockfish limitado por nivel · hecho | Partidas contra bots y práctica de aperturas |
| 5 | Puzzles: 50.000 de la base de Lichess (CC0), puzzle del día y práctica por nivel y tema · hecho | Puzzle del día |
| 6 | Perfil, Ajustes, Créditos, bienvenida, sonidos, vibración, recordatorio, temas de tablero y animación de jugadas · hecho, falta probar en el celular | App completa y pulida |
| 7 | Prueba cerrada en Google Play (12 testers, 14 días) | Publicación |

---

## 8. Enganches previstos para monetización (sin implementar)

- Un componente `AdSlot` vacío al final del Resultado de lección.
- Un archivo `limits.ts` con las reglas de uso gratuito (hoy, sin límites).
- Un servicio `entitlements` con `isPremium()` que hoy siempre devuelve `false`.
- Una pantalla "Premium" oculta, que se activa cuando se defina qué incluye.

---

## 9. Decisiones

Tomadas:
- Pestañas: las 5 del plan más Análisis (tablero libre), 6 en total.
- Navegación: Expo Router.
- Al fallar en una lección: pista y reintento al instante, sin vidas. El paso fallado se guarda para "Repasar errores".
- Ruta de Aprender: dentro de una unidad, las lecciones se desbloquean de a una; todas las unidades están abiertas desde el inicio (`LOCK_LESSONS`, se puede apagar).
- Nombres de los bots: los 10 de `bots.md`.

Pendientes:
- Avatares de los bots.
- ~~Fuente de los puzzles y su licencia.~~ Decidido: base abierta de Lichess, CC0 (ver `puzzles.md`).
- Piezas definitivas del tablero.
