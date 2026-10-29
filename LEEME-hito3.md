# Hito 3 · Aperturas

## Cómo probarlo
No hay dependencias nuevas. Inicia el servidor como siempre:
```
cd C:\dev\ajedrez-app
npx expo start -c
```
y abre la app en el celular con Expo Go.

## Qué verás
- **Pestaña Aperturas:**
  - Arriba, un selector **Blancas · 16 / Negras · 12**.
  - Debajo, una tarjeta por apertura: nombre, resumen, barra de progreso (de 4 lecciones) y el estilo de bot que la usa ("Bot tranquilo").
- **Detalle de una apertura** (al tocar una tarjeta):
  - Nombre, con qué color juegas y el progreso.
  - Las 4 lecciones: Idea, Línea principal, Trampas y errores, Repaso. Se abren de a una, igual que en Aprender. Todos los cursos están abiertos desde el inicio.
  - El botón **Practicar contra un bot** avisa que los bots llegan en el hito 4.
- **Lección con una línea de apertura (paso nuevo `line`):**
  - Juegas las jugadas de tu color; el rival responde solo. Si estudias una defensa con negras, el tablero se gira y el rival abre con la primera jugada.
  - **Línea principal (modo guiado):** antes de cada jugada tuya, una tarjeta te dice cuál toca y para qué ("Tu jugada: Af4 · Saca el alfil antes de cerrar la cadena de peones"), y el tablero marca de dónde a dónde va la pieza. Mientras responde el rival, la explicación sigue a la vista. Si te equivocas, la jugada no se hace, el panel rojo te dice cuál era y una flecha la marca en el tablero.
  - **Repaso (modo drill):** sin explicaciones ni ayudas. Si te equivocas, el panel rojo te avisa y vuelves a intentar.
  - El panel rojo de error se va solo a los 3,5 segundos, en todos los tipos de ejercicio.
  - Debajo del tablero ves de quién es el turno y las jugadas hechas ("1. e4 d5 2. exd5 Dxd5").
  - Al terminar la línea: panel verde y **Continuar**.
- Las lecciones de apertura funcionan como las de Aprender: dan XP (20 cada una), suman a la racha y la meta diaria, guardan el avance si sales, y tienen **Repasar errores**.

## Qué probar
1. Aperturas → Blancas → **Sistema Londres** → lección 1. Termínala.
2. Lección 2 (Línea principal): antes de cada jugada tiene que verse "Tu jugada: …" con la explicación, y la pieza marcada; cuando juegan las negras, la explicación no se borra. Juega una jugada equivocada a propósito: aparece el panel rojo con la jugada correcta y una flecha, y el panel se va solo a los pocos segundos. Juega la correcta: el rival responde.
3. Vuelve atrás → Negras → **Defensa Escandinava** → lección 1 y después la 2. El tablero tiene que verse con las negras abajo, y las blancas abren solas con e4.
4. Sal de una lección a mitad de una línea y vuelve a entrar: retomas desde ese paso. Si estabas dentro de una línea, empieza de nuevo desde la primera jugada de la línea.
5. Cuando termines una lección, **Continuar** tiene que volver al detalle de la apertura.

## Cómo está armado
- `src/lesson/steps/LineStep.tsx`: el paso nuevo.
- `src/screens/OpeningsScreen.tsx` y `OpeningDetailScreen.tsx`: la lista y el detalle.
- `src/app/apertura/[id].tsx`: la ruta del detalle.
- `src/data/openings.ts` lee `src/data/aperturas-v3.json`, una copia de la que está en `docs/`. Si corriges una línea, cámbiala en las dos.
- Recorrí las 61 líneas de los 28 cursos con la misma lógica del paso (533 jugadas tuyas y 500 del rival): todas funcionan.
- Revisé todas las líneas con Stockfish (profundidad 20). Corregí el **Gambito Danés**, que enseñaba 7.Ab3, una jugada que pierde; ahora sigue la línea principal 7.Axf7+. El detalle está en `docs/formato-lecciones.md`.

## Limitaciones de esta versión
- El Contragambito Albin termina con desventaja para las negras: la apertura en sí es dudosa. Se decidió dejarlo así, como gambito de trampas.
- "Practicar contra un bot" llega en el hito 4.
- Si sales en medio de una línea, al volver la línea empieza de nuevo: se guarda el paso, no la jugada dentro del paso.
- No se probó en el celular al escribirlo: si ves un error, copia el mensaje y lo corregimos.
