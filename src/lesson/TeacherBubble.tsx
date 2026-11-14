import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BotAvatar } from '../components/BotAvatar';
import { BotExpression } from '../components/botFace';
import { useWideLayout } from '../components/useWideLayout';
import { Bot } from '../data/bots';
import { useI18n } from '../i18n/I18nContext';
import { type, colors, fonts, radius, space } from '../theme';
import { useTeacher } from './TeacherContext';

// Cara del profesor (feedback del tester, 14-11-2026): 88 px en la web ancha, 64 en el celular.
const FACE_WIDE = 88;
const FACE_NARROW = 64;

/** Cara del bot al lado de su globo. Sin alto fijo: con letra grande el globo crece y baja con la página. */
export function BubbleRow({ bot, expression, text }: { bot: Bot; expression: BotExpression; text: string }) {
  const wide = useWideLayout();
  return (
    <View style={styles.row}>
      <BotAvatar bot={bot} size={wide ? FACE_WIDE : FACE_NARROW} expression={expression} />
      <View style={styles.bubble}>
        <Text style={[styles.text, wide && styles.textWide]}>{text}</Text>
      </View>
    </View>
  );
}

/** Texto de un paso dicho por el profesor. Se lee como un solo bloque, con el nombre del bot. */
export function TeacherBubble({ children }: { children: string }) {
  const { bot, expression, welcome } = useTeacher();
  const { t } = useI18n();
  const label = t('lesson.teacherSays', { name: bot.name, text: welcome ? `${welcome} ${children}` : children });
  return (
    <View accessible accessibilityLabel={label}>
      {!!welcome && (
        <View style={styles.welcome}>
          <Text style={styles.name}>{bot.name}</Text>
          <Text style={styles.welcomeText}>{welcome}</Text>
        </View>
      )}
      <BubbleRow bot={bot} expression={expression} text={children} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  bubble: { flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: radius.control, paddingVertical: space.md, paddingHorizontal: 14 },
  text: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, lineHeight: 26 },
  textWide: { fontSize: type.body },
  welcome: { marginBottom: space.md },
  name: { fontFamily: fonts.extrabold, fontSize: type.secondary, color: colors.primary },
  welcomeText: { fontFamily: fonts.bold, fontSize: type.body, color: colors.textMuted, lineHeight: 20, marginTop: 2 },
});
