import type { LanguageFiles } from '../../translate';

// Alemán: arma los archivos de texto en la forma que espera buildContent (unidades por número).
export const files: LanguageFiles = {
  units: {
    '1': require('./unidad-1.json'),
    '2': require('./unidad-2.json'),
    '3': require('./unidad-3.json'),
    '4': require('./unidad-4.json'),
    '5': require('./unidad-5.json'),
    '6': require('./unidad-6.json'),
    '7': require('./unidad-7.json'),
    '8': require('./unidad-8.json'),
    '9': require('./unidad-9.json'),
  },
  openings: require('./aperturas.json'),
  bots: require('./bots.json'),
};
