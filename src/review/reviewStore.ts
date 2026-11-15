import AsyncStorage from '@react-native-async-storage/async-storage';
import { isStoredReview, trimReviews, type StoredReview } from './store';

// Revisiones guardadas en el dispositivo (tarea 34). Clave propia, como los ajustes: no van en el progreso
// (pesan y no se sincronizan). La lógica de tope y validación está en store.ts, con pruebas.

export const REVIEWS_KEY = '@ajedrez/reviews';

/** Las revisiones guardadas, la más reciente primero. Si el dato está roto, devuelve [] sin romper la pantalla. */
export async function loadReviews(): Promise<StoredReview[]> {
  try {
    const raw = await AsyncStorage.getItem(REVIEWS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredReview) : [];
  } catch {
    return [];
  }
}

/** Guarda una revisión al frente y descarta la más vieja si ya hay 10. */
export async function saveReview(next: StoredReview): Promise<void> {
  try {
    const list = await loadReviews();
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(trimReviews(list, next)));
  } catch {
    // Sin espacio o en modo privado: la revisión no se guarda y la app sigue igual.
  }
}
