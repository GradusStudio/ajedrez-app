# Poses de cuerpo entero: ficha por personaje

Fecha: 15-11-2026 · Diseño: opus · Para la tarea 47 de `agentes.md` (las imágenes las genera la sesión `sonnet` con ChatGPT; la integración ya está hecha). Completa la sección 3 de `2026-11-14-rediseno-de-bots-design.md`.

## Reglas comunes (las diez fichas)

- **Referencia:** subir siempre el cuerpo neutro del bot (`assets/bots/cuerpo/<id>.webp`, pasado a PNG) y pedir «same character, same outfit, same colors and proportions as the reference image». Nunca generar desde cero.
- **Prompt común**, antes de la descripción: `anime illustration, soft cel shading, clean thin brown lineart, cute, full body, standing, three-quarter view facing left, whole figure visible from head to feet, centered, plain pure <FONDO> background, no shadow on the floor`.
- **Fondo:** verde `#00FF00`, salvo los bots que llevan verde en la ropa o en el cuerpo, que van en magenta `#FF00FF` (columna «Fondo»). Recorte: `node scripts/croma.js <entrada> <salida> 768 1024` (`MAG=1` para magenta).
- **Negativo común:** `weapon, gun, military, camouflage, text, logo, watermark, signature, extra limbs, extra fingers, realistic fur, photorealistic, background scenery, cropped head, cropped feet, floor shadow, blurry`.
- **Encuadre:** la misma escala y la misma línea de pies que el neutro, para que el personaje no salte al cambiar de pose. Las manos o alas pueden salir un poco del contorno del neutro, pero la cabeza queda a la misma altura (salvo en `festejo`, donde puede saltar).
- **Tono:** amable siempre. `lamento` es una derrota simpática (sonrisa resignada), nunca tristeza ni enojo. `festejo` es alegría, nunca burla.
- **Revisión de cada imagen antes de guardarla:** el atuendo y los colores coinciden con el neutro, cinco dedos (o el ala o la pata correcta), sin objetos de más, sin texto, y los pies enteros.

## Las seis poses (qué expresa cada una)

| Pose | Cuándo se ve | Qué tiene que transmitir |
|---|---|---|
| `explica` | El profesor habla en la lección y en la revisión | Cuenta algo, con una mano (o un ala) abierta hacia la izquierda, hacia el globo. Boca abierta, hablando. |
| `piensa` | Mientras el usuario resuelve | Mano en el mentón, mirada hacia arriba, cabeza un poco inclinada. |
| `acierto` | El usuario acertó | Sonrisa grande y ojos felices, con un gesto positivo propio del personaje. |
| `pista` | El usuario se equivocó y hay pista | «Atención»: índice (o pluma) arriba, cejas levantadas, gesto de ayuda, no de reto. |
| `festejo` | El bot ganó la partida | Contento: brazos arriba o un saltito, a la medida de su personalidad. |
| `lamento` | El usuario le ganó | Hombros caídos, mano en la frente o en la nuca, sonrisa resignada. Reconoce la derrota con buena cara. |

## Fichas

Cada ficha repite la descripción fija (en inglés, como en la sección 3) y adapta la frase de cada pose a la personalidad del bot (`tagline` y `trait` de `bots.json`). La frase va después de la descripción.

### Pipo · el curioso · fondo magenta
Descripción: `young brown owl, round orange-brown feathers, big round glasses, green bucket explorer hat, red neckerchief, small backpack straps`.
- `explica`: `one wing open toward the left as if showing something, beak open talking, eager`
- `piensa`: `wing tip on chin, looking up, head tilted, curious`
- `acierto`: `big happy smile, eyes closed in joy, both wings up in a small cheer`
- `pista`: `one wing feather raised like an index finger, eyebrows up, friendly "look here" gesture`
- `festejo`: `small happy jump with both wings spread wide, hat bouncing`
- `lamento`: `wing scratching the back of the head, embarrassed sheepish smile, glasses slightly crooked`

### Lola · la prudente · fondo verde
Descripción: `calico cat (white, orange and brown patches), big round brown glasses, red neckerchief, brown satchel strap`.
- `explica`: `one paw open toward the left, calm gentle explanation, small smile`
- `piensa`: `paw on chin, eyes half closed, careful and patient`
- `acierto`: `soft happy smile, paws together near the chest, tail curled up`
- `pista`: `one paw raised with the index claw up, kind warning look over her glasses`
- `festejo`: `quiet satisfied smile, paws clasped, tail swishing, modest celebration`
- `lamento`: `paw on cheek, gentle resigned smile, ears slightly down`

### Tomás · el tramposo · fondo verde
Descripción: `raccoon with dark eye mask, sly grin, black hoodie with red lining and drawstrings`.
- `explica`: `one hand open toward the left, sly grin, telling a secret`
- `piensa`: `hand on chin, eyes narrowed, scheming smirk`
- `acierto`: `surprised impressed grin, thumbs up`
- `pista`: `index finger raised next to his face, winking, "here's a trick" look`
- `festejo`: `rubbing his hands together, mischievous wide grin, one foot tapping`
- `lamento`: `hand on the forehead, laughing at himself, "you caught me" grin`

### Valentina · la atacante · fondo verde
Descripción: `grey wolf girl, confident smirk, racing driver jacket (red and white leather with stripes and a number patch), racing goggles pushed up on the forehead, fingerless driving gloves`.
- `explica`: `one gloved hand pointing forward to the left, energetic, confident smile`
- `piensa`: `arms crossed, one hand on chin, focused competitive look`
- `acierto`: `fist pump, big confident grin`
- `pista`: `index finger raised, goggles on forehead, "watch this" look, one eyebrow up`
- `festejo`: `both fists raised high like winning a race, goggles shining, big grin`
- `lamento`: `hand running through her hair, good-sport smile, shoulders relaxed`

### Don Ramiro · el profesor · fondo verde
Descripción: `elderly great horned owl, fluffy brown and cream feathers, white eyebrow tufts, round gold-rimmed glasses, brown tweed jacket with elbow patch, burgundy vest, red bow tie`.
- `explica`: `one wing open toward the left like a teacher at the blackboard, beak open talking, warm`
- `piensa`: `wing on chin, looking up over his glasses, thoughtful`
- `acierto`: `proud warm smile, small applause with the wing tips`
- `pista`: `one wing feather raised like a teacher's index finger, eyebrows up, kind`
- `festejo`: `adjusting his bow tie with a proud satisfied smile, chest out`
- `lamento`: `taking off his glasses and smiling, slight bow of respect`

### Camila · la estratega · fondo magenta (lleva oliva)
Descripción: `red fox girl, long wavy orange hair, explorer outfit (olive shirt, leather straps, compass badge), rolled map`.
- `explica`: `holding the rolled map in one hand, other hand open toward the left, explaining a plan`
- `piensa`: `looking at the open map, finger on chin, calculating`
- `acierto`: `bright smile, thumbs up with the map under her arm`
- `pista`: `index finger raised, pointing to the compass badge, "check your direction" look`
- `festejo`: `map held up proudly in one hand, confident smile`
- `lamento`: `rolling up her map with a calm smile, shrug, "well played"`

### Bruno · el muro · fondo magenta (es verde)
Descripción: `sturdy green turtle, calm frown, heavy brown shell, simple bronze chest plate with a shield emblem`.
- `explica`: `one hand open toward the left, calm and steady, slight smile`
- `piensa`: `hand on chin, slow patient look, eyes half closed`
- `acierto`: `rare small smile, nod, thumbs up`
- `pista`: `index finger raised, serious but kind look, "be careful" gesture`
- `festejo`: `arms crossed, satisfied calm smile, standing firm like a wall`
- `lamento`: `scratching his head, small honest smile, shoulders down`

### Sofía · la táctica · fondo verde
Descripción: `red panda girl, sharp clever eyes, wavy auburn hair, detective outfit: tan trench coat with turned-up collar, short brown deerstalker hat, holding a magnifying glass`.
- `explica`: `magnifying glass in one hand, other hand open toward the left, explaining a clue`
- `piensa`: `looking through the magnifying glass, other hand on chin`
- `acierto`: `clever smile, snapping her fingers, "exactly"`
- `pista`: `index finger raised, magnifying glass near her face, "look closer" expression`
- `festejo`: `tipping her deerstalker hat, confident smile, case closed`
- `lamento`: `lowering the magnifying glass, impressed smile, "you found it first"`

### Maestro Ivo · el finalista · fondo verde
Descripción: `red-crowned crane, white feathers with black neck, calm wise eyes, wide straw hat with red tassel, dark red kimono-style robe`.
- `explica`: `one wing open toward the left in a calm teaching gesture, serene`
- `piensa`: `wing tip on chin, eyes closed, meditating`
- `acierto`: `serene smile, slight respectful nod, wings together`
- `pista`: `one wing feather raised, calm attentive look`
- `festejo`: `graceful bow with a quiet smile, wings folded`
- `lamento`: `respectful bow to the opponent, calm smile`

### Ada · la máquina · fondo verde (las luces son cian: si el recorte las come, usar magenta)
Descripción: `robot cat, white and silver panels, glowing cyan eyes and ear lights, headphones, red scarf`.
- `explica`: `one paw open toward the left, cyan eyes bright, small display-like smile`
- `piensa`: `paw on chin, eye lights blinking, headphones glowing, processing`
- `acierto`: `happy curved eye lights, thumbs up`
- `pista`: `index claw raised, ear lights blinking, helpful alert pose`
- `festejo`: `both paws up, eye lights shaped like happy arcs, scarf fluttering`
- `lamento`: `paw on the back of the head, eye lights dimmed in a sheepish smile`

## Orden y control

1. **Pipo** (en curso): las seis poses → hoja de contacto en «Gradus - Poses de cuerpo entero» → aprobación del autor.
2. Con Pipo aprobado, de a un bot por vez, en este orden: **Don Ramiro, Lola, Tomás, Valentina, Camila, Bruno, Sofía, Maestro Ivo, Ada** (primero los profesores de las unidades que más se ven). Una hoja de contacto por bot en la misma nota; el autor puede aprobar de a varios.
3. Lo aprobado va a `assets/fuente/cuerpo/<id>-<pose>.png` y se corre `npm run build:avatars`. Lingling (o quien esté libre) revisa en el navegador que cada pose aparezca en su lugar y publica.
