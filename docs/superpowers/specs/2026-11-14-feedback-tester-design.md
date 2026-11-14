# Feedback del primer tester: letra, profesor, consejos, unidades e Inicio

Fecha: 14-11-2026 · Diseño: opus · Fuente: nota del vault `gradus feedback.md` (un amigo del autor probó la versión web en la computadora).

| # | Lo que dijo | Respuesta |
|---|---|---|
| 1 | «Las letras son un poco pequeñas» | Escala de letra más grande en la web de pantalla ancha |
| 2 | «El personaje no se distingue, hacerlo más grande» | Profesor más grande en la lección y en el nuevo Inicio |
| 3 | «Tutoriales explicando conceptos, como tienda o la corona» | Consejos de Pipo la primera vez que se ve cada cosa |
| 4 | «Restringir las lecciones avanzadas si alguien no sabe jugar» | Unidades de a una para el nivel «nuevo», con prueba para saltar |
| 5 | «Una página de inicio; empezar directo en lecciones confunde» | Pestaña **Inicio** nueva, la primera |

**Referencia visual de 2, 3 y 5:** `prototipo-inicio.html` (raíz del repo, fuera de git; ábrelo a 1280 px o más).

## 1. Letra más grande en pantalla ancha (web, 960 px o más)

Decisión del autor: el tester usó la web en la computadora. En el celular no cambia nada.

- **Escala nueva** (solo con `useWideLayout`): texto de lectura 17 px (hoy 14–15), secundario 15 px (hoy 13–14), rótulos chicos 13 px (hoy 11–12), títulos de pantalla 30 px, botones 16 px. **Ningún texto por debajo de 13 px.**
- Hoy los tamaños están escritos a mano en cada estilo (158 usos de 15 px o menos). Propuesta: tokens `type` en `theme.ts` (`caption`, `secondary`, `body`, `button`, `title`, `display`) y una función que, en la web con 960 px o más al cargar, multiplique por la escala de arriba; reemplazar los números sueltos por los tokens, pantalla por pantalla. Lo que dependa del tamaño del tablero (coordenadas, rótulos sobre casillas) no se toca.
- Revisar que nada se corte: botones con `adjustsFontSizeToFit`, la barra lateral (`WideSidebar`, 17 px), las tarjetas de bots y de aperturas en grilla, los globos del profesor y el panel de 380 px de lecciones y puzzles.

## 2. Profesor más grande

- **Lección, pantalla ancha:** la cara del profesor (`TeacherBubble`, hoy `FACE_SIZE = 52`) pasa a **88 px**; el globo, con texto de 17 px. **Celular:** 64 px.
- **Inicio:** 104 px en el saludo (sección 5).
- Con los avatares nuevos (rediseño de bots, en curso) la cara se lee mejor; este cambio no espera a ese.

## 3. Consejos de Pipo (primera vez)

- Un **consejo** es un globo blanco con la cara de Pipo (64 px), un título en negrita (17 px), una o dos frases (16 px) y el botón «Entendido». Lo que explica se ilumina con un borde dorado de 4 px y el resto de la pantalla se oscurece al 55 %. Si hay varios seguidos, abajo a la derecha dice «1 de 2» y «Entendido» pasa al siguiente.
- **Aparece una sola vez**, la primera vez que se ve cada cosa. Se guarda en los ajustes (`seenTips: string[]`, sin tocar `PROGRESS_VERSION`). En Ajustes, «Volver a ver los consejos» los borra.
- Escape o tocar fuera también cierra (cuenta como visto). Con lector de pantalla: el globo es un diálogo con su texto como etiqueta y el foco va al botón.
- **Consejos iniciales** (textos en los cinco idiomas):
  - **Inicio** (primera visita): «Tu próximo paso» (la tarjeta Seguir aprendiendo y el tablero de progreso) y «Racha y monedas».
  - **Corona de Aprender** (pantalla ancha): «Elegí una unidad»: «Girá la corona con las flechas, la rueda del mouse o arrastrando. Tocá la unidad del centro para ver sus lecciones».
  - **Riel del celular:** «Tus lecciones»: «Se abren de a una. El tablero de cada unidad avanza con cada lección que terminás».
  - **Piezas y Tableros** (primera visita a la tienda): «La tienda»: «Las monedas que ganás se gastan acá. Tocá un tablero o un set para verlo y comprarlo».
  - **Primer premio de monedas:** «Monedas»: «Ganaste monedas por resolverlo sin errores. Se juntan arriba, junto a la llama».

## 4. Unidades de a una para quien empieza

Cambia la decisión del 30-10-2026 («las unidades están todas abiertas»), **solo para el nivel `nuevo`** de la bienvenida.

- **Nivel `nuevo`:** la Unidad 1 está abierta; cada unidad siguiente se abre al terminar todas las lecciones de la anterior, o al **aprobar la prueba de esa unidad**. **Niveles `basico` y `casual`:** todo abierto, como hoy.
- **Prueba para saltar:** 6 ejercicios tomados de las lecciones de la unidad anterior (un paso `move`, `line` o `quiz` por lección, empezando por las últimas). Se aprueba con un error como máximo; si no, se puede repetir al instante (la app no tiene vidas). Aprobarla abre la unidad, pero no marca como hechas las lecciones salteadas ni da monedas.
- **Cómo se ve:**
  - En la corona: el gajo de una unidad cerrada lleva un candado chico debajo del número y el color de los vecinos; tocarlo abre igual el riel.
  - En el riel: los nodos en gris con candado, y en lugar de «Empezar», el mensaje «Terminá la Unidad 2 para abrir esta» con el botón **«Hacer la prueba»**.
  - En el riel del celular: la cabecera de la unidad cerrada muestra lo mismo.
- Quien elige `nuevo` y después quiere todo abierto: en Ajustes, «Abrir todas las unidades». Quien ya tenía lecciones hechas en unidades «cerradas» las conserva: una unidad con alguna lección hecha cuenta como abierta.
- Lógica pura en `src/progress/path.ts` (`unitOpen(units, progress, level)`) con pruebas: nuevo sin nada, nuevo con la Unidad 1 completa, nuevo con la prueba aprobada, básico y casual todo abierto, lecciones viejas en una unidad cerrada.

## 5. Pestaña Inicio

Decisión del autor: **pestaña nueva, la primera** (siete en total). Al abrir la app se cae en Inicio; Aprender queda como la ruta (corona o riel).

**Contenido** (pantalla ancha: grilla de dos columnas, la primera de 1,35 fr; celular: todo en columna):
1. **Saludo:** la cara del profesor de la lección en curso (104 px, en pantalla ancha; 72 px en el celular), «Hola de nuevo» (32 px) y una frase que dice qué toca hoy: «Ayer aprendiste a dar jaque. Hoy toca salir del jaque». A la derecha, la racha (con la llama nueva) y las monedas.
2. **Seguir aprendiendo** (tarjeta grande): la lección sugerida (`suggestedLesson`), su unidad y número, el botón «Continuar» y, al lado, el **tablero de progreso** de esa unidad con su leyenda («Jugada 10 de 15»).
3. **Puzzle del día:** tablero chico, quién juega, nivel y «Resolver». Si ya se resolvió: «Resuelto» y la llamada a la práctica.
4. **Tu racha:** días, el estado de hoy y la escalera de la semana.
5. **Bots:** si hay `ongoingGame`, «Partida sin terminar con Tomás · Jugada 14 · te toca a vos» y «Continuar»; si no, el bot recomendado para su nivel y «Jugar».
6. **Aperturas:** el curso empezado más recientemente y su próxima lección; si no hay ninguno, uno recomendado según el nivel.

**Sin progreso** (primera vez): el saludo dice «Empecemos» y la tarjeta grande ofrece la primera lección; las demás tarjetas invitan a probar cada sección. Los consejos de Pipo de Inicio aparecen esta primera vez.

**Pestañas:** el ícono de Inicio es una casa. En el celular, siete pestañas entran en 375 px (53 px cada una): ícono de 24 px y etiqueta de 11 px; si no entra, se deja solo el ícono en la pestaña activa con etiqueta. La ruta nueva es `/` dentro de `(tabs)` y Aprender pasa a `/aprender`; los enlaces viejos a la raíz siguen llevando a Inicio. La portada (`/?portada`) no cambia.

## Orden sugerido

1. **Letra (1)** y **profesor (2)**: chicos y visibles; arreglan lo primero que notó el tester.
2. **Inicio (5)**.
3. **Consejos (3)**: necesitan Inicio y las otras pantallas en su lugar.
4. **Unidades (4)**: lógica y prueba nueva; la parte más grande.

## Cómo se comprueba

- `npm test` (pruebas nuevas de `path.ts` y de los consejos vistos), `npx expo lint`, `npx tsc --noEmit`, `noHardcoded`.
- Navegador (`web-dev`): a 1366 × 768 (letra, profesor, Inicio, consejos, corona con candados) y a 375 px (Inicio en columna, siete pestañas, riel con unidad cerrada). Una cuenta nueva con nivel `nuevo` y otra con `casual`.
- Pedirle al mismo tester que lo pruebe de nuevo.

## 6. Lección en pantalla ancha: profesor de cuerpo entero, globo y botón junto al texto

Segunda tanda del mismo tester: «quedaría mejor el personaje completo con un globo de diálogo» y «el botón de continuar está muy abajo». Hoy, en pantalla ancha, el texto del profesor está arriba a la derecha y «Continuar» en una barra al pie de la pantalla: la vista cruza toda la ventana. **Prototipo:** `prototipo-leccion.html`.

- **Panel de 400 px** a la derecha del tablero (600 px), con la misma altura que el tablero:
  1. Nombre del profesor (15 px, verde).
  2. **Globo blanco** (`#FFFFFF`, texto `#262421` de 19 px, radio 22 px, canto `#C9C6BF` de 5 px) con la cola hacia abajo, apuntando al profesor.
  3. **«Continuar» 30 px debajo del globo**, de todo el ancho del panel (no en la barra del pie). En pasos con jugada, el botón aparece en el mismo lugar cuando corresponde.
  4. **Profesor de cuerpo entero** abajo del panel (unos 190 × 250 px), parado sobre una sombra suave, mirando hacia el globo. Cambia de pose con la expresión (`explica`, `piensa`, `acierto`, `pista`).
- Acierto y error: el aviso reemplaza al globo en el mismo lugar (verde o rojo, como hoy) y el botón queda debajo.
- **Arte:** hace falta una versión de cuerpo entero de cada bot con sus cuatro expresiones (se suma al rediseño de bots). Mientras no exista, se usa el avatar de busto actual a 190 px en el lugar del cuerpo.
- En el celular no cambia: tablero arriba, texto y botón abajo, al alcance del pulgar.
- La misma regla para las demás pantallas con tablero en pantalla ancha (puzzles, quiz, práctica de aperturas): la acción principal va pegada al texto que la pide, dentro del panel.

## 7. Corona pegada al borde

El tester dijo que la rueda «está un poco alejada del borde y se ve rara». En la versión v2 se le había dado aire respecto de la barra lateral; en la app real queda flotando a unos 160 px.

- El **eje** de la corona (la línea vertical del lado recto) **coincide con el borde derecho de la barra lateral**: la media corona sale de la barra, como si girara desde ella. Las flechas siguen en el hueco.
- El encabezado («UNIDAD 1» y el nombre) arranca a 24 px de la barra, sobre la corona.
- El tablero queda centrado en el espacio que sobra a la derecha de la corona.
- En Aperturas, lo mismo (el selector Blancas / Negras va arriba del encabezado, alineado igual).
