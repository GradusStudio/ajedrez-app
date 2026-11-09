/** La ventana de Google no se abrió o se cerró (el navegador no deja distinguir un bloqueo de un cierre voluntario). */
export class PopupError extends Error {
  constructor() {
    super('Google: la ventana no se abrió o se cerró');
    this.name = 'PopupError';
  }
}

export const isPopupError = (e: unknown): e is PopupError => e instanceof PopupError;
