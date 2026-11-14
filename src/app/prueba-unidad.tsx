import React, { useMemo, useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { showDialog } from '../components/dialog';
import { Lesson, Unit } from '../data/lessonTypes';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { LessonPlayer } from '../lesson/LessonPlayer';
import { unitTestSteps } from '../progress/path';
import { useProgress } from '../progress/ProgressContext';

/**
 * Prueba para saltar a una unidad cerrada (nivel «nuevo», spec del tester, sección 4):
 * 6 ejercicios de la unidad anterior, uno por lección, empezando por las últimas.
 * Se aprueba con un error como máximo; no marca lecciones ni da monedas.
 */
export default function UnitTestRoute() {
  const { unit } = useLocalSearchParams<{ unit?: string }>();
  const target = Number(unit);
  const { units } = useContent();
  const { t } = useI18n();
  const { passUnitTest } = useProgress();
  const [attempt, setAttempt] = useState(0);

  const previous: Unit | undefined = units.find((u) => u.unit === target - 1);
  const steps = useMemo(() => (previous ? unitTestSteps(previous, 6) : []), [previous]);
  const lesson: Lesson | undefined = useMemo(
    () =>
      previous && steps.length > 0
        ? {
            id: `prueba-unidad-${target}`,
            unit: target,
            order: 0,
            title: t('unitTest.title', { unit: target }),
            summary: '',
            xp: 0,
            steps,
          }
        : undefined,
    [previous, steps, target, t]
  );

  if (!Number.isInteger(target) || target < 2 || !previous || !lesson) return <Redirect href="/aprender" />;
  const teacherLessonId = previous.lessons[previous.lessons.length - 1]?.id ?? previous.lessons[0].id;

  return (
    <LessonPlayer
      key={`${target}-${attempt}`}
      lesson={lesson}
      lessonId={teacherLessonId}
      noWelcome
      exitMessage={t('unitTest.exitMessage')}
      onExit={() => router.back()}
      onFinish={({ errors }) => {
        if (errors <= 1) {
          passUnitTest(target);
          showDialog(t('unitTest.passed.title'), t('unitTest.passed.message', { unit: target }), [
            { text: t('common.continue'), onPress: () => router.back() },
          ]);
        } else {
          showDialog(t('unitTest.failed.title'), t('unitTest.failed.message'), [
            { text: t('common.retry'), onPress: () => setAttempt((a) => a + 1) },
            { text: t('common.exit'), style: 'cancel', onPress: () => router.back() },
          ]);
        }
      }}
    />
  );
}
