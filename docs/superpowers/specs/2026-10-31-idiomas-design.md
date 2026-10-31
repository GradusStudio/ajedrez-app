# Idiomas: Gradus en inglés, alemán, italiano y francés

## Por qué

El usuario quiere llegar a países europeos. Hoy toda la app está en español y no tiene sistema de idiomas. Se hace antes de la prueba cerrada, para que las personas de esa prueba ayuden a detectar errores de traducción.

Éxito: alguien con el teléfono en alemán, por ejemplo, abre Gradus y usa todo en alemán, desde la bienvenida hasta las notificaciones, sin encontrar texto en español.

## Objetivos

1. La app funciona en español, inglés, alemán, italiano y francés.
2. Al abrirse por primera vez usa el idioma del teléfono. Si no es uno de los cinco, usa inglés. *(Decisión de quien diseña.)*
3. El idioma se puede cambiar en Ajustes.
4. Se traduce todo lo que ve el usuario.

## Qué se traduce

- Textos de pantallas, botones, avisos de error y bienvenida.
- 41 lecciones de la ruta y 28 cursos de aperturas: títulos, resúmenes, textos, consignas, opciones, pistas y explicaciones. Unas 19.200 palabras.
- Bots: frases de `lines` y `teaching`, descripciones y datos visibles en su ficha. Unas 1.300 palabras. Los nombres no cambian.
- Notificaciones (`planReminders`).
- Temas de puzzles.
- Créditos. El aviso de licencia sigue en inglés o español según corresponda, sin alterar textos legales de terceros.
- Ficha de Google Play en los cinco idiomas: se deja el texto en `docs/tienda/`, para pegarlo al crear la ficha.

## Fuera de alcance

- Otros idiomas, y un cambio de idioma por lección.
- Traducción humana profesional.
- Un formulario para reportar errores dentro de la app: las personas de la prueba cerrada avisan al usuario directamente.
- Cambiar el contenido de ajedrez: posiciones, jugadas y soluciones son los mismos en todos los idiomas.

## Lo que no puede pasar

- Un texto faltante no rompe la app: se ve en español.
- Cambiar de idioma no toca el progreso guardado. Las claves de AsyncStorage y los ids de lecciones y pasos no cambian, y no sube la `version` de `Progress`.
- Las posiciones, soluciones y `answer` de los quiz siguen siendo únicos para todos los idiomas: una traducción solo reemplaza texto. El orden de las `options` no cambia.
- La app no crece de forma desmedida: los idiomas no elegidos pueden viajar en la app, pero se cargan solo cuando hacen falta.
- La explicación traducida no cambia lo que enseña. Una jugada nombrada en el texto es la misma jugada.

## Cómo funciona

*Decisiones de quien diseña; el usuario no las eligió.*

### Alcance de la entrega

- Este proyecto incluye toda la traducción, no solo la preparación: los cuatro idiomas completos.
- Se trabaja por etapas: primero la preparación, con la app en español, y después un idioma por vez. La app funciona en cada etapa.
- Un idioma aparece en Ajustes y en la elección automática solo cuando está completo. Si todavía no lo está, se usa inglés o español según lo que exista.
- El cambio de idioma se aplica en el momento, sin reiniciar, y reprograma las notificaciones (`useReminderSync`).
- El nombre de la app es «Gradus» en todos los idiomas. Los nombres de canales de notificación también se traducen. Los textos propios de Android, como el permiso de notificaciones, los pone el sistema.

### Elección del idioma

- `expo-localization` lee el idioma del teléfono. Es la única dependencia nueva, y funciona en Expo Go.
- `Settings` suma `language: 'auto' | 'es' | 'en' | 'de' | 'it' | 'fr'`, con valor inicial `auto`. Un ajuste guardado sin este campo se lee como `auto`.
- Pantalla de Ajustes: fila «Idioma», con «Automático» y los cinco idiomas, cada uno escrito en su propio idioma.

### Textos de pantallas

- `src/i18n/` con un archivo por idioma, y una función `t('clave', { n: 5 })` que se usa con un hook `useI18n()`. Sin librería externa.
- `es.ts` es la referencia: define las claves. Los demás idiomas tienen el mismo tipo, así que TypeScript avisa si falta una clave.
- El plural se resuelve con dos claves cuando hace falta (`n === 1`). Números con el `toLocaleString` del idioma elegido, en lugar del `'es'` fijo.
- Los módulos puros siguen sin React Native. `planReminders` recibe el idioma por parámetro.

### Contenido de lecciones, aperturas y bots

- El JSON actual sigue siendo el español y la única fuente de posiciones y soluciones.
- Cada idioma tiene archivos con solo texto, por id de paso o de lección: `src/data/i18n/<idioma>/unidad-1.json`, `aperturas.json` y `bots.json`. Los campos conservan el nombre original. Lo que está en listas sin id, como `options` o las explicaciones de cada jugada de un paso `line`, se guarda como lista en el mismo orden, con igual cantidad de elementos.
- Una función pura aplica la traducción sobre el contenido español. Lo que no esté traducido queda en español.
- `findLesson`, `units`, `openings` y `bots` entregan el contenido del idioma elegido, sin que cada pantalla lo sepa.

### Notación

- `Notation` pasa de `'es' | 'en'` a `'es' | 'en' | 'de' | 'it' | 'fr'`.

| Idioma | Rey | Dama | Torre | Alfil | Caballo |
|---|---|---|---|---|---|
| es | R | D | T | A | C |
| en | K | Q | R | B | N |
| de | K | D | T | L | S |
| it | R | D | T | A | C |
| fr | R | D | T | F | C |

- El ajuste guardado pasa a ser `notation: 'auto' | 'en'`. `auto` sigue el idioma; `en` fuerza la inglesa, como hoy. Un `'es'` guardado se lee como `auto`, porque no se distingue de quien nunca tocó el ajuste, y un `'en'` guardado se conserva. Ajustes ofrece «Automática» e «Inglesa». Los dos valores se resuelven a la tabla de arriba antes de llegar a `notation.ts`.
- El ajuste cambia las jugadas que la app genera: partidas, análisis y líneas. Los textos escritos a mano de las lecciones usan siempre la notación fija de su idioma, igual que hoy el español no cambia con el ajuste. La lección «Cómo se escriben las jugadas» se adapta, no se traduce palabra por palabra.

### Calidad de la traducción

- Traduce quien construye el proyecto, una unidad por vez.
- Primero se escribe un glosario de ajedrez por idioma en `docs/traducciones/`: piezas, jugadas, temas tácticos, nombres oficiales de aperturas. Los nombres de aperturas usan el nombre habitual en cada idioma.
- Tono: `tú` en todos los idiomas que lo permitan (*du* en alemán, *tu* en francés e italiano). Tono cercano, como en español, sin exclamaciones en mensajes del sistema. Cada bot conserva su personalidad.
- Los personajes no retan ni hacen sentir mal por un error, igual que en español.

## Comprobaciones

- Prueba que recorre cada idioma: están todos los ids, ningún texto vacío, ningún id sobrante, mismos marcadores (`{n}`) que el español y misma cantidad de `options`.
- Prueba de aplicar traducción: el `fen`, las soluciones y `answer` quedan idénticos al original, y un texto faltante queda en español.
- Prueba de notación para los cinco idiomas.
- Prueba de elección de idioma, incluido un idioma no admitido y el ajuste viejo sin `language`.
- Prueba de `planReminders` en cada idioma: mismos días, cuerpos no vacíos y recuperación con las tres acciones.
- Prueba automática de jugadas nombradas: se extrae cada jugada escrita en el texto español y en la traducción, se convierten las letras de pieza según la tabla, y deben coincidir. Lo que la prueba no pueda leer con seguridad se revisa a mano.
- Una revisión de cada idioma por una segunda lectura, contra el glosario.
- `npm test`, `npx tsc --noEmit` y `npx expo lint` sin errores nuevos.
- Prueba en el celular: cambiar de idioma, y recorrer una lección, un puzzle, una partida y Ajustes en cada uno.
- Actualizar `CLAUDE.md`, `docs/design.md`, `docs/formato-lecciones.md` y Créditos.

## Riesgos que el usuario aceptó

- La traducción no la revisa una persona antes de la prueba cerrada. Las personas de esa prueba avisan al usuario de lo que vean mal, y se corrige después.
- El usuario no puede revisar todos los idiomas por su cuenta.

## Queda a criterio de quien lo construya

- Nombres exactos de archivos y claves.
- Cómo cargar los idiomas solo cuando hacen falta.
- Orden de trabajo, siempre que la app funcione en español durante todo el proyecto.
