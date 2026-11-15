# Ficha del curso de apertura, botón de volver y arreglo del fondo

Fecha: 14-11-2026 · Diseño: opus · Pedido del autor: «sigamos con la pantalla de aperturas» y «revisa que los botones de volver se vean más claramente». **Referencia visual:** `prototipo-curso-apertura.html` (raíz del repo, fuera de git).

Revisado en graduschess.com (14-11):
- **Aperturas** en pantalla ancha ya tiene la corona con el tablero de progreso (tarea 11) y funciona bien; no cambia.
- **La ficha de cada curso** (`/apertura/<id>`, `OpeningDetailScreen`) es una columna angosta en el medio de la pantalla, sin barra lateral ni tablero: nombre, dos etiquetas («Juegas con blancas», «Bot equilibrado»), la idea, una barra, trece filas iguales con «20» monedas cada una y, al final de todo, «Practicar contra un bot».
- **Volver** es un texto chico y gris («‹ Aperturas», 15 px, `textMuted`) en 11 pantallas: se pierde.
- **Fondo (defecto de la tarea 27):** en la esquina superior derecha se ve el borde duro de un arco. `AppBackground` dibuja la luz y la viñeta como `Ellipse`; fuera de la elipse no hay viñeta y queda la base más clara.

## 1. Botón de volver

Componente nuevo `BackButton` (`src/components/BackButton.tsx`) para todas las pantallas que hoy usan el texto «‹ …» (Ficha del bot, Partidas contra bots, Créditos, Análisis libre, Importar partida, Ficha del curso, Privacidad, Revisión, Ajustes, Tienda, Términos y las que se sumen):
- **Círculo 3D** de 40 px (`surfaceRaised` con canto `surfaceShadow` de 4 px, como `Circle3D`) con un **chevron blanco** de 20 px, y al lado **el nombre de la pantalla a la que vuelve** («Aperturas», «Bots», «Perfil») en 16 px, 900, **blanco**.
- Área táctil de 48 px de alto; al pasar el mouse el círculo se aclara (`#46443F`); al apretar baja la mitad del canto; anillo dorado con el teclado.
- Etiqueta de accesibilidad: «Volver a {pantalla}».
- **Siempre arriba a la izquierda**, alineado con el contenido, y con el mismo margen en todas las pantallas. En el celular, igual (el chevron y el nombre caben).
- Reemplaza `styles.back` y las claves `*.back` / `*.backLabel` por una sola forma: `back.to` («Volver a {screen}»).

## 2. Ficha del curso de apertura (pantalla ancha)

**Con la barra lateral:** las pantallas que se abren desde una pestaña (ficha del curso, ficha del bot, tienda, partidas) muestran la barra lateral de la pantalla ancha, con su pestaña marcada (Aperturas, Bots…). Hoy desaparece y la pantalla queda flotando. Arriba, el `BackButton`.

Dos columnas:
- **Izquierda (440 px): el tablero de la línea principal.** Abre en la posición final de la línea principal (la del paso `line` de `l02`), con la última jugada resaltada. Debajo, un **visor**: flechas ‹ › (círculos 3D de 44 px) y la línea completa en notación («1.e4 e5 2.Cf3 Cc6…»), con la jugada actual resaltada en dorado y las siguientes atenuadas. Las piezas se deslizan al avanzar. Se ve la apertura antes de estudiarla.
- **Derecha:**
  - «APERTURA · JUEGAS CON BLANCAS» (12 px, verde), el nombre (36 px) y la idea (17 px).
  - **Quién la juega:** las caras de los bots que la tienen en su repertorio (superpuestas, 36 px) y «La juegan **Pipo, Tomás, Don Ramiro** y Ada». Reemplaza la etiqueta «Bot equilibrado», que no decía quién.
  - Barra de progreso con «2 de 13 lecciones».
  - Dos botones: **«Continuar»** (primario) con la lección siguiente en una segunda línea («Lección 3 · Ataque Fegatello (Hígado Frito)»), o «Empezar» si no hay ninguna hecha, o «Repasar» si están todas; y **«Practicar contra {bot}»** (secundario, con la cara del bot que da `botForOpening`). Arriba, no al final de la lista.
  - **Lecciones agrupadas:** «Lo esencial» (la idea y la línea principal), «Variantes y trampas» (las guías) y «Repaso final», cada grupo con su «2 de 2». Cada fila: círculo con el número (✓ si está hecha, verde con halo si es la siguiente, gris si está cerrada), título, «Siguiente lección» debajo de la actual, y a la derecha «+20» en dorado si falta o «hecha» en gris. Tocar una fila abierta empieza esa lección.

## 3. Ficha del curso (celular) y lista de Aperturas (celular)

- **Ficha:** una columna con el `BackButton`, el tablero a lo ancho con el visor, nombre, quién la juega, los dos botones y las lecciones agrupadas.
- **Lista de Aperturas** (pantalla angosta): cada curso como tarjeta con un **tablero chico** (64 px) de la posición final de su línea principal, el nombre, «2 de 13» con barra y las caras de los bots que la juegan. Selector Blancas / Negras arriba, como hoy.

## 4. Arreglo del fondo

En `AppBackground`, la luz y la viñeta tienen que cubrir toda la pantalla: dibujarlas como `Rect` a pantalla completa con el `RadialGradient` (centro y radio en `userSpaceOnUse`, o `objectBoundingBox` con `r` mayor a 0,7), de modo que más allá del último punto del degradé siga su color final. Sin `Ellipse`. Comprobar a 1366 × 768, 1920 × 1080 y 375 × 812 que no se ve ningún borde.

## Accesibilidad y textos

- Visor: los botones ‹ › con «Jugada anterior» / «Jugada siguiente»; el tablero con la posición en texto («Posición después de 9.Cbd2»).
- Las caras de los bots son decorativas; el texto «La juegan…» lleva la información.
- Textos de tú, sin exclamaciones, en los cinco idiomas (de, it y fr con gemma4).

## Cómo se comprueba

- `npm test`, `npx expo lint`, `npx tsc --noEmit`, `noHardcoded`.
- Navegador (`web-compilada`) a 1366 y 375 px: el `BackButton` en las 11 pantallas; ficha de un curso sin empezar, a medias y completo; visor hasta el principio y el final; «Practicar contra…»; barra lateral marcada en la ficha; lista de Aperturas en el celular; el fondo sin bordes en las esquinas.
