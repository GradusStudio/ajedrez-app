import { useCallback, useEffect, useState } from 'react';

export type InstallPromptResult = 'accepted' | 'dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallPromptResult }>;
};

// Chrome avisa una sola vez con `beforeinstallprompt`; el evento se guarda a nivel de módulo
// para que lo vean las pantallas que se montan después de que llegó.
let saved: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    saved = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    saved = null;
    notify();
  });
}

export function useInstallPrompt(): { canPrompt: boolean; prompt: () => Promise<InstallPromptResult> } {
  const [canPrompt, setCanPrompt] = useState(false);
  useEffect(() => {
    const sync = () => setCanPrompt(saved !== null);
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const prompt = useCallback(async (): Promise<InstallPromptResult> => {
    const event = saved;
    if (!event) return 'dismissed';
    // El evento sirve una sola vez: se descarta antes de preguntar.
    saved = null;
    notify();
    try {
      await event.prompt();
      return (await event.userChoice).outcome;
    } catch {
      return 'dismissed';
    }
  }, []);

  return { canPrompt, prompt };
}
