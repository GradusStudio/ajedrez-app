import React from 'react';
import { Text, View } from 'react-native';
import { ColumnScrollView, useColumnBarPadding } from '../../components/ColumnScrollView';
import { Button3D } from '../../components/Button3D';
import { MessageKey, useI18n } from '../../i18n/I18nContext';
import type { Review } from '../../review/types';
import { space } from '../../theme';
import { CATS, countCats, QUALITY_STYLE } from './quality';
import { styles } from './reviewStyles';
import { statusBarTop } from '../../components/statusBarTop';

type Props = {
  top: React.ReactNode;
  bubble: React.ReactNode;
  graph: React.ReactNode;
  review: Review;
  me: 'w' | 'b';
  nameOf: (c: 'w' | 'b') => string;
  decimal: string;
  onStart: () => void;
  /** Abre el quiz de puntos de giro; sin errores del usuario no hay botón. */
  onPractice?: () => void;
};

/** Resumen previo a la revisión: gráfico, precisión de cada jugador y cuenta por calidad de jugada. */
export function SummaryView({ top, bubble, graph, review, me, nameOf, decimal, onStart, onPractice }: Props) {
  const { t } = useI18n();
  // Pantalla ancha: el botón de abajo se alinea con la columna del resumen.
  const barPadding = useColumnBarPadding();
  const counts = { w: countCats(review.plies, 'w'), b: countCats(review.plies, 'b') };
  return (
    <View style={styles.screen}>
      <ColumnScrollView contentContainerStyle={[styles.content, { paddingTop: statusBarTop(space.sm) }]}>
        {top}
        {bubble}
        <View style={{ height: space.lg }} />
        {graph}

        <View style={styles.players}>
          {(['w', 'b'] as const).map((c) => (
            <View key={c} style={[styles.playerCard, c === me && styles.playerCardMe]}>
              <Text style={styles.playerName} numberOfLines={1}>
                {nameOf(c)}
              </Text>
              <View style={[styles.accBox, c === 'b' && { backgroundColor: '#403D39' }]}>
                <Text style={[styles.accNum, c === 'b' && { color: '#FFFFFF' }]}>{review.accuracy[c].toFixed(1).replace('.', decimal)}</Text>
              </View>
              <Text style={styles.accLabel}>{t('review.accuracy')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.catTable}>
          {CATS.map((id) => {
            const { color, label } = QUALITY_STYLE[id];
            return (
              <View key={id} style={styles.catRow}>
                <Text style={styles.catLabel} numberOfLines={1}>
                  {t(`review.cat.${id}` as MessageKey)}
                </Text>
                <Text style={[styles.catCount, counts.w[id] > 0 && { color }]}>{counts.w[id]}</Text>
                <View style={[styles.catIcon, { backgroundColor: color }]}>
                  <Text style={styles.catGlyph}>{label}</Text>
                </View>
                <Text style={[styles.catCount, counts.b[id] > 0 && { color }]}>{counts.b[id]}</Text>
              </View>
            );
          })}
        </View>
        {/* Debajo de la tabla, junto a los errores que se van a practicar; «Empezar» sigue siendo la acción principal. */}
        {onPractice && <Button3D label={t('quiz.title')} onPress={onPractice} style={{ marginTop: space.md }} />}
      </ColumnScrollView>
      <View style={[styles.bottomBar, barPadding]}>
        <Button3D label={t('review.start')} variant="primary" onPress={onStart} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
