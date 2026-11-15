import React, { useContext } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { BotAvatar, botBody } from '../components/BotAvatar';
import { Button3D } from '../components/Button3D';
import { BotExpression } from '../components/botFace';
import { useWideLayout } from '../components/useWideLayout';
import { Bot } from '../data/bots';
import { useI18n } from '../i18n/I18nContext';
import { type, colors, fonts, radius, space } from '../theme';
import { LessonPanelContext } from './LessonPanelContext';
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
  const wide = useWideLayout();
  const panel = useContext(LessonPanelContext);
  const label = t('lesson.teacherSays', { name: bot.name, text: welcome ? `${welcome} ${children}` : children });

  // Panel ancho de la lección: nombre, globo blanco con cola, profesor grande y botón debajo.
  if (wide && panel) {
    const notice = panel.status !== 'idle';
    const noticeBg = panel.status === 'correct' ? colors.correctBg : colors.incorrectBg;
    const tailBg = notice ? noticeBg : '#FFFFFF';
    const body = botBody(bot.id, expression);
    return (
      <View accessible accessibilityLabel={label}>
        <Text style={styles.wideName}>{bot.name}</Text>
        <View style={[styles.wideBubble, notice && { backgroundColor: noticeBg, borderBottomColor: noticeBg }]}>
          {notice ? (
            <>
              <Text style={[styles.wideNoticeTitle, { color: panel.status === 'correct' ? colors.primary : colors.danger }]}>
                {panel.title}
              </Text>
              {!!panel.message && <Text style={styles.wideNoticeText}>{panel.message}</Text>}
            </>
          ) : (
            <>
              {!!welcome && <Text style={styles.wideWelcome}>{welcome}</Text>}
              <Text style={styles.wideText}>{children}</Text>
            </>
          )}
        </View>
        <View style={[styles.wideTail, { backgroundColor: tailBg }, notice && { borderColor: tailBg }]} />
        <View style={styles.wideTeacher}>
          {body ? (
            <Image source={body} style={styles.wideBody} resizeMode="contain" fadeDuration={0} accessibilityElementsHidden importantForAccessibility="no" />
          ) : (
            <BotAvatar bot={bot} size={190} expression={expression} />
          )}
        </View>
        {!!panel.buttonLabel && panel.onButton && (
          <Button3D
            label={panel.buttonLabel}
            variant={panel.status === 'wrong' ? 'danger' : 'primary'}
            onPress={panel.onButton}
            style={styles.wideButton}
          />
        )}
      </View>
    );
  }

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
  // Panel ancho (spec del tester, sección 6): globo blanco → profesor → botón.
  wideName: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  wideBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderBottomWidth: 5,
    borderBottomColor: '#C9C6BF',
    padding: 16,
    marginTop: 6,
  },
  wideText: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 25, color: colors.bg },
  wideWelcome: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: '#6B6660', marginBottom: 6 },
  wideTail: {
    alignSelf: 'center',
    width: 18,
    height: 18,
    transform: [{ rotate: '45deg' }],
    marginTop: -9,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#C9C6BF',
  },
  wideTeacher: {
    alignItems: 'center',
    marginTop: 26,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  wideBody: { width: 190, height: 253 },
  wideButton: { marginTop: 20, alignSelf: 'stretch' },
  wideNoticeTitle: { fontFamily: fonts.extrabold, fontSize: 19 },
  wideNoticeText: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 23, color: '#FFFFFF', marginTop: 4 },
});
