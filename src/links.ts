// Direcciones públicas de Gradus. Un solo lugar para el repositorio y el correo.
export const SOURCE_URL = 'https://github.com/GradusStudio/ajedrez-app';
export const CONTACT_EMAIL = 'gradusstudioapp@gmail.com';

/**
 * Destinos que `AppLink` acepta: una ruta interna (/privacidad), una dirección https o un correo (mailto:).
 * Cualquier otro esquema (javascript:, data:, file:, intent:…) se rechaza, aunque hoy todos los enlaces sean constantes.
 */
export const isSafeHref = (href: unknown): boolean =>
  typeof href === 'string' && (/^\/(?!\/)/.test(href) || /^(https:\/\/|mailto:)/i.test(href));
