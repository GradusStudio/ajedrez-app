// Arma la portada estática de graduschess.com en dist/ y acomoda la app, que `expo export` deja en dist/app.
// Uso: `npx tsx scripts/build-portada.ts` (lo corre `npm run build:web`, después de exportar la app).
//
// La portada no copia textos a mano: título, descripción, la bienvenida y los enlaces legales salen de
// src/i18n; el paso del peón (u1-l07-s05) de la lección real; la frase de Pipo y la lista de bots de bots.json.
// Lo único propio está en sitio/textos.json.
//
// Con dist/app presente, además:
//   - mueve a la raíz los archivos del sitio que Expo copia desde public/ (_headers, _redirects, robots, sitemap);
//   - copia el index.html de la app como dist/app/404.html: Cloudflare lo sirve para las rutas de la app que no son
//     archivos (`not_found_handling: 404-page` en wrangler.jsonc), y como instalar.html, privacidad.html y
//     terminos.html, para que esas páginas indexables respondan 200.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { de } from '../src/i18n/de';
import { en } from '../src/i18n/en';
import { es } from '../src/i18n/es';
import { fr } from '../src/i18n/fr';
import { it } from '../src/i18n/it';
import { PIECE_PATHS, type PieceKey } from '../src/pieces/pieceSets';

const ROOT = path.join(__dirname, '..');
const SITIO = path.join(ROOT, 'sitio');
const DIST = path.join(ROOT, 'dist');
const APP = path.join(DIST, 'app');
const OUT = path.join(DIST, 'portada');

const LANGS = ['es', 'en', 'de', 'it', 'fr'] as const;
type Lang = (typeof LANGS)[number];
const CATALOGS: Record<Lang, Record<string, string>> = { es, en, de, it, fr };
const LESSON = 'u1-l07';
const STEP_INTRO = 'u1-l07-s01';
const STEP_MOVE = 'u1-l07-s05';
/** Páginas de la app que buscadores indexan (src/seo/routeMeta.ts, INDEXABLE_PATHS sin la raíz). */
const STATIC_APP_PAGES = ['instalar', 'privacidad', 'terminos'];
/** Archivos que Expo copia desde public/ a dist/app pero que son del sitio entero. */
const SITE_FILES = ['_headers', '_redirects', 'robots.txt', 'sitemap.xml'];

type Bot = { id: string; name: string; elo: number; style: string; teaching: { welcome: string[] } };
type Step = { id: string; text?: string; prompt?: string; hint?: string };

const readJson = <T>(p: string): T => JSON.parse(fs.readFileSync(p, 'utf8')) as T;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

// ---------- Datos ----------

const bots = readJson<{ bots: Bot[] }>(path.join(ROOT, 'src', 'data', 'bots.json')).bots;
const pipo = bots.find((b) => b.id === 'pipo')!;
const elos = bots.map((b) => b.elo);

function lessonTexts(lang: Lang): { intro: string; prompt: string; hint: string } {
  if (lang === 'es') {
    const unit = readJson<{ lessons: { id: string; steps: Step[] }[] }>(path.join(ROOT, 'src', 'data', 'unidad-1-lo-basico.json'));
    const steps = unit.lessons.find((l) => l.id === LESSON)!.steps;
    const intro = steps.find((s) => s.id === STEP_INTRO)!;
    const move = steps.find((s) => s.id === STEP_MOVE)!;
    return { intro: intro.text!, prompt: move.prompt!, hint: move.hint! };
  }
  const unit = readJson<{ lessons: Record<string, { steps: Record<string, Partial<Step>> }> }>(
    path.join(ROOT, 'src', 'data', 'i18n', lang, 'unidad-1.json'),
  );
  const steps = unit.lessons[LESSON].steps;
  return { intro: steps[STEP_INTRO].text!, prompt: steps[STEP_MOVE].prompt!, hint: steps[STEP_MOVE].hint! };
}

function pipoWelcome(lang: Lang): string {
  if (lang === 'es') return pipo.teaching.welcome[2];
  const b = readJson<Record<string, { teaching: { welcome: string[] } }>>(path.join(ROOT, 'src', 'data', 'i18n', lang, 'bots.json'));
  return b.pipo.teaching.welcome[2];
}

const own = readJson<Record<string, Record<string, string>>>(path.join(SITIO, 'textos.json'));

function texts(lang: Lang): Record<string, string> {
  const c = CATALOGS[lang];
  const o = own[lang];
  const l = lessonTexts(lang);
  for (const k of Object.keys(own.es)) if (!o[k]) throw new Error(`sitio/textos.json: falta «${k}» en ${lang}`);
  return {
    ...o,
    'meta.title': c['meta.title'],
    'meta.description': c['meta.description'],
    h1: c['onboarding.title'],
    lede: c['onboarding.text'],
    privacy: c['privacy.link'],
    terms: c['terms.link'],
    say: `${pipoWelcome(lang)} ${l.intro}`,
    ask: l.prompt,
    hint: l.hint,
    bots: fmt(o.bots, { min: Math.min(...elos), max: Math.max(...elos) }),
  };
}

// ---------- Tablero ----------

const LIGHT = '#EBECD0';
const DARK = '#779556';
/** Margen de la pieza dentro de la casilla, como Piece.tsx (89 % de la casilla). */
const PIECE_SCALE = 0.89;

function pieceSvg(key: PieceKey, x: number, y: number): string {
  const p = PIECE_PATHS.clasico[key];
  const off = (100 * (1 - PIECE_SCALE)) / 2;
  return `<g transform="translate(${x * 100 + off} ${y * 100 + off}) scale(${PIECE_SCALE})"><path fill="#FFFFFF" fill-rule="evenodd" d="${p.sil}"/><path fill="#111111" fill-rule="evenodd" d="${p.ink}"/></g>`;
}

function boardHtml(lang: Lang): string {
  const parts: string[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      parts.push(`<rect x="${x * 100}" y="${y * 100}" width="100" height="100" fill="${(x + y) % 2 === 0 ? LIGHT : DARK}"/>`);
    }
  }
  // Coordenadas como en la app: letras en la primera fila (abajo a la derecha) y números en la columna a.
  const coord = (x: number, y: number) => ((x + y) % 2 === 0 ? DARK : LIGHT);
  for (let x = 0; x < 8; x++) {
    parts.push(`<text x="${x * 100 + 93}" y="${793}" text-anchor="end" fill="${coord(x, 7)}">${String.fromCharCode(97 + x)}</text>`);
  }
  for (let y = 0; y < 8; y++) {
    parts.push(`<text x="7" y="${y * 100 + 24}" fill="${coord(0, y)}">${8 - y}</text>`);
  }
  parts.push(pieceSvg('wk', 4, 7), pieceSvg('bk', 4, 0));
  const svg = `<svg viewBox="0 0 800 800" aria-hidden="true" font-family="Nunito, system-ui, sans-serif" font-weight="800" font-size="20">${parts.join('')}</svg>`;
  const p = PIECE_PATHS.clasico.wp;
  const pawn = `<button class="pawn" id="pawn" type="button" aria-label="${esc(fmt(own[lang].pawnLabel, { sq: 'e2' }))}" style="transform:translate(400%,600%)"><svg viewBox="0 0 100 100" aria-hidden="true"><g transform="translate(5.5 5.5) scale(${PIECE_SCALE})"><path fill="#FFFFFF" fill-rule="evenodd" d="${p.sil}"/><path fill="#111111" fill-rule="evenodd" d="${p.ink}"/></g></svg></button>`;
  return `${svg}<div class="sq" id="hl-a" hidden></div><div class="sq" id="hl-b" hidden></div>${pawn}`;
}

function botListHtml(t: Record<string, string>): string {
  return bots
    .map(
      (b) =>
        `<li><a href="/app/bot/${b.id}" data-bot="${b.id}" data-name="${esc(b.name)}" data-elo="${b.elo}" aria-label="${esc(fmt(t.botLabel, { name: b.name, elo: b.elo }))}">` +
        `<span class="avatar s-${b.style}"><img src="/portada/bots/${b.id}.webp" alt="" width="64" height="64" loading="lazy" /></span>` +
        `<span class="bot-name">${esc(b.name)}</span><span class="bot-elo">Elo ${b.elo}</span></a></li>`,
    )
    .join('\n          ');
}

// ---------- Salida ----------

function render(template: string, values: Record<string, string>): string {
  const out = template.replace(/\{\{([\w.]+)\}\}/g, (m, k: string) => {
    if (!(k in values)) throw new Error(`sitio/index.html: no hay valor para {{${k}}}`);
    return values[k];
  });
  return out;
}

async function images(): Promise<void> {
  fs.mkdirSync(path.join(OUT, 'bots'), { recursive: true });
  // Los avatares originales miden 1254 px: en la portada se ven a 64 px (128 para pantallas densas).
  for (const b of bots) {
    await sharp(path.join(ROOT, 'assets', 'bots', `${b.id}.webp`))
      .resize(128, 128)
      .webp({ quality: 82 })
      .toFile(path.join(OUT, 'bots', `${b.id}.webp`));
  }
  for (const expr of ['explica', 'piensa', 'acierto', 'pista']) {
    await sharp(path.join(ROOT, 'assets', 'bots', 'expresiones', `pipo-${expr}.webp`))
      .resize(144, 144)
      .webp({ quality: 85 })
      .toFile(path.join(OUT, `pipo-${expr}.webp`));
  }
}

function fonts(): void {
  const dir = path.join(OUT, 'fuentes');
  fs.mkdirSync(dir, { recursive: true });
  for (const [folder, file] of [
    ['700Bold', 'Nunito_700Bold.ttf'],
    ['800ExtraBold', 'Nunito_800ExtraBold.ttf'],
  ]) {
    fs.copyFileSync(path.join(ROOT, 'node_modules', '@expo-google-fonts', 'nunito', folder, file), path.join(dir, file));
  }
}

function arrangeApp(): void {
  if (!fs.existsSync(path.join(APP, 'index.html'))) {
    console.log('dist/app no existe: solo se armó la portada (para la app, `npm run build:web`).');
    return;
  }
  for (const f of SITE_FILES) {
    const from = path.join(APP, f);
    if (!fs.existsSync(from)) throw new Error(`Falta dist/app/${f} (debería venir de public/${f})`);
    fs.renameSync(from, path.join(DIST, f));
  }
  const appHtml = path.join(APP, 'index.html');
  fs.copyFileSync(appHtml, path.join(APP, '404.html'));
  for (const page of STATIC_APP_PAGES) fs.copyFileSync(appHtml, path.join(APP, `${page}.html`));
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });
  const all = Object.fromEntries(LANGS.map((l) => [l, texts(l)])) as Record<Lang, Record<string, string>>;
  const es = all.es;
  const escaped = Object.fromEntries(Object.entries(es).map(([k, v]) => [k, esc(v)]));
  const html = render(fs.readFileSync(path.join(SITIO, 'index.html'), 'utf8'), {
    ...escaped,
    board: boardHtml('es'),
    botList: botListHtml(es),
  });
  fs.writeFileSync(path.join(DIST, 'index.html'), html);
  fs.writeFileSync(
    path.join(OUT, 'datos.js'),
    `// GENERADO por scripts/build-portada.ts. No editar.\nwindow.GRADUS_PORTADA = ${JSON.stringify({ langs: all })};\n`,
  );
  for (const f of ['portada.css', 'portada.js', 'inicio.js']) fs.copyFileSync(path.join(SITIO, f), path.join(OUT, f));
  const notFound = render(fs.readFileSync(path.join(SITIO, '404.html'), 'utf8'), {
    title: esc(CATALOGS.es['meta.notFound']),
  });
  fs.writeFileSync(path.join(DIST, '404.html'), notFound);
  fonts();
  await images();
  arrangeApp();
  const kb = (p: string) => Math.round(fs.statSync(p).size / 1024);
  console.log(
    `Portada: index.html ${kb(path.join(DIST, 'index.html'))} KB, datos.js ${kb(path.join(OUT, 'datos.js'))} KB, ` +
      `portada.js ${kb(path.join(OUT, 'portada.js'))} KB, portada.css ${kb(path.join(OUT, 'portada.css'))} KB.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
