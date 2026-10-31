# Personajes: los bots enseñan y avisan

Proyecto 2 de 3. Depende de Racha y notificaciones (Pull Request 15). Después viene Monetización.

## Por qué

Los 10 bots tienen personalidad y avatar, pero solo aparecen al jugar contra ellos. El usuario quiere que todos tengan protagonismo: que sean ellos quienes explican las lecciones, con caras que cambian mientras enseñan, y que también escriban las notificaciones.

Éxito: una lección se siente como una clase con un personaje reconocible, y los 10 bots enseñan algo.

## Objetivos

1. Cada lección de la ruta y de aperturas tiene un bot profesor.
2. El profesor aparece con la opción A elegida por el usuario: cara chica al lado de un globo de diálogo, debajo del tablero.
3. La cara cambia entre 4 expresiones según lo que pasa en la lección.
4. Cada bot tiene su voz en la apertura y el cierre de la lección y en las notificaciones.

## Fuera de alcance

- Reescribir los textos de las 153 lecciones: los pasos conservan su contenido.
- Voces grabadas, animación de la cara o personajes nuevos.
- La cara dentro de la notificación: por ahora, solo el nombre.
- El gato de la billetera (proyecto 3).

## Lo que no puede pasar

- El tablero no se mueve ni se achica: sigue arriba y en la misma posición.
- Una imagen faltante no puede romper una lección.
- La app no puede crecer de forma desmedida por las imágenes.
- Los personajes no retan ni hacen sentir mal por un error: dan pistas, como hoy, con su estilo.
- El contenido de ajedrez no cambia: cada explicación sigue siendo correcta.

## Quién enseña qué

Los 10 bots enseñan. La asignación vive en un archivo de datos. *(Decisión de diseño; el usuario puede pedir cambios.)*

### Ruta de Aprender

| Unidad | Lecciones | Bot |
|---|---|---|
| 1 | El tablero y las coordenadas, La torre, El alfil, La dama, El rey, El caballo, El peón, El jaque, Jaque mate en una jugada | Pipo |
| 1 | Proteger piezas, Intercambios, Salir del jaque | Lola |
| 2 | El enroque, Coronar bien, Cómo se escriben las jugadas | Don Ramiro |
| 2 | La captura al paso | Tomás |
| 2 | El rey ahogado, Otras tablas | Lola |
| 3 | La horquilla, La clavada, Eliminar al defensor, La desviación, Antes de mover | Sofía |
| 3 | El ataque a la descubierta, Jaque doble y ataque doble | Valentina |
| 3 | Mate del pasillo y mate del pastor | Tomás |
| 4 | Principios de apertura, Errores típicos de apertura | Don Ramiro |
| 4 | Estructura de peones, Columnas abiertas y torres activas, La pareja de alfiles | Camila |
| 4 | Casillas débiles y puestos avanzados | Bruno |
| 5 | Todas | Maestro Ivo |
| 6 | Zugzwang, Repaso final | Ada |
| 6 | Profilaxis | Bruno |
| 6 | Sacrificio de calidad | Camila |

### Aperturas

| Bot | Cursos |
|---|---|
| Pipo | italian |
| Lola | london, scandinavian |
| Tomás | vienna, albin |
| Valentina | sicilian, kings-gambit, danish, bdg |
| Don Ramiro | scotch, french, petrov, alapin |
| Camila | english, catalan, queens-gambit, queens-gambit-declined, modern |
| Bruno | caro-kann, kia, pirc |
| Sofía | evans, kings-indian, dragon |
| Maestro Ivo | ruy-lopez, nimzo-indian, rossolimo, queens-gambit-accepted |

Ada no enseña aperturas: su protagonismo está en cerrar la ruta.

## Expresiones

| Nombre | Archivo | Cuándo |
|---|---|---|
| Explica | `explica` | Pasos `explain` y texto de cada jugada guiada |
| Piensa | `piensa` | Esperando la respuesta del usuario |
| Acertaste | `acierto` | Paso resuelto, resultado sin errores |
| Te da una pista | `pista` | Jugada o respuesta equivocada |

- Archivos: `assets/bots/expresiones/<id>-<expresion>.webp`.
- Son 40 imágenes de 256 × 256 píxeles. Las originales de ChatGPT se conservan aparte, y las finales se reducen con un script (`npm run build:avatars`), como los demás recursos generados.
- Si falta una expresión, se usa el avatar actual del bot. Así el código se puede publicar antes de tener todas las imágenes.
- Se registran en un mapa junto a `AVATARS`, porque React Native necesita rutas fijas en `require`.

## En la lección

- Componente nuevo `TeacherBubble` con cara de 52 px y globo de diálogo, como en la opción A del boceto.
- El texto de explicación o consigna de cada paso pasa a verse dentro del globo. Las opciones, botones y casillas siguen debajo.
- Los paneles de acierto y error siguen igual. Al abrirse, la cara cambia.
- Primer paso de cada lección: arriba del globo aparece la frase de bienvenida del bot, con su nombre. No suma un paso, para no romper los avances guardados.
- Pantalla de resultado: cara `acierto` y frase de cierre. En un repaso de errores también aparece el profesor de la lección.
- `practice` y `line` siguen mostrando su estado debajo del tablero, dentro del mismo diseño.
- El tamaño de texto respeta la accesibilidad del teléfono, y el globo se lee como un solo bloque con el nombre del bot.

## Voces

Se agregan a cada bot en `docs/bots.json` y su copia de la app:

```json
"teaching": {
  "welcome": ["...", "...", "..."],
  "close": ["...", "...", "..."],
  "reminder": {
    "risk": "...{n}...",
    "recovery": "...",
    "general": "..."
  }
}
```

- Tres frases de bienvenida y tres de cierre por bot, en español, sin exclamaciones y en su personalidad (`docs/bots.md`).
- Se eligen al azar, sin repetir la anterior si es fácil. Las frases no llevan datos de ajedrez.
- Los textos los redacta quien construye el proyecto y el usuario los revisa antes de unir.

## Notificaciones

- Cada día escribe un bot distinto, en orden fijo según la fecha. Todos aparecen por turnos.
- Título: nombre del bot. Cuerpo: su frase del estado (`risk`, `recovery` o `general`).
- El aviso de recuperación debe seguir diciendo que hacen falta las tres acciones. El de racha en juego debe incluir los días. El resto de las reglas del proyecto 1 no cambia.
- `planReminders` sigue siendo pura y sin imports de React Native, con pruebas.

## Arte con ChatGPT

El usuario genera las imágenes. Por cada bot, partir de su avatar actual (`assets/bots/<id>.webp`) y pedir las cuatro expresiones:

> Usa esta imagen como referencia exacta del personaje. Mantén el mismo personaje, ropa, colores, estilo, encuadre y fondo transparente. Cambia solo la expresión a: [explicando con entusiasmo y calma / pensando, con la mirada hacia un costado / muy contento por un acierto / amable y atento, como quien da una pista, nunca enojado]. Formato cuadrado.

Las imágenes se mencionan en Créditos, igual que los avatares.

## Comprobaciones

- Prueba que recorre todas las lecciones y cursos: cada una tiene profesor y cada bot aparece al menos una vez.
- Prueba de `planReminders`: rotación de bots y textos por estado.
- Prueba de respaldo: una expresión faltante devuelve el avatar.
- Prueba de frases: sin signos de exclamación y con `{n}` en `risk`.
- `npx tsc --noEmit`, `npm test` y `npx expo lint` sin errores nuevos.
- Prueba en el celular: un paso de cada tipo, cambio de expresión, pantalla chica y peso final de la app.
- Actualizar `CLAUDE.md`, `docs/bots.md`, `docs/mapa-de-pantallas.md` y Créditos.

## Queda a criterio de quien lo construya

- Diseño visual exacto del globo, con los colores y fuentes existentes.
- Cómo reducir las imágenes en el script, mientras no sumen dependencias que ralenticen la app.
