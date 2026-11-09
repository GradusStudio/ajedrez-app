import { useCallback } from 'react';
import { showDialog } from '../components/dialog';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { useProgress } from './ProgressContext';

/**
 * Empezar una partida nueva contra un bot descarta la que está sin terminar. Si hay una guardada, pide confirmación
 * antes (y la quita al confirmar, para que la partida nueva pueda guardarse); si no, empieza directo.
 * Retomarla desde la tarjeta «Continuar» no pasa por acá.
 */
export function useConfirmNewGame(): (start: () => void) => void {
  const { progress, saveOngoingGame } = useProgress();
  const { findBot } = useContent();
  const { t } = useI18n();
  const ongoing = progress.ongoingGame;
  return useCallback(
    (start) => {
      if (!ongoing) return start();
      const botName = findBot(ongoing.botId)?.name ?? '';
      showDialog(t('game.newOverwrite.title'), t('game.newOverwrite.message', { bot: botName }), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('game.newOverwrite.confirm'),
          style: 'destructive',
          onPress: () => {
            saveOngoingGame(null);
            start();
          },
        },
      ]);
    },
    [ongoing, findBot, saveOngoingGame, t]
  );
}
