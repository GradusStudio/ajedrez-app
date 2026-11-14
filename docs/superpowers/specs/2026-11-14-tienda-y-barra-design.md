# Tienda, acceso en Inicio y Perfil abajo en la barra lateral

Fecha: 14-11-2026 · Diseño: opus · Pedido del autor: «Perfil en la parte de abajo de la barra lateral para aprovechar mejor el espacio» y «armar una tienda y un acceso rápido en Inicio para personalizar el tablero y las piezas».

**Referencia visual:** `prototipo-tienda.html` (raíz del repo, fuera de git). Tiene la barra lateral nueva, la tarjeta de Inicio y la tienda funcionando: elegir, ver la vista previa, comprar con confirmación y usar.

## 1. Barra lateral (pantalla ancha)

- Arriba, las secciones de siempre: Inicio, Aprender, Aperturas, Puzzles, Bots y Análisis.
- Un espacio flexible empuja al fondo un grupo separado por una línea de 2 px (`rgba(255,255,255,.06)`):
  - **Tienda**, con el ícono de bolsa y el saldo de monedas a la derecha (moneda de 18 px y número en `gold`, 14 px).
  - **Perfil**, como fila más alta (60 px): la cara del avatar del usuario (o la de Pipo si no eligió) en un círculo de 40 px con canto dorado, «Perfil» en 16 px y, debajo, la racha («Racha de 6 días», 13 px, `textMuted`).
- La versión compacta (960 a 1199 px, solo íconos) mantiene el mismo orden: Tienda y Perfil abajo.
- **Celular:** las pestañas de abajo no cambian (Perfil sigue al final). La tienda se abre desde Inicio y desde Perfil.

## 2. Acceso en Inicio: tarjeta «Tu tablero»

- En la columna derecha de Inicio (o al final de la columna, en el celular), una tarjeta con:
  - Un **tablero chico** (150 px) con la posición de muestra, el tema y las piezas que el usuario tiene en uso.
  - Rótulo «TU TABLERO», el nombre de la combinación («Verde · Clásico») y «Cambia el tablero y las piezas, o compra nuevos con tus monedas.»
  - Botón secundario **«Ir a la tienda»** (no verde: el verde queda para la acción principal de Inicio).
  - Si el saldo alcanza para algo que todavía no tiene, una etiqueta dorada **«Te alcanza para algo nuevo»**.
- Para la cuenta nueva (primeros pasos, tarea 27), la tarjeta aparece recién cuando termina los tres primeros pasos, para no sumar opciones el primer día.

## 3. La tienda

Reemplaza a las dos pantallas actuales (Piezas en `/piezas` y Tableros en `/tableros`) por una sola, **`/tienda`**. Las rutas viejas redirigen a la tienda con la pestaña que corresponde (`/tienda?tab=piezas`). Precios y lógica: `src/pieces/shop.ts`, sin cambios.

**Pantalla ancha:** dos columnas.
- **Izquierda (340 px, fija al desplazarse):**
  - **Vista previa:** un tablero con la posición de muestra que combina lo que se está mirando con lo que ya se usa (por ejemplo, el tablero de hielo con las piezas de siempre).
  - Debajo, «En uso: Verde con piezas Clásico», o «Vista previa: tablero Hielo» cuando se está mirando algo nuevo.
  - **Botones** solo cuando se mira algo que no está en uso: «Volver» (secundario) y, según el caso, «Usar» si ya lo tiene, «Comprar por 200» si le alcanza, o «Te faltan 45 monedas» desactivado.
  - **Saldo:** la moneda y el número en grande (22 px, `gold`), y «Ganas monedas con lecciones, puzzles y partidas.»
- **Derecha:**
  - Selector **Tableros / Piezas** (como el de Aperturas).
  - **Grilla de 3 columnas** de tarjetas. Cada una tiene una miniatura (tablero: 2 × 4 casillas del tema; piezas: rey, dama y caballo del set sobre el tablero en uso), el nombre y el estado: «✓ En uso» (verde), «Gratis», «Tuyo», el precio con la moneda (dorado) o «200 · te faltan 45» (apagado).
  - Tocar una tarjeta la pone en la vista previa y le pone un borde dorado. Nada se compra ni se cambia sin tocar el botón de la izquierda.

**Celular:** una columna. Arriba, la vista previa (tablero a lo ancho) con los botones debajo; el saldo en la cabecera; después el selector y la grilla de 2 columnas.

**Comprar:**
- Diálogo de confirmación: «¿Comprar el tablero Madera?», «Cuesta 200 monedas. Te quedan 314. Se usa en todos tus tableros.», con «Cancelar» y «Comprar».
- Al comprar: se descuenta el saldo, lo comprado pasa a estar **en uso** y la tarjeta muestra «✓ En uso». Se puede sumar la animación del premio de monedas al revés (las monedas salen de la pastilla) más adelante.
- Accesibilidad: cada tarjeta es un botón con etiqueta completa («Tablero Madera, cuesta 200 monedas»); el diálogo lleva el foco a «Comprar» y Escape lo cierra.
- Textos de tú, sin exclamaciones, en los cinco idiomas.

## 4. Lo que no cambia

Los precios, qué es gratis, cómo se guardan las compras (`progress.boardThemes`, sets comprados) y la regla de que un tablero que no se tiene vuelve al verde.

## Cómo se comprueba

- `npm test`, `npx expo lint`, `npx tsc --noEmit`, `noHardcoded`.
- Navegador (`web-compilada`) a 1366 y 375 px: barra lateral con Tienda y Perfil abajo (también a 1100 px, compacta); tarjeta de Inicio con y sin saldo suficiente; en la tienda, mirar, volver, usar algo gratis, comprar con saldo y probar sin saldo; que `/piezas` y `/tableros` lleven a la tienda.
