import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bots, findBot } from '../../data/bots';

const COACH_KEY = '@ajedrez/reviewCoach';
const DEFAULT_COACH = 'ramiro';

/** Bot que comenta la revisión; la elección se recuerda entre partidas. `initialId` la fija (revisión guardada). */
export function useReviewCoach(initialId?: string) {
  const [coachId, setCoachId] = useState(initialId ?? DEFAULT_COACH);

  useEffect(() => {
    if (initialId) return;
    AsyncStorage.getItem(COACH_KEY)
      .then((id) => id && findBot(id) && setCoachId(id))
      .catch(() => {});
  }, [initialId]);

  const choose = (id: string) => {
    setCoachId(id);
    AsyncStorage.setItem(COACH_KEY, id).catch(() => {});
  };

  return { coach: findBot(coachId) ?? bots[0], choose };
}
