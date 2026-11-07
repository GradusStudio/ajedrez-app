// Detecta desde qué sistema se abre la web para mostrar los pasos de instalación que le corresponden.
// Módulo puro (sin React Native ni navegador) para poder probarlo con User-Agent reales.
export type InstallPlatform = 'installed' | 'ios' | 'android' | 'desktop';

export function detectInstallPlatform(userAgent: string, standalone: boolean, maxTouchPoints: number): InstallPlatform {
  if (standalone) return 'installed';
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios';
  // Desde iPadOS 13, Safari del iPad se presenta como un Mac: lo delata la pantalla táctil.
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return 'ios';
  if (/Android/.test(userAgent)) return 'android';
  return 'desktop';
}

/**
 * En iPhone y iPad la app instalada guarda sus datos aparte de Safari: hay que avisar que se guarde una copia
 * antes de instalar y se cargue en la app (diseño web, sección 3). En los demás sistemas el progreso sigue ahí.
 */
export function needsCopyBeforeInstall(platform: InstallPlatform | null): boolean {
  return platform === 'ios';
}
