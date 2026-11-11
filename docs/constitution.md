# Constitución de Gradus

Fecha: 11-11-2026. Estos principios no se negocian dentro de una tarea. Si un cambio choca con uno, se para y se habla antes de seguir.

## C-01 · La app es gratis y sin interrupciones
Gradus no tiene anuncios, vidas, pagos ni compras que condicionen el aprendizaje. Las monedas son del juego y no tienen valor en dinero.

**Se verifica:** no hay SDK de anuncios ni de cobros en `package.json`; ninguna pantalla bloquea contenido por pago.

## C-02 · Anonimato del autor
Ningún archivo, commit, texto público ni metadato lleva el nombre real ni un correo personal. El autor es `Gradus Studio <349628194+GradusStudio@users.noreply.github.com>` y el correo público es `gradusstudioapp@gmail.com`.

**Se verifica:** `git log` y búsqueda de datos personales antes de publicar.

## C-03 · Software libre
El código se publica con GPL v3 o posterior. Lo publicado tiene que corresponder al código del repositorio y a una etiqueta.

**Se verifica:** `LICENSE`, `README.md` y Créditos; la etiqueta apunta al commit desplegado.

## C-04 · El progreso del usuario no se pierde
Todo cambio en `progressStore` sube `PROGRESS_VERSION` y agrega migración. Las claves de AsyncStorage no se renombran (`@ajedrez/...`, `ajedrez:progreso`). Fusionar dos progresos nunca resta monedas ni borra lecciones.

**Se verifica:** pruebas de `progressStore`, `merge` y copia/restauración; un progreso viejo sigue leyéndose.

## C-05 · Lógica pura separada y probada
La lógica que se puede probar sin React Native vive en módulos puros y tiene pruebas con `node:test` (`npm test`). Las pantallas no guardan reglas.

**Se verifica:** `npm test` y revisión de que el módulo no importa React Native.

## C-06 · Cinco idiomas completos
Todo texto de pantalla y contenido existe en es, en, de, it y fr. Nada de español fijo en las pantallas (`noHardcoded`). Las traducciones de de, it y fr se hacen con gemma4 vía Ollama y se revisan a mano; se dice que no hay revisión de nativos.

**Se verifica:** `npm test` (i18n, validate, noHardcoded) y que un texto corregido se corrige en los cinco idiomas.

## C-07 · Contenido verificado, nada inventado
Las posiciones son legales y las soluciones se comprueban con chess.js; las posiciones dudosas se revisan con Stockfish. No se inventan estadísticas, testimonios, cifras, nombres ni funciones.

**Se verifica:** validación de la lección o del tema y revisión con el motor antes de publicar.

## C-08 · Privacidad por defecto
La app no pide cuenta, correo ni nombre. El servidor de sincronización guarda solo el hash de la llave, el progreso, la versión y la fecha. Sin analítica con cookies ni rastreo.

**Se verifica:** esquema de D1, política de privacidad y revisión de las peticiones de red.

## C-09 · Se puede usar de verdad
Cada control hace lo que promete; hay estados de vacío, carga y error; el contraste cumple WCAG AA; la web se usa con teclado y con lector de pantalla; en el celular los toques miden al menos 44 px.

**Se verifica:** recorrido manual en navegador y dispositivo, y pruebas de contraste.

## C-10 · No romper lo que ya funciona
Antes de dar algo por terminado: `npx tsc --noEmit`, `npx expo lint` y `npm test`; probar el flujo en la web y en el celular cuando corresponde. Nunca `git push --all`: se sube solo `main` después de revisar.

**Se verifica:** salida de los tres comandos, prueba del flujo y `git status`/`git log` antes de subir.

## Cómo se usa

1. Una spec nueva cita los principios que toca.
2. La clarificación (QA) busca choques con esta constitución.
3. La validación final recorre los principios aplicables y dice si se cumplen.
4. Si un cambio obliga a romper un principio, se discute y se actualiza la constitución a propósito, nunca en silencio.
