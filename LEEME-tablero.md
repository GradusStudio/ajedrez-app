# Tablero de ajedrez · pasos en Windows 11

Abre PowerShell en la carpeta donde quieras tener el proyecto.

## 1. Crear el proyecto (si aún no lo creaste)
```
npx create-expo-app@latest ajedrez-app --template blank-typescript
cd ajedrez-app
```

## 2. Instalar dependencias
```
npm install chess.js
npx expo install expo-font @expo-google-fonts/nunito react-native-svg
```

## 3. Copiar los archivos de este zip
Dentro de `ajedrez-app`:
- `App.tsx` reemplaza al que trae el proyecto.
- La carpeta `src` va al lado de `App.tsx` (crea `src/components`, `src/screens` y `src/theme.ts`).

Estructura final:
```
ajedrez-app/
  App.tsx
  src/
    theme.ts
    components/Board.tsx
    components/Piece.tsx
    components/Button3D.tsx
    screens/FreePlayScreen.tsx
```

## 4. Ejecutar
```
npx expo start
```
Escanea el QR con Expo Go en tu Redmi (celular y PC en la misma red wifi).

## Qué hace esta versión
- Tablero con jugadas legales (enroque, captura al paso, jaque, mate y tablas las valida chess.js).
- Tocar pieza, ver destinos posibles, tocar destino.
- Resalta última jugada, jaque y destinos (colores de design.md).
- Deshacer, Voltear, Reiniciar y Nueva partida.

## Limitaciones conocidas
- La coronación es siempre a dama (falta selector).
- Las piezas son un set propio (estilo "Sombra lateral", compacto) en `Piece.tsx`. Es una versión de trabajo: se seguirá retocando.
- No se pudo ejecutar este código al escribirlo: si ves algún error al correrlo, copia el mensaje y lo corregimos.

## Cómo está pensado para crecer
`Board` no guarda la partida: recibe una posición (`fen`) y avisa cada jugada con `onMove`. Así se reutiliza igual en lecciones (`interactive={false}` para explicar), drills y puzzles (validando la jugada contra la solución) y partidas contra bots.
