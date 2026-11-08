import { useEffect } from 'react';
import { usePathname, useSegments } from 'expo-router';
import { useI18n } from '../i18n/I18nContext';
import { routeMeta, type RouteMeta } from './routeMeta';

/** Devuelve la etiqueta del `<head>` que coincide con `selector`, o la crea. */
function headTag(selector: string, tag: 'meta' | 'link', attrs: Record<string, string>): HTMLElement {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    document.head.appendChild(el);
  }
  return el;
}

function apply(m: RouteMeta): void {
  document.title = m.title;
  headTag('meta[name="description"]', 'meta', { name: 'description' }).setAttribute('content', m.description);
  headTag('link[rel="canonical"]', 'link', { rel: 'canonical' }).setAttribute('href', m.canonical);
  headTag('meta[property="og:title"]', 'meta', { property: 'og:title' }).setAttribute('content', m.title);
  headTag('meta[property="og:description"]', 'meta', { property: 'og:description' }).setAttribute('content', m.description);
  headTag('meta[property="og:url"]', 'meta', { property: 'og:url' }).setAttribute('content', m.canonical);
  const robots = document.head.querySelector('meta[name="robots"]');
  if (m.noindex) headTag('meta[name="robots"]', 'meta', { name: 'robots' }).setAttribute('content', 'noindex');
  else robots?.remove();
}

/** Título, descripción, dirección canónica y noindex de la pestaña según la ruta y el idioma elegido. */
export function useRouteMeta(): void {
  const { t } = useI18n();
  const pathname = usePathname();
  const segments = useSegments() as string[];
  const notFound = segments[0] === '+not-found';
  const meta = routeMeta(pathname, notFound, t);
  // `t` es una función nueva en cada render: el efecto depende del resultado, no de ella.
  useEffect(() => {
    apply(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.title, meta.description, meta.canonical, meta.noindex]);
}
