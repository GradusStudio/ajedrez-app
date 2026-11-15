import type { MessageKey } from '../i18n/es';

// El motivo de una partida se guarda en `GameRecord.reason` como texto en español (GameScreen guarda `es[r.reason]`).
// Para mostrarlo en el idioma elegido se traduce de vuelta a su clave. Los textos viejos que no estén acá se muestran
// como quedaron guardados.

const REASONS: Record<string, MessageKey> = {
  'Jaque mate': 'game.reason.checkmate',
  'Rey ahogado': 'game.reason.stalemate',
  'Material insuficiente': 'game.reason.insufficient',
  'Triple repetición': 'game.reason.threefold',
  'Regla de las 50 jugadas': 'game.reason.fifty',
  'Te rendiste': 'game.reason.resigned',
  'Tablas de mutuo acuerdo': 'game.reason.agreed',
  'Abandonaste la partida': 'game.reason.abandoned',
};

/** La clave del motivo guardado, o null si es un texto que no se reconoce. */
export function reasonKey(reason: string): MessageKey | null {
  return REASONS[reason] ?? null;
}
