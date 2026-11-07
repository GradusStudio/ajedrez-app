export type InstallPromptResult = 'accepted' | 'dismissed';

// En el celular no hay diálogo de instalación del navegador.
export function useInstallPrompt(): { canPrompt: boolean; prompt: () => Promise<InstallPromptResult> } {
  return { canPrompt: false, prompt: async () => 'dismissed' };
}
