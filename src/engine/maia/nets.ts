import { MAIA_1100 } from './redes/maia1100.generated';
import { MAIA_1500 } from './redes/maia1500.generated';
import { MAIA_1900 } from './redes/maia1900.generated';

// Redes de Maia que viajan en la app. Cada una imita a jugadores de Lichess de ese rating
// (1100 = de 1100 a 1199). Se generan con `npm run build:maia` (scripts/build-maia.js).

export type MaiaNetId = 1100 | 1500 | 1900;

export const MAIA_NETS: MaiaNetId[] = [1100, 1500, 1900];

/** El archivo .pb.gz original de la red, en base64. */
export function netBase64(id: MaiaNetId): string {
  return id === 1100 ? MAIA_1100 : id === 1500 ? MAIA_1500 : MAIA_1900;
}
