# Plan de implementación · Tarea 32: botón de volver, ficha del curso y fondo

Spec: `docs/superpowers/specs/2026-11-14-aperturas-y-volver-design.md` · Prototipo: `prototipo-curso-apertura.html` · Autor del plan: lingling (14-11-2026), a partir del diseño de opus.

Contexto revisado:
- `AppBackground` dibuja la luz y la viñeta con `Ellipse`; fuera de la viñeta se ve el borde del arco en la esquina.
- Las 11 pantallas usan un `Text` «‹ …» con `styles.back` y claves `*.back`/`*.backLabel`.
- La ficha del curso (`OpeningDetailScreen`) es una columna angosta; la lista de cursos usa tarjetas de texto.
- `botForOpening(courseId)` y los repertorios (tarea 30) dan los bots que juegan cada curso.
- La barra lateral es el `tabBar` de `(tabs)`; las pantallas del Stack no la muestran.

Cada paso termina con `npm test`, `npx expo lint` y `npx tsc --noEmit` en verde, y un commit con autor `Gradus Studio`.

## Paso 1 · Arreglo del fondo (adelantado)

- `AppBackground`: la luz y la viñeta pasan de `Ellipse` a `Rect` a pantalla completa con `RadialGradient` en `objectBoundingBox` y radios mayores a 0,7, de modo que más allá del último punto siga el color final; sin bordes duros. La base sigue con `LinearGradient`.
- Comprobar a 1366 × 768, 1920 × 1080 y 375 × 812 (capturas de las esquinas).
- Commit: «Fondo: luz y viñeta a pantalla completa, sin arcos».

## Paso 2 · BackButton

- `src/components/BackButton.tsx`: círculo 3D de 40 px (`surfaceRaised` con canto de 4 px), chevron blanco de 20, nombre de la pantalla a la que vuelve (16 px, 900, blanco), área de 48 px, hover `#46443F`, pulsado que baja el canto, anillo dorado con teclado y etiqueta `back.to`.
- Reemplazar `styles.back` y las claves `*.back`/`*.backLabel` en las 11 pantallas; una sola clave `back.to` («Volver a {screen}») con el nombre de la pantalla anterior.
- Commit: «Volver: botón 3D con el nombre de la pantalla en las 11 pantallas».

## Paso 3 · Ficha del curso: datos puros y tablero

- `src/openings/courseView.ts` (puro, con pruebas): posición final de la línea principal (`l02`) y sus jugadas en notación, grupos de lecciones (Lo esencial / Variantes y trampas / Repaso final), progreso y siguiente lección, y bots que juegan el curso (`botForOpening`/repertorio).
- `CourseBoard`: tablero de la línea principal con visor ‹ › y notación (reutilizar la lógica del visor de `LineStep` si se puede extraer).
- Commit: «Aperturas: datos de la ficha del curso y tablero de la línea».

## Paso 4 · Ficha del curso (pantalla)

- `OpeningDetailScreen` nueva: `BackButton`, dos columnas en ancha (tablero 440 + datos) y una en el celular; título, idea, caras de los bots, barra, «Continuar/Empezar/Repasar» con la próxima lección y «Practicar contra {bot}» arriba; lecciones agrupadas con estados y monedas.
- La ficha se abre con la barra lateral marcada: mover `apertura/[id]`, `bot/[id]`, `tienda` y `partida` dentro de `(tabs)` con `href: null` o un layout que las muestre con la barra (evaluar en el paso; si no es viable sin duplicar el árbol, anotarlo y dejar la barra como está).
- Commit: «Aperturas: ficha del curso con tablero, bots y lecciones agrupadas».

## Paso 5 · Lista de Aperturas en el celular

- `OpeningsScreen` angosta: cada curso con tablero chico (64 px) de la posición final de su línea principal, nombre, «x de y» con barra y las caras de los bots; selector Blancas/Negras como hoy.
- Commit: «Aperturas: tarjetas con tablero y bots en el celular».

## Paso 6 · Textos

Claves nuevas en los cinco idiomas (de/it/fr con gemma4 si Ollama responde; si no, a mano y anotarlo): `back.to`, grupos de lecciones, «La juegan {bots}», «Practicar contra {bot}», visor, estados y textos de accesibilidad. Reutilizar lo que ya existe.

Commit: «Aperturas y volver: textos en los cinco idiomas».

## Paso 7 · Comprobación y publicación

1. `npm test`, `npx expo lint`, `npx tsc --noEmit`, `npm run build:web`.
2. `npx wrangler dev -c wrangler.local.jsonc --port 8788`, a 1366 y 375 px: el `BackButton` en las 11 pantallas; ficha de un curso sin empezar, a medias y completa; visor al principio y al final; «Practicar contra…»; barra lateral marcada en la ficha; lista de Aperturas del celular; el fondo sin bordes en 1366×768, 1920×1080 y 375×812.
3. Push según «Push a GitHub» y `npx wrangler deploy --name ajedrez-app` (autorizado por el autor el 14-11; pedir confirmación en la sesión si el clasificador lo bloquea).
4. Anotar en la fila 32: commits, versión desplegada y lo que quedó sin prueba visual.
