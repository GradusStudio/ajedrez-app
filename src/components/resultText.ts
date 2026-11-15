import type { MessageKey } from '../i18n/I18nContext';

export type ResultKind = 'win' | 'loss' | 'draw';

/** Título del resultado: la misma clave para la capa y para el panel del tablero. */
export function resultTitleKey(kind: ResultKind): MessageKey {
  return kind === 'win' ? 'game.win' : kind === 'loss' ? 'game.loss' : 'game.draw';
}

/** El aviso «ganaste, pero sin monedas» solo tiene sentido en una victoria fuera de la práctica. */
export function coinsNoteVisible(kind: ResultKind, coins: number, practice: boolean): boolean {
  return kind === 'win' && coins === 0 && !practice;
}
