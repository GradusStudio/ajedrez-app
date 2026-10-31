import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { localizedContent } from './localized';

/** Unidades, aperturas y bots en el idioma elegido, con las búsquedas por id. */
export function useContent() {
  const { language } = useI18n();
  return useMemo(() => {
    const { units, openings, bots } = localizedContent(language);
    return {
      units,
      openings,
      bots,
      findLesson: (id: string) => {
        for (const group of [...units, ...openings]) {
          const lesson = group.lessons.find((l) => l.id === id);
          if (lesson) return lesson;
        }
        return undefined;
      },
      findOpening: (id: string) => openings.find((o) => o.id === id),
      findBot: (id: string) => bots.find((b) => b.id === id),
    };
  }, [language]);
}
