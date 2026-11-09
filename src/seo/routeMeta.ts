// Título, descripción y dirección canónica de cada ruta de la web. Puro: lo usa `useRouteMeta.web.ts`.

export const SITE_URL = 'https://graduschess.com';

/** La app web vive en /app (experiments.baseUrl en app.json); la raíz es la portada estática (sitio/index.html). */
export const APP_BASE = '/app';

/** Páginas que los buscadores pueden indexar, como rutas de la app ('/' es la portada). El resto son pantallas de la app. */
export const INDEXABLE_PATHS = ['/', '/instalar', '/privacidad', '/terminos'] as const;

type Translate = (key: 'meta.title' | 'meta.description' | 'meta.notFound' | 'privacy.link' | 'terms.link') => string;

/** Dirección pública de una ruta de la app: '/' es la portada; el resto va bajo /app. */
export function publicUrl(path: string): string {
  return path === '/' ? SITE_URL + '/' : SITE_URL + APP_BASE + path;
}

export type RouteMeta = { title: string; description: string; canonical: string; noindex: boolean };

/** Sin barra final (salvo la raíz), sin parámetros ni ancla: `/privacidad/?x=1#a` es `/privacidad`. */
export function cleanPath(pathname: string): string {
  const bare = (pathname.split(/[?#]/)[0] || '/').replace(/\/+$/, '');
  return bare === '' ? '/' : bare;
}

export function routeMeta(pathname: string, notFound: boolean, t: Translate): RouteMeta {
  const description = t('meta.description');
  if (notFound) return { title: t('meta.notFound'), description, canonical: publicUrl('/'), noindex: true };
  const path = cleanPath(pathname);
  const pageTitle =
    path === '/privacidad' ? t('privacy.link') : path === '/terminos' ? t('terms.link') : undefined;
  const title = pageTitle ? `${pageTitle} · Gradus` : t('meta.title');
  // Una pantalla de la app (una lección, una partida) apunta a la página de inicio: no es contenido propio.
  const indexable = (INDEXABLE_PATHS as readonly string[]).includes(path);
  return { title, description, canonical: publicUrl(indexable ? path : '/'), noindex: false };
}
