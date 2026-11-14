# Portada: luz sobre la mesa y tablero de madera

Fecha: 14-11-2026 · Diseño: opus · Tarea 4 de `agentes.md`.

## Decisiones del usuario (14-11-2026)

- Fondo con profundidad: **luz sobre la mesa**. El tablero apoya sobre una mesa en penumbra, con una lámpara cálida que lo ilumina desde atrás.
- Tablero: **madera**, con las texturas que ya usa la app (`assets/texturas/madera-casilla-{clara,oscura}.webp`, 4 KB y 9 KB).

## Referencia visual

Prototipo en `prototipo-portada/` (raíz del repo, fuera de git): `mesa.css` (todo el estilo nuevo) y `mesa-proto.js` (cambia las casillas en el navegador; en la versión final no hay JavaScript). Para verlo: copiar `mesa.css`, `mesa-proto.js` y las dos texturas a `dist/portada/` (las texturas en `dist/portada/texturas/`), `prototipo-portada/index.html` a `dist/prototipo-portada.html`, y abrir `http://localhost:8788/prototipo-portada?portada` con la configuración `web-compilada`.

## Diseño

### Fondo (todo en CSS, sobre `body`)

Tres capas, de arriba hacia abajo:
1. **Lámpara:** elipse radial de luz cálida `rgb(255 196 128)`: 30 % de opacidad en el centro, 16 % a mitad, 4 % al 80 % y nada en el borde. Tamaño `46vmax × 38vmax`, fija a la ventana (`background-attachment: fixed`). Centro detrás del tablero: `29% 44%` con 880 px o más (el tablero está a la izquierda) y `50% 44%` en pantallas angostas.
2. **Viñeta:** los bordes de la ventana se oscurecen hasta 60 % de negro, para que la luz se lea como un foco.
3. **Mesa:** degradé vertical de `#262421` (el `bg` de siempre) a `#1b1917` en los primeros 900 px. `html` lleva `#1b1917` para que el final de la página no corte.

### Tablero

- **Casillas de madera:** en el SVG del tablero, dos `<pattern>` de 200 × 200 (2 × 2 casillas) con la textura clara y la oscura, así la veta no se repite casilla a casilla (mismo criterio que `SquareTexture`). Los `rect` usan `fill="url(#mc)"` y `fill="url(#mo)"`. Coordenadas con los colores promedio del tema Madera de `theme.ts`: `#7A4A2A` sobre casilla clara y `#E0BE8A` sobre oscura.
- **Marco con espesor:** 12 px de madera oscura `#4a2c17`, un filete de 1 px `#6b4226` y un canto de 10 px `#2c190c` hacia abajo (todo con `box-shadow`, sin agregar elementos). En pantallas de menos de 880 px: 8 px de marco y 7 px de canto. Esquinas de 6 px; se quita el `border-bottom` verde de hoy.
- **Sombras:** una larga y suave (`0 34px 60px 10px`, 55 % de negro) y una **sombra de contacto** debajo: elipse borrosa de 46 px de alto, 75 % de negro en el centro (`.board-wrap::after`).
- **Luz sobre el tablero:** un degradé encima de las casillas (`.board::before`, `mix-blend-mode: soft-light`): más claro arriba a la izquierda, de donde viene la lámpara, y un poco más oscuro abajo a la derecha. Peón, casillas tocables y resaltados van por encima (`z-index`), y no reciben toques del degradé (`pointer-events: none`).

### Globo de Pipo

Fondo `rgba(48, 46, 43, 0.92)` y sombra `0 12px 30px` al 35 %: parte de la escena, no una tarjeta pegada.

### Lo que no cambia

Textos, el paso que se juega con Pipo, la fila de bots, el pie, los colores de los botones y la letra.

## Implementación (para quien programe)

- `sitio/portada.css`: pasar el contenido de `prototipo-portada/mesa.css` (las variables `--table`, `--lamp`, `--frame`, `--frame-hi` y `--frame-edge` en `:root`).
- `scripts/build-portada.ts`: `boardHtml` agrega los `<defs>` con los dos patrones (`href="/portada/texturas/madera-casilla-clara.webp"` y `...-oscura.webp`), usa `url(#mc)` / `url(#mo)` en los `rect` y los colores de coordenadas de arriba. Copiar las dos texturas a `dist/portada/texturas/`.
- Sin JavaScript nuevo (la CSP no cambia: las imágenes son de `'self'`). Revisar que `sitio/sw.js` guarde las texturas si cachea los archivos de la portada.
- `public/_headers` o la caché de Cloudflare: las texturas son estáticas como el resto de `/portada/`.

## Cómo se comprueba

- `npm run build:web` y `web-compilada`: `http://localhost:8788/?portada` a 1366 × 768 y a 375 × 812. Sin desplazamiento horizontal en el celular (`scrollWidth` igual al ancho).
- El paso con Pipo sigue funcionando: tocar y arrastrar el peón a e4, acierto y error.
- El texto de la portada (`lede`, `#c3c2c1`) mantiene contraste de 4,5:1 o más sobre la zona más clara de la lámpara.
- Lighthouse de la portada: el LCP no empeora más de 100 ms (son 13 KB de imágenes).
