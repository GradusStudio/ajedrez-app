import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Lesson } from '../../data/lessonTypes';
import { useContent } from '../../data/useContent';
import { useI18n } from '../../i18n/I18nContext';
import { LessonPlayer } from '../../lesson/LessonPlayer';
import { useProgress } from '../../progress/ProgressContext';

// Tope por sesión para el tiempo de práctica: si la app quedó abierta sin usar, no cuenta todo.
const MAX_SESSION_SECONDS = 30 * 60;

/**
 * Una lección. Con `repaso` (ids de pasos separados por coma) muestra solo esos pasos:
 * es el repaso de errores que se abre desde el resultado.
 */
export default function LessonRoute() {
  const { id, repaso } = useLocalSearchParams<{ id: string; repaso?: string }>();
  const { progress, finishLesson, finishReview, saveDraft, addPractice } = useProgress();
  // Momento en que se abrió la lección (se fija al montar: el render tiene que ser puro).
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const { findLesson } = useContent();
  const { t } = useI18n();
  const base = findLesson(id);

  const reviewIds = useMemo(() => (repaso ? repaso.split(',').filter(Boolean) : []), [repaso]);
  const isReview = reviewIds.length > 0;
  const lesson: Lesson | undefined = useMemo(() => {
    if (!base || !isReview) return base;
    return { ...base, title: t('lesson.reviewTitle', { title: base.title }), steps: base.steps.filter((s) => reviewIds.includes(s.id)) };
  }, [base, isReview, reviewIds, t]);

  // El avance guardado se lee una sola vez, al abrir.
  const [initial] = useState(() => (isReview ? undefined : progress.drafts[id]));

  if (!base || !lesson || lesson.steps.length === 0) return <Redirect href="/" />;

  const seconds = () => Math.min((Date.now() - startedAt.current) / 1000, MAX_SESSION_SECONDS);

  return (
    <LessonPlayer
      key={lesson.id + (isReview ? '-repaso' : '')}
      lesson={lesson}
      lessonId={base.id}
      noWelcome={isReview}
      initial={initial}
      exitMessage={isReview ? t('lesson.exitReviewMessage') : t('lesson.exitMessage')}
      onAdvance={isReview ? undefined : (state) => saveDraft(base.id, state)}
      onExit={(state) => {
        if (!isReview) saveDraft(base.id, state);
        addPractice(seconds());
        router.back();
      }}
      onFinish={(result) => {
        let earned = { coins: 0, dailyBonus: 0, streakRecovered: false };
        if (isReview) {
          earned = finishReview({
            lessonId: base.id,
            // Solo los pasos que la lección tiene de verdad: el parámetro de la ruta puede traer cualquier cosa.
            stepIds: lesson.steps.map((s) => s.id),
            failed: result.mistakes,
            seconds: seconds(),
          });
        } else {
          earned = finishLesson({
            lessonId: base.id,
            lessonCoins: base.xp,
            errors: result.errors,
            mistakes: result.mistakes,
            seconds: seconds(),
          });
        }
        // replace: desde el resultado, "atrás" vuelve a la ruta y no a la lección terminada.
        router.replace({
          pathname: '/resultado',
          params: {
            id: base.id,
            errors: String(result.errors),
            monedas: String(earned.coins),
            premio: String(earned.dailyBonus),
            ...(earned.streakRecovered ? { recuperada: '1' } : {}),
            fallos: result.mistakes.join(','),
            modo: isReview ? 'repaso' : 'leccion',
          },
        });
      }}
    />
  );
}
