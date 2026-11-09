# Portada de graduschess.com y nueva bienvenida

Fecha: 8-11-2026. Estado: **aprobada y construida el 8-11-2026** (ver «Cambios al construir», al final). El sitio estaba en pruebas, sin usuarios reales.

## 1. Qué cambia y por qué

Hoy `graduschess.com/` abre directo la app. Alguien que llega desde Google, desde un enlace o desde un vivo cae en la ruta de Aprender sin saber qué es Gradus. El público son personas que quieren aprender ajedrez desde cero o mejorar, casi siempre desde el celular.

Decisiones del usuario (8-11-2026):
- La portada va en `/`, como página estática (HTML y CSS, sin React), y la app pasa a `/app`.
- Se rediseña la pantalla de bienvenida (`OnboardingScreen`) para que siga a la portada sin cortes.

Esto reemplaza la regla de la spec web del 7-11 que decía «sin estructura de landing». Esa regla sigue valiendo para `/instalar`. La portada tampoco lleva testimonios, cifras grandes, preguntas frecuentes inventadas ni tarjetas de beneficios.

## 2. Dirección visual

**Idea central:** la portada no describe Gradus, deja probarlo. Lo primero que se ve es un tablero en el que se juega la primera jugada de una lección, con el profesor al lado.

### Colores (los de `docs/design.md`, sin agregar otros)
| Nombre | Hex | Papel en la portada |
|---|---|---|
| bg | `#262421` | Fondo |
| surface | `#302E2B` | Globo del profesor, franja de bots |
| primary | `#81B64C` | Solo el botón «Abrir Gradus» y el acierto |
| gold | `#F7C631` | Solo la casilla a la que hay que mover |
| board | `#EBECD0` / `#779556` | Tablero |
| text / muted | `#FFFFFF` / `#C3C2C1` | Texto |

El fondo oscuro con un solo acento verde es uno de los patrones típicos del diseño generado, pero acá es la identidad real de la app: la portada tiene que parecer la puerta de esa app, no otra marca.

### Letra
Solo Nunito, servida desde el propio sitio (la CSP no permite Google Fonts). Escala:
- Título: 44 px (32 en el celular), peso 800, interlineado 1,05, espaciado de letras -0,5 px.
- Texto del globo: 18 px, 700.
- Cuerpo: 16 px, 700, `muted`, interlineado 1,5, máximo 60 caracteres por línea.
- Botón: 16 px, 800, en mayúsculas con 0,5 px, como en la app.

Sin etiquetas en mayúsculas encima de los títulos ni una palabra resaltada en otro color dentro de un título.

### Estructura
```
Celular (columna, alineado a la izquierda)      Computadora (dos columnas)
┌─────────────────────────┐                     ┌────────────────────────────────────────┐
│ [ícono] Gradus          │                     │ [ícono] Gradus                          │
│                         │                     │ ┌──────────────┐  Aprende ajedrez       │
│ Aprende ajedrez         │                     │ │              │  paso a paso.          │
│ paso a paso.            │                     │ │   tablero    │  (Pipo) «Mueve el peón │
│ ┌─────────────────────┐ │                     │ │   tocable    │   del rey dos casillas»│
│ │      tablero        │ │                     │ │              │  [ ABRIR GRADUS ]      │
│ │      tocable        │ │                     │ └──────────────┘                         │
│ └─────────────────────┘ │                     ├────────────────────────────────────────┤
│ (Pipo) «Mueve el peón…» │                     │ Juega contra 10 bots…  😀😀😀😀😀😀😀😀😀😀 │
│ [ ABRIR GRADUS ]        │                     │ Gratis. Sin anuncios. Sin cuenta.       │
├─────────────────────────┤                     │ pie                                     │
│ Juega contra 10 bots    │                     └────────────────────────────────────────┘
│ 😀😀😀😀😀 (desliza)       │
│ Gratis. Sin anuncios.   │
│ Sin cuenta.             │
│ Instalar · pie          │
└─────────────────────────┘
```

### Lo llamativo (lo único)
El tablero de la primera lección (`u1-l01`, la enseña Pipo):
1. Posición inicial. El peón de e2 y la casilla e4 marcados en dorado. Pipo, con su cara de «explica», dice una frase propia de su bienvenida (`teaching` de `bots.json`).
2. Se juega tocando el peón y la casilla, o arrastrándolo. Solo vale e4. Otra jugada vuelve atrás y Pipo da la pista (cara de «pista»), sin panel rojo.
3. Al acertar, el peón se desliza, Pipo pone la cara de acierto y el botón cambia a «Seguir esta lección en Gradus» (abre `/app/leccion/u1-l01`).

Es la única animación de la portada. Con `prefers-reduced-motion`, el peón aparece en el destino sin deslizarse.

### Debajo del tablero (sin tarjetas iguales)
- **Bots:** una fila con las 10 caras (avatares reales, con el círculo de color de su estilo), nombre y Elo. Encima, una línea: «Juega contra 10 bots que juegan como personas, de 500 a 2200 de Elo» (valores de `bots.json`; si cambian, la portada los toma de ahí al compilar). En el celular la fila se desliza de costado. Tocar un bot abre `/app/bot/<id>`.
- **Una línea:** «Gratis. Sin anuncios. Sin cuenta.» No hay botones de compartir ni registros.
- **Pie:** Instalar (`/app/instalar`), Privacidad, Términos, Código fuente (GitHub, GPL v3), Gradus Studio y el correo público.

## 3. Bienvenida nueva (`OnboardingScreen`)

Hoy: un ♞ verde de 72 px, «GRADUS» en dorado espaciado y en mayúsculas (un adorno que no dice nada), el título, el texto y «Empezar». Después, el nivel en tres tarjetas.

Propuesta: que la bienvenida continúe a la portada, con el profesor que la recibe.
- **Paso 1:** la cara de Pipo (96 px, `Circle3D`) con su globo (`TeacherBubble`, el mismo de las lecciones) y su frase de bienvenida. Debajo, el título actual «Aprende ajedrez paso a paso» y el texto. Se quitan el ♞ y la marca dorada.
- **Paso 2, nivel:** las tres opciones de siempre. Cada tarjeta suma a la izquierda un tablero miniatura de 56 px con lo que se va a practicar: el caballo con sus casillas (nunca jugué), un enroque (sé mover) y una clavada (juego de vez en cuando). Al tocar una, el globo de Pipo responde antes de pasar (por ejemplo, «Empezamos por el tablero y las piezas»), con su frase en `teaching`.
- **Si se llega desde la portada habiendo jugado e4:** se pasa directo al paso 2 (la portada guarda una marca en `localStorage`).
- Sigue igual la oferta de instalar en Safari de iPhone, «Saltar» y los puntos de progreso.
- Textos nuevos en los cinco idiomas: es y en a mano; de, it y fr con gemma4 vía Ollama, revisando puntuación y términos. `noHardcoded.test.ts` tiene que pasar.

## 4. Mover la app a `/app` (técnico)

| Pieza | Cambio |
|---|---|
| `app.json` | `experiments.baseUrl: "/app"` (Expo Router genera rutas y recursos bajo `/app`). |
| `public/manifest.webmanifest` | `start_url` y `scope` pasan a `/app/`. |
| Ya instalados | Su `start_url` sigue siendo `/`. La portada lleva `public/portada.js`: si está en modo app (`display-mode: standalone`) o hay progreso guardado (`ajedrez:progreso`), redirige a `/app/` antes de pintarse. |
| Progreso | No se pierde: `localStorage` es por dominio, no por ruta. |
| `scripts/build-sw.js` | `navigateFallback: '/app/index.html'`, solo para rutas `/app/*`. La portada se precachea aparte. |
| `wrangler.jsonc` | La SPA solo responde dentro de `/app`. Las rutas viejas (`/leccion/...`, `/instalar`, `/privacidad`...) redirigen con 301 a `/app/...` (`public/_redirects`). |
| CSP (`public/_headers`) | La portada no usa scripts en línea (`portada.js` es un archivo aparte), así que no hace falta otro hash. |
| `public/sitemap.xml`, `canonical`, `og:url` | Apuntan a la portada y a `/app/instalar`, `/app/privacidad`, `/app/terminos`. |
| Google Drive | Mismo origen, no cambia la configuración de OAuth. |
| Portada | `public/index.html` (portada) + `public/portada.css` + `public/portada.js`. El HTML de la app que genera Expo queda en `dist/app/index.html`. El tablero y las piezas se dibujan en SVG con las siluetas del set Clásico, copiadas por un script (`scripts/build-portada.js`) desde `pieceSets.ts` para no duplicarlas a mano. |
| Idiomas | La portada sale en el idioma del navegador (los cinco), con los textos en `public/portada-textos.json`. |

## 5. Calidad mínima
- Funciona desde 320 px sin desplazamiento horizontal (salvo la fila de bots, a propósito). Áreas táctiles de 44 px o más.
- El tablero se maneja con teclado (flechas y Enter) y tiene su texto alternativo. Foco visible.
- Contraste AA en todo el texto.
- La portada pesa menos de 150 KB sin contar los avatares (WebP de 128 px).
- Comprobación: `npm test`, `npx expo lint`, `npm run build:web`, y en el navegador: portada en celular y computadora, jugar e4, entrar a `/app`, redirección con progreso guardado y con la app instalada, y que una ruta vieja (`/leccion/u1-l02`) lleve a la nueva.

## 6. Fuera de esta spec
- Rediseñar otras pantallas de la app.
- Cambiar los nombres de las claves de almacenamiento.
- Analíticas o contadores de visitas (no hay y no se agregan).

## 7. Preguntas abiertas
1. ¿El sitio ya está publicado con usuarios reales? Si no, las redirecciones de rutas viejas son una precaución barata pero no urgente.
2. ¿Pipo como anfitrión (enseña la Unidad 1) o preferís a otro bot?

## 8. Cambios al construir (8-11-2026)
- **Paso del tablero:** la primera lección (`u1-l01`) es de coordenadas, no mueve piezas. Se usa el paso real `u1-l07-s05` de «El peón» (también lo enseña Pipo): «Avanza el peón dos casillas», pista «Es su primera jugada». El globo dice la bienvenida de Pipo y la explicación del paso `u1-l07-s01`. e4 no se marca de antemano: al tocar el peón aparecen los puntos de e3 y e4, como en la app.
- **Bienvenida:** Pipo usa su frase «Hoy aprendemos juntos y yo también me sumo» (la de «esta lección» no encaja antes de empezar). No se agregó la respuesta del globo al elegir el nivel: demoraba la entrada y obligaba a escribir frases nuevas en cinco idiomas. Los tableros chicos son recortes (`MiniBoard`): caballo y sus saltos (5 × 5), rey enrocado (4 × 4) y una clavada con flecha (4 × 4). La bienvenida no tiene textos nuevos.
- **Rutas de la app en Cloudflare:** `_redirects` se aplica aunque el archivo exista, así que no sirve reenviar `/app/*` al HTML de la app. Se usa `not_found_handling: "404-page"` con `dist/app/404.html` (copia del HTML de la app); las rutas profundas responden con estado 404 pero la página funciona, y el service worker las sirve después. `instalar`, `privacidad` y `terminos` tienen su `.html` y responden 200.
- **Archivos:** fuentes de la portada en `sitio/` (`index.html` con marcadores `{{...}}`, `portada.css`, `portada.js`, `inicio.js`, `404.html`, `textos.json`); `_headers`, `_redirects`, `robots.txt` y `sitemap.xml` siguen en `public/` y el script los mueve a la raíz de `dist/`. `npm run build:portada` arma solo la portada.
- **Peso:** HTML, CSS, JS y caras de Pipo, unos 104 KB; avatares de los 10 bots, 84 KB (128 px, se cargan al bajar); letra Nunito 700 y 800 en TTF, 264 KB (la CSP no permite Google Fonts; pasar a WOFF2 la bajaría a la mitad, queda pendiente).
- **Probado en el navegador** con `wrangler dev` sobre `dist/` (configuración `web-compilada`): portada en computadora y celular (375 px, sin desplazamiento horizontal), error con e3 y acierto con e4 tocando, arrastrando y con teclado, redirección con progreso guardado y `?portada`, `/app/leccion/u1-l07` directo, `/leccion/u1-l02` → `/app/leccion/u1-l02`, canónica de `/app/instalar`, service worker con alcance `/app/`, bienvenida nueva y salto al nivel después de jugar en la portada. Sin probar: el sitio publicado en Cloudflare y la app instalada en el Redmi.
