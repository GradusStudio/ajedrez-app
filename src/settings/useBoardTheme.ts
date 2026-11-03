import { isBoardThemeOwned } from '../pieces/shop';
import { useProgress } from '../progress/ProgressContext';
import { BoardThemeId } from '../theme';
import { defaultSettings } from './sanitize';
import { useSettings } from './SettingsContext';

/** Tema del tablero en uso: el elegido en Ajustes, o el de siempre si es de pago y no se tiene (por ejemplo, tras borrar el progreso). */
export function useBoardTheme(): BoardThemeId {
  const { settings } = useSettings();
  const bought = useProgress().progress.boardThemes;
  return isBoardThemeOwned(settings.boardTheme, bought) ? settings.boardTheme : defaultSettings.boardTheme;
}
