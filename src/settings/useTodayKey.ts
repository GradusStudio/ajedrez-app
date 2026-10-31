import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayKey } from '../progress/streak';

/** Milisegundos hasta la próxima medianoche local (con un segundo de margen). */
function msToMidnight(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return next.getTime() - now.getTime();
}

/** Fecha de hoy (día local) que se actualiza sola al volver a la app y a medianoche. */
export function useTodayKey(): string {
  const [today, setToday] = useState(() => todayKey());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      setToday(todayKey());
      clearTimeout(timer);
      timer = setTimeout(refresh, msToMidnight());
    };
    timer = setTimeout(refresh, msToMidnight());
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return today;
}
