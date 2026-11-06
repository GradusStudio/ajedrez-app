import React from 'react';
import { Pressable, StatusBar as RNStatusBar, Text, View } from 'react-native';
import { Button3D } from '../../components/Button3D';
import { ProgressBar } from '../../components/ProgressBar';
import { useI18n } from '../../i18n/I18nContext';
import { space } from '../../theme';
import { styles } from './reviewStyles';
import type { AnalysisPhase } from './useReviewAnalysis';

type Props = {
  /** El motor o el análisis fallaron: se ofrece reintentar. */
  down: boolean;
  engineReady: boolean;
  progress: { done: number; total: number };
  phase: AnalysisPhase;
  onBack: () => void;
  onRetry: () => void;
};

/** Pantalla mientras Stockfish recorre la partida. */
export function AnalyzingView({ down, engineReady, progress, phase, onBack, onRetry }: Props) {
  const { t } = useI18n();
  return (
    <View style={[styles.screen, { paddingHorizontal: space.lg, paddingTop: (RNStatusBar.currentHeight ?? 40) + space.sm }]}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('review.chooseOther')} hitSlop={12}>
        <Text style={styles.back}>{t('analysisMenu.back')}</Text>
      </Pressable>
      <Text style={styles.title}>{t('review.title')}</Text>
      <View style={styles.center}>
        {down ? (
          <>
            <Text style={styles.muted}>{t('analysis.engineDown')}</Text>
            <View style={{ height: space.md }} />
            <Button3D label={t('common.retry')} variant="danger" onPress={onRetry} />
          </>
        ) : (
          <>
            <Text style={styles.analyzing}>{t('review.analyzing')}</Text>
            <View style={{ flexDirection: 'row', width: '100%', marginVertical: space.md }}>
              <ProgressBar value={engineReady ? progress.done / progress.total : 0} />
            </View>
            <Text style={styles.muted}>{t(phase === 'refine' ? 'review.refining' : 'review.analyzingProgress', { done: progress.done, total: progress.total })}</Text>
            <Text style={[styles.muted, { marginTop: space.sm, textAlign: 'center' }]}>{t('review.analyzingTip')}</Text>
          </>
        )}
      </View>
    </View>
  );
}
