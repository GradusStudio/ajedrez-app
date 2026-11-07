import { useSyncExternalStore } from 'react';
import { detectInstallPlatform, InstallPlatform } from './installPlatform';
import { isStandalone } from './standalone.web';

function read(): InstallPlatform {
  const nav = navigator as Navigator;
  return detectInstallPlatform(nav.userAgent ?? '', isStandalone(), nav.maxTouchPoints ?? 0);
}

const subscribe = () => () => {};

// null en la exportación estática (no hay navegador): el HTML y la primera pintura del cliente coinciden.
export function useInstallPlatform(): InstallPlatform | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
