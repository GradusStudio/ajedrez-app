# Plantilla de especificación

Copiar este archivo a `specs/00X-nombre/spec.md` (o a `docs/superpowers/specs/AAAA-MM-DD-nombre-design.md` si se sigue la carpeta actual) y completar. La spec describe el qué y el por qué; no incluye stack, nombres de archivos ni soluciones. Eso va en `plan.md`.

## Metadatos
- **Título:**
- **Fecha:**
- **Estado:** borrador | en revisión | aprobada
- **Autoridad:**
- **Specs relacionadas:**

## Contexto y problema
Qué pasa hoy, a quién afecta y por qué vale la pena cambiarlo. Hechos, no deseos.

## Objetivo
Una o dos frases. Qué tiene que ser verdad al terminar.

## Usuarios
Quién usa esto y en qué situación. Incluir al autor como primer usuario si aplica.

## Historias de usuario
- **HU-01:** Como [usuario], quiero [acción] para [beneficio].
- **HU-02:**

## Requisitos funcionales
Usar notación EARS. Cada requisito lleva criterios de aceptación verificables.

- **RF-01 (siempre):** El sistema hará X.
  - **CA-01:** Dado [estado], cuando [evento], entonces [resultado observable].
- **RF-02 (evento):** Cuando pase A, el sistema hará B.
- **RF-03 (estado):** Mientras esté en A, el sistema hará B.
- **RF-04 (no deseado):** Si pasa A, entonces el sistema hará B.

## Requisitos no funcionales
- **RNF-01:**
- **RNF-02:**

## Casos límite
-

## Fuera de alcance
-

## Criterios de finalización
- [ ] Todos los RF tienen al menos una prueba o un recorrido manual que los cubre.
- [ ] `npx tsc --noEmit`, `npx expo lint` y `npm test` pasan.
- [ ] Probado en la web y en el celular cuando el cambio lo requiere.
- [ ] La documentación (`CLAUDE.md`, `docs`, vault) quedó actualizada.
- [ ] Se revisó contra `docs/constitution.md`.

## Dudas abiertas
-

## Registro de cambios
| Fecha | Cambio | Motivo |
|---|---|---|
