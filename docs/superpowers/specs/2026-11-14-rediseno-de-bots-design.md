# Rediseño de los bots con Anima

Fecha: 14-11-2026 · Diseño: opus · Antecedentes y licencias: vault, `Gradus - Rediseño de bots.md`.

## Cambio de rumbo (14-11-2026, tarde)

Tras las pruebas con Anima (amanatsu y WAI-ANIMA con el LoRA Nyaccent, hojas en `prototipo-bots/`), el autor decidió **no rehacer los 10 bots**: el estilo actual (chibi 3D cálido, hecho con ChatGPT) ya es el «amigable» de Gradus. Solo se hace, **en el mismo estilo y con ChatGPT** usando la imagen actual de cada bot como referencia:
- el atuendo nuevo de **Valentina** (piloto de carreras) y **Sofía** (detective), con sus cuatro expresiones: **hecho el 14-11-2026**, archivos en `prototipo-bots/nuevos/` (tarea 24 de `agentes.md` para instalarlos);
- el **cuerpo entero** de cada bot para el panel de la lección: hechos Valentina y Sofía; faltan los otros ocho.

**Fondo transparente:** ChatGPT dibuja el cuadriculado dentro de la imagen. Se le pide la misma imagen sobre verde puro `#00FF00` y se quita el verde por código (umbral de verdor 30–110 y corrección del borde verdoso); recorte limpio sobre fondo oscuro y blanco.

Lo que sigue de este documento (Anima, fichas, nombres) queda como antecedente, salvo la tabla de nombres por idioma, que sigue vigente.

## Decisiones del autor (14-11-2026)

1. **Modelo:** Anima (CircleStone Labs). Su licencia (CircleStone Labs Non-Commercial License v1.2) limita el **modelo**, no las imágenes: sección 2(e), las imágenes se pueden usar para cualquier fin. El modelo nunca va dentro de la app ni como servicio. Créditos tiene que decir con qué se hicieron los avatares nuevos.
2. **Estilo:** anime suave.
3. **Personajes:** los mismos 10 animales y personalidades. Cambian solo los atuendos militares:
   - **Valentina** → **piloto de carreras**.
   - **Sofía** → **detective**.
   - Camila conserva su ropa de exploradora; Bruno, su armadura (es «el muro», no ropa militar).
4. **Nombres locales** en inglés, alemán, italiano y francés (tabla en la sección 5).
5. **Primera prueba:** Don Ramiro.

## 1. Guía de estilo («anime suave»)

- **Encuadre:** busto (cabeza y hombros, hasta el pecho), cuerpo en tres cuartos mirando un poco a la derecha, cabeza centrada en el tercio superior. Es lo que se ve en los círculos de la app (52 px en la lección, 64 px en la portada, 96 a 160 px en las fichas).
- **Proporciones:** cabeza grande, ojos grandes y brillantes con un reflejo blanco, hocico o pico chico, rasgos redondeados. Tierno, no infantil.
- **Dibujo:** línea fina de color (marrón oscuro, no negro), sombreado de dos o tres tonos (cel shading suave) con un borde de luz cálida. Pelo y plumas en mechones simples, no realistas.
- **Luz:** desde arriba a la izquierda, cálida (igual que la lámpara de la portada).
- **Color:** saturación media; cada bot con un color propio que se reconozca en chico (sección 3). Ropa con 2 o 3 colores, sin estampados finos.
- **Fondo:** transparente en el archivo final. Se genera sobre un gris liso claro (`#E8E6E1`) para recortar sin halos.
- **Evitar:** armas, ropa militar o camuflaje, texto, logos, banderas, marcas, manos o patas de más, piel realista, fondos con escena, sombras proyectadas en el piso.
- **Expresiones** (las cuatro de la app, `BotExpression`): `explica` (boca abierta hablando, una mano o ala señalando), `piensa` (mirada hacia arriba, mano o ala en el mentón), `acierto` (sonrisa grande, ojos felices), `pista` (cejas levantadas, un dedo o pluma arriba, gesto de «atención»). El avatar principal es una sonrisa tranquila.

## 2. Consistencia del personaje

Para que el mismo bot se reconozca entre el avatar y sus cuatro expresiones:
- **Bloque fijo de descripción por bot** (sección 3), idéntico en todas sus imágenes; solo cambia la frase de la expresión.
- **Semilla fija por bot**, y la misma resolución (1024 × 1024) y receta.
- **Las expresiones parten del avatar elegido**, no de cero: imagen a imagen con poca fuerza de cambio (alrededor de 0,45) o repintando solo la cara y las manos. Así se conservan la ropa y los colores.
- Si con eso no alcanza, siguiente paso: entrenar un LoRA chico por bot con 15 a 20 imágenes buenas. No hace falta para la prueba.

## 3. Fichas para generar

Cada bot: descripción fija (en inglés, que es lo que entiende el modelo), color propio y qué cambia respecto del actual.

| Bot | Descripción fija | Color propio | Cambio |
|---|---|---|---|
| Pipo | young brown owl, round orange-brown feathers, big round glasses, green bucket explorer hat, red neckerchief, small backpack straps | verde musgo + rojo | solo estilo |
| Lola | calico cat (white, orange and brown patches), big round brown glasses, red neckerchief, brown satchel strap | naranja + rojo | solo estilo |
| Tomás | raccoon with dark eye mask, sly grin, black hoodie with red lining and drawstrings | negro + rojo | solo estilo |
| Valentina | grey wolf girl, confident smirk, **racing driver jacket (red and white leather with stripes and a number patch), racing goggles pushed up on the forehead**, fingerless driving gloves | rojo + blanco | **antes militar** |
| Don Ramiro | elderly great horned owl, fluffy brown and cream feathers, white eyebrow tufts, round gold-rimmed glasses, brown tweed jacket with elbow patch, burgundy vest, red bow tie | marrón + bordó | solo estilo |
| Camila | red fox girl, long wavy orange hair, explorer outfit (olive shirt, leather straps, compass badge), rolled map | naranja + oliva | solo estilo |
| Bruno | sturdy green turtle, calm frown, heavy brown shell, simple bronze chest plate with a shield emblem | verde + bronce | solo estilo |
| Sofía | red panda girl, sharp clever eyes, wavy auburn hair, **detective outfit: tan trench coat with turned-up collar, short brown deerstalker hat, holding a magnifying glass** | rojizo + beige | **antes militar** |
| Maestro Ivo | red-crowned crane, white feathers with black neck, calm wise eyes, wide straw hat with red tassel, dark red kimono-style robe | rojo + blanco | solo estilo |
| Ada | robot cat, white and silver panels, glowing cyan eyes and ear lights, headphones, red scarf | blanco + cian | solo estilo |

Texto común (va antes de la descripción): `anime illustration, soft cel shading, clean thin brown lineart, cute, bust portrait, three-quarter view facing slightly right, looking at viewer, plain light grey background, warm light from top left, masterpiece, best quality`.
Texto negativo común: `weapon, gun, military, camouflage, text, logo, watermark, signature, extra limbs, extra fingers, realistic fur, photorealistic, background scenery, cropped head, blurry`.

## 4. Archivos de salida

Los mismos de hoy, para que la app no cambie:
- Avatar: `assets/bots/<id>.webp`, 1254 × 1254, transparente (se sube de 1024 con un reescalado 2× y se recorta).
- Expresiones: `assets/fuente/expresiones/<id>-<expresion>.webp` (WebP calidad 90) → `npm run build:avatars` las pasa a 256 × 256.
- Revisar la escala de cada avatar dentro del círculo en `AVATARS` de `src/components/BotAvatar.tsx`.
- Los originales de 1024 y las variantes descartadas, fuera de git (como `C:/dev/expresiones-originales-png`).

- **Cuerpo entero** (pedido de un tester, 14-11-2026): además del busto, cada bot necesita una versión de cuerpo entero, parado, en tres cuartos mirando a la izquierda (hacia el globo de la lección), con sus cuatro expresiones como poses: `assets/bots/cuerpo/<id>-<expresion>.webp`, 768 × 1024, transparente. Se usa en el panel de la lección en pantalla ancha (spec del feedback, sección 6).

## 5. Nombres por idioma

Hoy los cinco idiomas usan el nombre español. Propuesta (el español no cambia):

| es | en | de | it | fr |
|---|---|---|---|---|
| Pipo | Pip | Pipo | Pipo | Pipo |
| Lola | Lola | Lola | Lola | Lola |
| Tomás | Tom | Thomas | Tommaso | Thomas |
| Valentina | Val | Valentina | Valentina | Valentine |
| Don Ramiro | Professor Raymond | Professor Raimund | Don Raimondo | Professeur Raymond |
| Camila | Camilla | Camilla | Camilla | Camille |
| Bruno | Bruno | Bruno | Bruno | Bruno |
| Sofía | Sophie | Sophie | Sofia | Sophie |
| Maestro Ivo | Master Ivo | Meister Ivo | Maestro Ivo | Maître Yves |
| Ada | Ada | Ada | Ada | Ada |

Al implementar: el campo `name` de `src/data/i18n/<lang>/bots.json` y cada texto traducido que nombre a un bot (bienvenida con Pipo, portada `sitio/textos.json`, frases de profesor, recordatorios, Créditos). Los `id` no cambian.

## 6. Plan de la prueba con Don Ramiro

0. **Elegir el archivo del modelo y leer su página.** En el disco están `amanatsuAnima_v10_bf16`, `anima-turbo-v1.1` y `oneObsession_anima29BV2` (derivados de Anima, con workflows en `ComfyUI/user/default/workflows/anima_*.json`); el Anima original de CircleStone no está. Un derivado puede sumar condiciones a las de CircleStone: antes de publicar una imagen, confirmar en la página del checkpoint que permite usar las imágenes. Si alguno no lo dice claro, bajar el Anima original.
1. **Ocho variantes** del avatar con la ficha de Don Ramiro y semillas distintas. Medir el tiempo por imagen.
2. **Elegir una** mirándola en chico: 52 px, 96 px y 160 px en círculo, sobre el fondo oscuro de la app. Lo importante en chico: ojos, anteojos, moño y el color propio.
3. **Las cuatro expresiones** desde la elegida (sección 2).
4. **Recorte del fondo:** ComfyUI no tiene hoy un nodo para quitar fondos (`custom_nodes` solo trae `comfyui_controlnet_aux`): instalar uno (por ejemplo BiRefNet o RMBG) o recortar fuera de ComfyUI.
5. **Comparar** junto al Don Ramiro actual en una hoja (avatar + cuatro expresiones, en grande y en chico) y decidir si se sigue con los otros nueve. Valentina y Sofía, después de Don Ramiro, porque son las de atuendo nuevo.
