import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../settings/SettingsContext';

// Sonidos y vibración de la app. Los sonidos son los de assets/sounds, generados con ComfyUI (Stable Audio Open); los anteriores sintetizados están en assets/fuente/sonidos/previos.
// Respetan los ajustes "Sonido" y "Vibración" de la app. Suenan aunque el timbre del teléfono esté en silencio (ver playSound).

export type SoundName = 'move' | 'capture' | 'correct' | 'wrong';

const SOURCES: Record<SoundName, number> = {
  move: require('../../assets/sounds/move.wav'),
  capture: require('../../assets/sounds/capture.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
};

// Un reproductor por sonido, creado la primera vez y reutilizado (viven mientras la app esté abierta).
const players: Partial<Record<SoundName, AudioPlayer>> = {};
let audioModeSet = false;

function playSound(name: SoundName) {
  try {
    if (!audioModeSet) {
      audioModeSet = true;
      // Mezclar con la música de otras apps. `playsInSilentMode` tiene que ser true: en Android, con false,
      // expo-audio descarta play() sin avisar cuando el timbre del teléfono está en vibración o silencio
      // (comprobado en un Redmi con Android 15). El volumen de medios es independiente del timbre; quien no
      // quiera sonido lo apaga en Ajustes > Sonido.
      setAudioModeAsync({ interruptionMode: 'mixWithOthers', playsInSilentMode: true }).catch(() => {});
    }
    const player = (players[name] ??= createAudioPlayer(SOURCES[name]));
    player.seekTo(0).then(() => player.play(), () => player.play());
  } catch {
    // Un sonido que falla no debe romper nada.
  }
}

type Haptic = 'success' | 'error';

function vibrate(kind: Haptic) {
  if (Platform.OS === 'android' && kind === 'error') {
    // El error usa el vibrador directo: la vibración de interfaz (performAndroidHapticsAsync) depende del
    // ajuste "vibración al tocar" del sistema, que en muchos teléfonos está apagado. Probado en un Redmi (Android 15).
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  } else if (Platform.OS === 'android') {
    // Acierto: vibración de interfaz, la recomendada en Android (no pide permisos).
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(() => {});
  } else {
    Haptics.notificationAsync(
      kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    ).catch(() => {});
  }
}

/** Sonidos y vibración según los ajustes del usuario. */
export function useFeedback() {
  const { settings } = useSettings();
  const { sound, vibration } = settings;

  const move = useCallback((capture: boolean) => {
    if (sound) playSound(capture ? 'capture' : 'move');
  }, [sound]);

  const correct = useCallback(() => {
    if (sound) playSound('correct');
    if (vibration) vibrate('success');
  }, [sound, vibration]);

  const wrong = useCallback(() => {
    if (sound) playSound('wrong');
    if (vibration) vibrate('error');
  }, [sound, vibration]);

  return useMemo(() => ({ move, correct, wrong }), [move, correct, wrong]);
}
