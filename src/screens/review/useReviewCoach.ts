import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { findBot as findBaseBot } from '../../data/bots';
import { useContent } from '../../data/useContent';

const COACH_KEY = '@ajedrez/reviewCoach';
const DEFAULT_COACH = 'ramiro';

/** Bot que comenta la revisión; la elección se recuerda entre partidas. `initialId` la fija (revisión guardada). */
export function useReviewCoach(initialId?: string) {
  const { bots, findBot } = useContent();
  const [coachId, setCoachId] = useState(initialId ?? DEFAULT_COACH);
  // Si la persona elige mientras se lee la preferencia guardada, gana su elección.
  const chosen = useRef(false);

  useEffect(() => {
    if (initialId) return;
    let cancelled = false;
    AsyncStorage.getItem(COACH_KEY)
      .then((id) => {
        if (!cancelled && !chosen.current && id && findBaseBot(id)) setCoachId(id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialId]);

  const choose = (id: string) => {
    chosen.current = true;
    setCoachId(id);
    AsyncStorage.setItem(COACH_KEY, id).catch(() => {});
  };

  // El bot con su nombre en el idioma elegido (los ids son los mismos en los cinco).
  return { coach: findBot(coachId) ?? bots[0], choose };
}
