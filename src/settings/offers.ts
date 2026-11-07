// Cuándo se ofrece algo al terminar una lección. Módulo puro para probarlo; el valor de cada bandera
// se toma una sola vez al abrir la pantalla (ver resultado.tsx).
import type { InstallPlatform } from '../pwa/installPlatform';

export function reminderOfferApplies(o: {
  remindersSupported: boolean;
  review: boolean;
  reminderOffered: boolean;
  reminderEnabled: boolean;
}): boolean {
  return o.remindersSupported && !o.review && !o.reminderOffered && !o.reminderEnabled;
}

/** `platform` es null en el celular y antes de montar en la web: no se ofrece. */
export function installOfferApplies(o: {
  platform: InstallPlatform | null;
  review: boolean;
  installOffered: boolean;
  reminderApplies: boolean;
}): boolean {
  return o.platform !== null && o.platform !== 'installed' && !o.review && !o.installOffered && !o.reminderApplies;
}
