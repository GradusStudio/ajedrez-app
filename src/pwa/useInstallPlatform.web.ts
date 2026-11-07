import { useSyncExternalStore } from 'react';
import { detectInstallPlatform, InstallPlatform } from './installPlatform';

function read(): InstallPlatform {
  const nav = navigator as Navigator & { standalone?: boolean };
  let standalone = nav.standalone === true;
  try {
    standalone = standalone || window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    // Sin matchMedia se usa solo la señal de Safari.
  }
  return detectInstallPlatform(nav.userAgent ?? '', standalone, nav.maxTouchPoints ?? 0);
}

const subscribe = () => () => {};

// null en la exportación estática (no hay navegador): el HTML y la primera pintura del cliente coinciden.
export function useInstallPlatform(): InstallPlatform | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
