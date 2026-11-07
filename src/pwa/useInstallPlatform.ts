import type { InstallPlatform } from './installPlatform';

// En el celular (app nativa) no hay nada que instalar: nunca se ofrece.
export function useInstallPlatform(): InstallPlatform | null {
  return null;
}
