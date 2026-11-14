import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { showDialog } from '../components/dialog';
import { usableDraft } from './draft';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { useFeedback } from '../feedback/feedback';
import { ProgressBar } from '../components/ProgressBar';
import { Lesson, Step } from '../data/lessonTypes';
import { pickPhrase, teacherForLesson } from '../data/teachers';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { ExplainStep } from './steps/ExplainStep';
import { LineStep } from './steps/LineStep';
import { MoveStep } from './steps/MoveStep';
import { PracticeStep } from './steps/PracticeStep';
import { QuizStep } from './steps/QuizStep';
import { SelectSquaresStep } from './steps/SelectSquaresStep';
import { TeacherContext } from './TeacherContext';
import { LessonPanelContext, LessonPanelState } from './LessonPanelContext';
import { teacherExpression } from './teacherExpression';
import { type, colors, fonts, space } from '../theme';
import { statusBarTop } from '../components/statusBarTop';
import { useBoardLayoutWidth } from '../components/BoardLayout';
import { useWideLayout } from '../components/useWideLayout';
import { LESSON_RESERVE } from './stepTypes';
import { previousStep, reviewProgress } from './review';

export type LessonResult = { errors: number; xp: number; mistakes: string[] }; // xp: monedas de la lección

/** Dónde va el usuario: sirve para guardar el avance y retomarlo. */
export type LessonState = { stepIndex: number; errors: number; mistakes: string[] };

type Props = {
  lesson: Lesson;
  /** Id de la lección original, el que define al profesor (también en un repaso de errores). */
  lessonId: string;
  /** Repaso de errores: no es el comienzo de una lección, así que no hay bienvenida. */
  noWelcome?: boolean;
  /** Avance guardado desde donde retomar. */
  initial?: LessonState;
  /** Texto del aviso al salir con la ✕ o el botón "atrás". */
  exitMessage: string;
  onExit: (state: LessonState) => void;
  /** Se llama al pasar al paso siguiente, con el estado nuevo. */
  onAdvance?: (state: LessonState) => void;
  onFinish: (result: LessonResult) => void;
};

type Status = 'idle' | 'correct' | 'wrong';

export function LessonPlayer({ lesson, lessonId, noWelcome, initial, exitMessage, onExit, onAdvance, onFinish }: Props) {
  const start = usableDraft(initial, lesson.steps.length);
  const [index, setIndex] = useState(start?.stepIndex ?? 0);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [mistakes, setMistakes] = useState<string[]>(start?.mistakes ?? []);
  const [errors, setErrors] = useState(start?.errors ?? 0);
  // Repaso con «Paso anterior»: null = paso actual; un número = paso ya resuelto que se está mirando.
  const [viewAt, setViewAt] = useState<number | null>(null);
  const reviewing = viewAt !== null;
  const visibleIndex = viewAt ?? index;
  const activeStep: Step = lesson.steps[visibleIndex];

  const step: Step = lesson.steps[index];
  const total = lesson.steps.length;
  const isLast = index === total - 1;

  const { findBot } = useContent();
  const { t } = useI18n();
  // Se elige una vez al abrir. Una lección retomada no repite la bienvenida.
  const [opening] = useState(() => {
    const bot = findBot(teacherForLesson(lessonId).id) ?? teacherForLesson(lessonId);
    return { bot, welcome: start || noWelcome ? undefined : pickPhrase(bot.teaching.welcome) };
  });
  const guided = activeStep.type === 'line' && activeStep.mode === 'guided';
  const teacher = useMemo(
    () => ({
      bot: opening.bot,
      expression: teacherExpression(activeStep.type, reviewing ? 'correct' : status, guided),
      welcome: !reviewing && index === 0 ? opening.welcome : undefined,
    }),
    [opening, activeStep.type, status, guided, index, reviewing]
  );

  const feedback = useFeedback();

  const onCorrect = useCallback(
    (m?: string) => {
      feedback.correct();
      setStatus('correct');
      setMessage(m ?? '');
    },
    [feedback]
  );

  // Lo que deshace el error a la vista (por ejemplo, la jugada equivocada), para "Reintentar".
  const undoWrong = useRef<(() => void) | null>(null);

  const onWrong = useCallback(
    (m: string, undo?: () => void) => {
      feedback.wrong();
      undoWrong.current = undo ?? null;
      setStatus('wrong');
      setMessage(m);
      setErrors((e) => e + 1);
      setMistakes((list) => (list.includes(step.id) ? list : [...list, step.id]));
    },
    [step.id, feedback]
  );

  const onClear = useCallback(() => {
    undoWrong.current = null;
    setStatus('idle');
    setMessage('');
  }, []);

  /** "Reintentar": deshace lo equivocado y deja seguir desde la misma posición. */
  const retry = () => {
    undoWrong.current?.();
    onClear();
  };

  // Un doble toque en "Terminar" no debe registrar la lección dos veces.
  const finished = useRef(false);

  const next = () => {
    if (isLast) {
      if (finished.current) return;
      finished.current = true;
      onFinish({ errors, xp: lesson.xp, mistakes });
    } else {
      setIndex(index + 1);
      setStatus('idle');
      setMessage('');
      onAdvance?.({ stepIndex: index + 1, errors, mistakes });
    }
  };

  // Al salir por el diálogo, quien llama guarda el avance; al desmontar sin eso (el "atrás" del
  // navegador) se guarda aquí, salvo que la lección haya terminado.
  const exited = useRef(false);
  const latest = useRef<LessonState>({ stepIndex: index, errors, mistakes });
  const onAdvanceRef = useRef(onAdvance);
  useEffect(() => {
    latest.current = { stepIndex: index, errors, mistakes };
    onAdvanceRef.current = onAdvance;
  });
  useEffect(
    () => () => {
      if (!exited.current && !finished.current) onAdvanceRef.current?.(latest.current);
    },
    []
  );

  const confirmExit = () => {
    showDialog(t('lesson.exitTitle'), exitMessage, [
      { text: t('lesson.keepGoing'), style: 'cancel' },
      {
        text: t('common.exit'),
        style: 'destructive',
        onPress: () => {
          exited.current = true;
          onExit({ stepIndex: index, errors, mistakes });
        },
      },
    ]);
  };

  // El botón "atrás" de Android pide la misma confirmación que la ✕.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmExit();
      return true;
    });
    return () => sub.remove();
  });

  const renderStep = () => {
    // En repaso, los pasos van bloqueados y con `replay`: muestran cómo quedaron al terminarlos y no
    // vuelven a avisar (no cobran errores ni dan monedas).
    const callbacks = { onCorrect, onWrong, locked: reviewing || status === 'wrong', replay: reviewing };
    switch (activeStep.type) {
      case 'explain':
        return <ExplainStep step={activeStep} />;
      case 'move':
        return <MoveStep step={activeStep} {...callbacks} />;
      case 'quiz':
        return <QuizStep step={activeStep} {...callbacks} />;
      case 'select_squares':
        return <SelectSquaresStep step={activeStep} {...callbacks} />;
      case 'line':
        return <LineStep step={activeStep} {...callbacks} onClear={onClear} />;
      case 'practice':
        return <PracticeStep step={activeStep} {...callbacks} />;
    }
  };

  const continueLabel = isLast ? t('lesson.finish') : t('common.continue');
  // Pantalla ancha: encabezado y panel de abajo alineados con el tablero y su panel.
  const contentWidth = useBoardLayoutWidth(LESSON_RESERVE);
  const wide = useWideLayout();
  const progress = reviewProgress(viewAt, index, total, status === 'correct');
  // Retroceder al paso anterior ya resuelto (se puede seguir retrocediendo) y volver al paso actual.
  const canGoBack = visibleIndex > 0;
  const goBack = () => {
    if (canGoBack) setViewAt(previousStep(index, viewAt));
  };
  const backToCurrent = () => setViewAt(null);
  // El panel ancho muestra el aviso y el botón junto al profesor, no en la barra del pie.
  const panel: LessonPanelState = reviewing
    ? { status: 'idle', buttonLabel: t('lesson.reviewContinue'), onButton: backToCurrent }
    : {
        status,
        title: status === 'correct' ? t('lesson.correct') : status === 'wrong' ? t('common.incorrect') : undefined,
        message: status === 'idle' ? undefined : message,
        buttonLabel:
          status === 'wrong'
            ? t('common.retry')
            : status === 'correct' || step.type === 'explain'
              ? continueLabel
              : undefined,
        onButton: status === 'wrong' ? retry : next,
      };

  return (
    <View role="main" style={styles.screen}>
      {/* Título para lectores de pantalla: la lección no muestra un encabezado visible. */}
      <Text accessibilityRole="header" aria-level={1} style={styles.srOnly}>{lesson.title}</Text>
      <View style={[styles.header, { paddingTop: statusBarTop(space.sm) }, contentWidth ? { width: contentWidth + space.lg * 2, alignSelf: 'center' } : null]}>
        <Pressable onPress={confirmExit} accessibilityRole="button" accessibilityLabel={t('common.exit')} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <Pressable
          onPress={goBack}
          disabled={!canGoBack}
          accessibilityRole="button"
          accessibilityLabel={t('lesson.previousStep')}
          accessibilityState={{ disabled: !canGoBack }}
          hitSlop={6}
          style={[styles.backBtn, !canGoBack && styles.backBtnOff]}
        >
          <Text style={styles.backGlyph}>←</Text>
        </Pressable>
        <ProgressBar value={progress} />
      </View>

      <LessonPanelContext.Provider value={wide ? panel : null}>
        <TeacherContext.Provider value={teacher}>
          {/* key = id del paso (o del repaso): cada paso empieza con su estado limpio y con el tablero a la vista */}
          <ScrollView key={reviewing ? `review-${activeStep.id}` : activeStep.id} contentContainerStyle={styles.content}>
            {renderStep()}
          </ScrollView>
        </TeacherContext.Provider>
      </LessonPanelContext.Provider>

      {!wide && reviewing && (
        <FeedbackPanel kind="neutral" buttonLabel={t('lesson.reviewContinue')} onButton={backToCurrent} contentWidth={contentWidth} />
      )}
      {!wide && !reviewing && step.type === 'explain' && <FeedbackPanel kind="neutral" buttonLabel={continueLabel} onButton={next} contentWidth={contentWidth} />}
      {!wide && !reviewing && step.type !== 'explain' && status === 'correct' && (
        <FeedbackPanel kind="correct" title={t('lesson.correct')} message={message} buttonLabel={continueLabel} onButton={next} contentWidth={contentWidth} />
      )}
      {!wide && !reviewing && step.type !== 'explain' && status === 'wrong' && (
        <FeedbackPanel kind="wrong" title={t('common.incorrect')} message={message} buttonLabel={t('common.retry')} onButton={retry} contentWidth={contentWidth} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.md },
  close: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.textMuted },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderBottomWidth: 3,
    borderBottomColor: colors.surfaceShadow,
  },
  backBtnOff: { opacity: 0.4 },
  backGlyph: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text, lineHeight: 22 },
  content: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xl },
});
