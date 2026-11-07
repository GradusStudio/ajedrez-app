import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type Haptic = 'success' | 'error' | 'tap';

export function vibrate(kind: Haptic) {
  if (Platform.OS === 'android' && kind === 'error') {
    // El error usa el vibrador directo: la vibración de interfaz (performAndroidHapticsAsync) depende del
    // ajuste "vibración al tocar" del sistema, que en muchos teléfonos está apagado. Probado en un Redmi (Android 15).
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  } else if (Platform.OS === 'android') {
    // Acierto: vibración de interfaz, la recomendada en Android (no pide permisos).
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(() => {});
  } else {
    Haptics.notificationAsync(
      kind === 'error' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success
    ).catch(() => {});
  }
}
