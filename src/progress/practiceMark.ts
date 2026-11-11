// En el teléfono no hay service worker que leer la marca: no hace falta guardarla (practiceMark.web.ts).

import type { Streak } from './streak';

/** En nativo no hace nada: el comportamiento de la app no cambia. */
export function markPracticed(_streak: Streak): void {}
