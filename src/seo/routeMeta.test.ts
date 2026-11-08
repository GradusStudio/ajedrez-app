import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPath, routeMeta } from './routeMeta';

const texts: Record<string, string> = {
  'meta.title': 'Gradus Chess: aprende ajedrez',
  'meta.description': 'Descripción',
  'meta.notFound': 'Página no encontrada · Gradus',
  'privacy.link': 'Política de privacidad',
  'terms.link': 'Términos y condiciones',
};
const t = (k: string) => texts[k];

test('cleanPath: sin barra final, parámetros ni ancla', () => {
  assert.equal(cleanPath('/'), '/');
  assert.equal(cleanPath(''), '/');
  assert.equal(cleanPath('/privacidad/'), '/privacidad');
  assert.equal(cleanPath('/privacidad?x=1#a'), '/privacidad');
});

test('inicio: título del sitio y canónica en la raíz', () => {
  const m = routeMeta('/', false, t as never);
  assert.equal(m.title, 'Gradus Chess: aprende ajedrez');
  assert.equal(m.canonical, 'https://graduschess.com/');
  assert.equal(m.noindex, false);
});

test('privacidad y términos: título propio y canónica propia', () => {
  const p = routeMeta('/privacidad', false, t as never);
  assert.equal(p.title, 'Política de privacidad · Gradus');
  assert.equal(p.canonical, 'https://graduschess.com/privacidad');
  const s = routeMeta('/terminos/', false, t as never);
  assert.equal(s.title, 'Términos y condiciones · Gradus');
  assert.equal(s.canonical, 'https://graduschess.com/terminos');
});

test('instalar: indexable, con el título del sitio', () => {
  const m = routeMeta('/instalar', false, t as never);
  assert.equal(m.canonical, 'https://graduschess.com/instalar');
  assert.equal(m.noindex, false);
});

test('una pantalla de la app apunta a la página de inicio', () => {
  for (const path of ['/leccion/u1-l02', '/partida', '/puzzle', '/aperturas']) {
    const m = routeMeta(path, false, t as never);
    assert.equal(m.canonical, 'https://graduschess.com/', path);
    assert.equal(m.title, 'Gradus Chess: aprende ajedrez', path);
  }
});

test('ruta inexistente: título propio y noindex', () => {
  const m = routeMeta('/ruta-que-no-existe', true, t as never);
  assert.equal(m.title, 'Página no encontrada · Gradus');
  assert.equal(m.noindex, true);
  assert.equal(m.canonical, 'https://graduschess.com/');
});
