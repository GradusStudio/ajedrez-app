# Lanzamiento en Google Play: lista de pasos

Estado al 3-11-2026. Textos de la ficha en `ficha.md`; política de privacidad en `politica-de-privacidad.md`.

## 1. Listo en el proyecto
- [x] Paquete `com.graduschess.app`, versión `1.0.0`, `versionCode` automático (EAS remoto, `autoIncrement`).
- [x] Perfil `production` de EAS: genera un `.aab` (lo que pide Play). Perfil `preview`: APK para probar en el teléfono.
- [x] Proyecto de EAS vinculado (`@gradusstudio/gradus`), sesión `gradusstudio` abierta.
- [x] `targetSdk` 36 (Expo SDK 58 / React Native 0.88), `minSdk` 24 (Android 7).
- [x] Calidad: `tsc` sin errores, 145 pruebas pasan, lint 0 errores, `expo-doctor` 20 de 20.
- [x] `expo-asset` instalado (faltaba y `expo-audio` lo necesita fuera de Expo Go) y paquetes de Expo alineados a sus versiones de parche.
- [x] Permisos recortados en `app.json` (`blockedPermissions`): sin micrófono, sin almacenamiento, sin superposición.
- [x] Ficha en 5 idiomas dentro de los límites (nombre 30, corta 80, larga 4000), icono de 512 px (`assets/tienda/icono-512.png`).
- [x] Sin anuncios, pagos ni analíticas.
- [x] `.gitignore` protege la clave de la cuenta de servicio de Google (`google-service-account*.json`).

## 2. Falta antes de enviar a producción
- [x] **Correo de contacto público**: `gradusstudioapp@gmail.com` (cuenta de Google creada el 4-11-2026).
- [x] **Política de privacidad publicada** (4-11-2026): https://gradusstudio.github.io/gradus-web/privacidad.html. Página del estudio: https://gradusstudio.github.io/gradus-web/ (repositorio `GradusStudio/gradus-web`, carpeta local `C:\dev\gradus-web`).
- [ ] **Gráfico de funciones**: 1024 × 500 px, PNG o JPG.
- [ ] **Capturas de pantalla**: mínimo 2 de teléfono (recomendado 4 a 8; relación entre 16:9 y 9:16, lado menor de al menos 320 px). Se pueden sacar del Redmi con Expo Go o del build de prueba.
- [ ] **Build de producción probado**: `.aab` de producción y, antes, un APK `preview` instalado en el teléfono para confirmar que los sonidos, Stockfish y Maia (WebViews) funcionan fuera de Expo Go.
- [ ] **Cuenta de Play Console** (pago único de 25 USD, verificación de identidad).
- [ ] **Prueba cerrada**: una cuenta personal nueva necesita 12 testers con la prueba cerrada activa 14 días seguidos antes de pedir el acceso a producción (hito 7 de `CLAUDE.md`).

## 3. Respuestas para los formularios de Play Console
- **Tipo**: aplicación (no juego, aunque tiene partidas contra bots; la categoría sugerida es *Educación*). Gratuita, sin compras dentro de la app, sin anuncios.
- **Categoría**: Educación (alternativa: Juegos de mesa). **Etiquetas**: educación, ajedrez.
- **Clasificación de contenido (IARC)**: sin violencia, sin contenido sexual, sin lenguaje fuerte, sin drogas, sin apuestas, sin compras, sin contenido generado por usuarios, sin ubicación compartida. Resultado esperado: apto para todo público.
- **Público objetivo**: 13 años o más (evita las reglas extra de «Diseñada para familias»; la app no pide datos de nadie).
- **Seguridad de los datos**: no recopila ni comparte datos. Una sola salida a internet: el nombre de usuario que el usuario escribe para importar una partida de chess.com o Lichess va directo a ese servicio (no a Gradus Studio). Datos cifrados en tránsito: sí (HTTPS). Se puede pedir borrar datos: no hay datos en un servidor; se borran desinstalando.
- **Anuncios**: no. **Aplicación de noticias**: no. **Gobierno / salud / finanzas**: no.
- **ID de publicidad**: la app no lo usa.
- **Permisos**: notificaciones (recordatorio local), vibración, internet. Al subir el primer `.aab`, Play Console muestra los permisos del manifiesto: comprobar que coincidan.
- **Licencia**: GPL v3 o posterior. El repositorio de GitHub tiene que ser público y estar etiquetado con la versión subida (ver «Pendientes» de `CLAUDE.md`).

## 4. Comandos (desde `C:\dev\ajedrez-app`)
```bash
# Probar fuera de Expo Go (APK instalable en el Redmi)
npx eas-cli build -p android --profile preview

# Build de producción (.aab)
npx eas-cli build -p android --profile production

# Subir a Play (necesita la cuenta de Play y la clave de servicio; ver abajo)
npx eas-cli submit -p android --profile production
```
La primera vez, EAS crea y guarda la clave de firma de la app (conviene dejar que la gestione EAS). Con una app nueva, lo más seguro es subir el primer `.aab` **a mano** en Play Console (según la documentación de EAS, el primer envío suele ser manual); si `eas submit` lo acepta la primera vez, mejor. Los siguientes, con `eas submit`.

### Clave de servicio para `eas submit` (después de crear la cuenta)
1. Play Console > Configuración > Acceso a la API: vincular un proyecto de Google Cloud.
2. Crear una cuenta de servicio, darle permiso de «Lanzar a producción» (o de pruebas) en Play Console.
3. Descargar la clave JSON y guardarla como `google-service-account.json` en la raíz (ya está ignorada por git).

`eas.json` ya apunta a ese archivo, con pista `internal` y estado `draft` (sube sin publicar; la publicación la decides en la consola).

## 5. Después de publicar
- Primera hora: abrir la app desde Play, comprobar sonidos, bots y recordatorio; mirar *Android vitals* (cierres inesperados) en Play Console.
- Lanzamiento escalonado (por ejemplo 20 % → 50 % → 100 %) y plan de vuelta atrás: detener el despliegue y volver a subir el `.aab` anterior.
- Etiquetar la versión en GitHub (`git tag v1.0.0`) y subir el código correspondiente.
