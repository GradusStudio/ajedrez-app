// La partida elegida pasa de la pantalla de importar a la de revisión por aquí (un PGN es demasiado
// largo para llevarlo como parámetro de ruta). Sin React Native.

export type PendingGame = {
  pgn: string;
  /** Usuario de quien revisa, si se conoce (para saber de qué lado juega). */
  username?: string;
};

let pending: PendingGame | null = null;

export const setPendingGame = (g: PendingGame) => {
  pending = g;
};

/** La partida pendiente, sin quitarla (la pantalla puede montarse dos veces). */
export const peekPendingGame = () => pending;

/** Se llama al salir de la revisión. */
export const clearPendingGame = () => {
  pending = null;
};

/** Qué bando es el usuario: por nombre en el PGN; si no se sabe, null. */
export function sideOf(username: string | undefined, white: string, black: string): 'w' | 'b' | null {
  if (!username) return null;
  const u = username.toLowerCase();
  if (white.toLowerCase() === u) return 'w';
  if (black.toLowerCase() === u) return 'b';
  return null;
}
