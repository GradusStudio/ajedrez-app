import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../settings/SettingsContext';

// Sonidos y vibración de la app. Los sonidos son propios (scripts/build-sounds.js).
// Respetan los ajustes "Sonido" y "Vibración", y el modo silencio del teléfono.

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
      // Mezclar con la música de otras apps y callarse si el teléfono está en silencio.
      setAudioModeAsync({ interruptionMode: 'mixWithOthers', playsInSilentMode: false }).catch(() => {});
    }
    const player = (players[name] ??= createAudioPlayer(SOURCES[name]));
    player.seekTo(0).then(() => player.play(), () => player.play());
  } catch {
    // Un sonido que falla no debe romper nada.
  }
}

type Haptic = 'success' | 'error';

function vibrate(kind: Haptic) {
  if (Platform.OS === 'android') {
    // Recomendado en Android: no usa el motor de vibración clásico ni pide permisos.
    Haptics.performAndroidHapticsAsync(
      kind === 'success' ? Haptics.AndroidHaptics.Confirm : Haptics.AndroidHaptics.Reject
    ).catch(() => {});
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
