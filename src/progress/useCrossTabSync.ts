import type { RefObject } from 'react';
import type { Progress } from './progressStore';

/** En el teléfono hay una sola copia de la app abierta: no hay otras pestañas que escuchar (ver la versión .web.ts). */
export function useCrossTabSync(_enabled: boolean, _current: RefObject<Progress>, _commit: (next: Progress) => void): void {}
