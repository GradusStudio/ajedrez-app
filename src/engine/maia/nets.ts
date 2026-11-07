// Redes de Maia que viajan en la app. Cada una imita a jugadores de Lichess de ese rating
// (1100 = de 1100 a 1199). Se generan con `npm run build:maia` (scripts/build-maia.js).

export type MaiaNetId = 1100 | 1500 | 1900;

export const MAIA_NETS: MaiaNetId[] = [1100, 1500, 1900];

/**
 * El archivo .pb.gz original de la red, en base64. Cada red se importa recién cuando se pide,
 * para que la web baje solo la que usa el bot.
 */
export async function loadNetBase64(id: MaiaNetId): Promise<string> {
  if (id === 1100) return (await import('./redes/maia1100.generated')).MAIA_1100;
  if (id === 1500) return (await import('./redes/maia1500.generated')).MAIA_1500;
  return (await import('./redes/maia1900.generated')).MAIA_1900;
}
