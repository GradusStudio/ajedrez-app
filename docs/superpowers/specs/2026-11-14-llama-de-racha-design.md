# Llama de racha: ícono nuevo y animación de reencendido

Fecha: 14-11-2026 · Diseño: opus · Pedido del autor: «un ícono mejor para la llama de la racha y una animación cuando la reactives cada día».

**Referencia visual:** `prototipo-racha.html` (raíz del repo, fuera de git). Se abre con doble clic; la animación corre sola al cargar y con el botón «Reencender».

## 1. Ícono

Reemplaza la llama plana de `StatIcon` (`name="streak"`). viewBox 24 × 24, en `react-native-svg`:

- **Cuerpo:** `M12 1.6c.7 3 2.7 4.8 4.4 6.9 1.4 1.8 2.5 3.7 2.5 6.2a6.9 6.9 0 0 1-13.8 0c0-2.7 1.3-4.6 2.7-6 .2 1.7 1 2.9 2.1 3.4-.4-3.8.3-7.5 2.1-10.5Z`, con degradé vertical `#F7C631` (gold) → `#F5912F` al 55 % → `#EF6A2A`.
- **Núcleo:** `M12 10.6c.5 1.6 1.6 2.5 2.4 3.6.5.7.9 1.5.9 2.4a3.3 3.3 0 0 1-6.6 0c0-1.3.6-2.2 1.4-3 .1.8.5 1.4 1.1 1.6-.2-1.7.1-3.3.8-4.6Z` en `#FFF1B0`.
- **Brillo:** trazo `M9.2 13.4c-.6.9-.9 1.8-.8 2.9`, `#FFF6D6`, grosor 1,1, opacidad 0,7.
- Token nuevo en `theme.ts`: `flame: '#F5912F'` (también lo usan los escalones de la semana).
- Los `id` de los degradés tienen que ser únicos por instancia (`useId` o un contador), como ya pasó con los recortes del mármol en Safari.

## 2. Estados

Un componente `StreakFlame` (`size`, `state`) con cuatro estados, que salen de `streakStatusNow`:

| Estado | Cuándo (`StreakStatus.kind`) | Dibujo |
|---|---|---|
| Encendida | `safe`: ya practicó hoy | cuerpo con degradé + núcleo + brillo |
| Brasa | `active`: tiene racha y falta practicar hoy | cuerpo `surfaceRaised` con borde `outline` (1,2) y una brasa abajo: elipse `cx 12 cy 18.4 rx 3.2 ry 2.4` con degradé radial `#FFD27A` → `#F5912F` → transparente. La brasa late (opacidad 0,55 ↔ 1, 2,4 s) solo en tamaños de 40 px o más |
| Brasa por recuperar | `recovering` | como la brasa, con `rx 3.6`; va junto a la `RecoveryCard` de siempre |
| Apagada | `none` | solo el contorno, `outline`, grosor 1,6 |

En la barra de racha y monedas (Aprender, Perfil), con la llama en brasa o apagada el número va en `textMuted`; encendida, en blanco como hoy.

## 3. Reencender (una vez por día)

**Cuándo:** con la primera acción del día que mantiene la racha (lección, puzzle sin mirar la solución o partida que cuente, las reglas de `streak.ts`), es decir, cuando el estado pasa a `safe` en ese momento. Hace falta que el resultado de cada acción diga si encendió la racha hoy (`streakLit: boolean`, junto a `streakRecovered`). Las demás acciones del día muestran la llama ya encendida, sin animación.

**Dónde:**
- **Resultado de lección** (`LessonResultScreen`, tarjeta de racha, llama de 96 px): la animación completa (abajo). Reemplaza al `ignite` de resorte que hay hoy.
- **Puzzle y partida** (no tienen tarjeta de racha): una pastilla chica debajo del resultado, llama de 32 px + «6 días de racha», con la misma secuencia abreviada (pasos 1, 2 y 4, sin chispas ni semana).
- **Barra de Aprender** al volver: la llama hace un rebote corto (escala 1 → 1,25 → 1, 400 ms) la primera vez que se muestra encendida ese día.

**Secuencia completa** (unos 1,6 s; `useNativeDriver: true` en todo lo que se pueda):
1. **0–300 ms:** la brasa se aviva (escala 1 → 1,35, opacidad 0,6 → 1).
2. **300–900 ms:** la llama nace de abajo hacia arriba con rebote: escala `(0,35, 0,15)` → `(0,9, 1,18)` → `(1,06, 0,94)` → `(1, 1)`, con el origen en la base (ojo: en RN el origen de `transform` es el centro; compensar con `translateY`). La brasa se funde en 260 ms. Un halo radial naranja (35 % → 0) crece detrás, de 0,4 a 1,15 y queda en 1.
3. **560–1300 ms:** seis chispas `#FFD27A` (círculos de 1/24 del tamaño) salen en abanico hacia arriba, entre −150° y −30°, y se apagan; cada una arranca 40 ms después de la anterior.
4. **700 ms:** el número sube de 5 a 6 con un desplazamiento vertical de un renglón (520 ms, `Easing.out(Easing.cubic)`), y aparece «Encendiste la racha de hoy» en `gold` (fundido de 260 ms).
5. **900 ms:** **la semana como escalera**: 7 escalones (L a D) de 26 px de ancho y alturas crecientes (10 px + 5 px por día), con canto de 3 px. Los días practicados, en `flame` con canto `#B8601E`; hoy con un contorno `flame` de 2 px. El escalón de hoy se enciende creciendo desde abajo (escala Y 0,2 → 1,15 → 1, 420 ms). Es la idea de la marca (Gradus = paso) y evita la fila de círculos con tilde que usan otras apps.
6. **Después:** la llama parpadea suave dos ciclos (escala `(1,02, 1,05)` y un sesgo de ±1,5°, 1,8 s por ciclo) y se queda quieta.

Con `useReducedMotion`: sin animación; la llama aparece encendida, el número final, el mensaje y la semana completa.

**Textos nuevos** (cinco idiomas, `noHardcoded`): «Encendiste la racha de hoy» y los nombres cortos de los días (L M M J V S D; en inglés M T W T F S S, etc.). La semana empieza el lunes.

## 4. Fuera de alcance

Sonido propio del reencendido (puede ir después con `useFeedback`), la notificación del recordatorio y la pantalla de Perfil más allá de cambiar el ícono.

## 5. Cómo se comprueba

- Pruebas puras: la decisión de `streakLit` (primera acción del día sí, la segunda no, la recuperación con las tres acciones sí al completar la tercera, un puzzle con solución vista no).
- `npm test`, `npx expo lint`, `npx tsc --noEmit`.
- Navegador (`web-dev`): la barra con los cuatro estados (forzando el progreso), el resultado de una lección con la racha en brasa (animación completa) y otra seguida (sin animación). El celular lo prueba el autor.
