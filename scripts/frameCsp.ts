// Hashes CSP de los scripts en línea de los iframes del motor: van en `srcdoc`, heredan la CSP y entran por hash.
// Uso: `npx tsx scripts/frameCsp.ts` imprime los hashes; con `--write` los pone en public/_headers.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildEngineHtml } from '../src/engine/engineHtml';
import { FRAME_SHIM } from '../src/engine/frameShim';
import { buildMaiaHtml } from '../src/engine/maia/maiaHtml';
import { loadNetBase64, MAIA_NETS } from '../src/engine/maia/nets';

export const HEADERS_FILE = path.join(__dirname, '..', 'public', '_headers');

const inlineScripts = (html: string) => [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const hash = (js: string) => `'sha256-${createHash('sha256').update(js, 'utf8').digest('base64')}'`;

export async function frameScriptHashes(): Promise<string[]> {
  const pages = [FRAME_SHIM + buildEngineHtml()];
  for (const id of MAIA_NETS) pages.push(FRAME_SHIM + buildMaiaHtml(await loadNetBase64(id)));
  return [...new Set(pages.flatMap(inlineScripts).map(hash))];
}

if (require.main === module) {
  frameScriptHashes().then((hashes) => {
    if (!process.argv.includes('--write')) return console.log(hashes.join(' '));
    const src = fs.readFileSync(HEADERS_FILE, 'utf8');
    const out = src.replace(/(script-src[^;]*?)( 'sha256-[^ ;]+)*( 'wasm-unsafe-eval')/, `$1 ${hashes.join(' ')}$3`);
    fs.writeFileSync(HEADERS_FILE, out);
    console.log(`public/_headers: ${hashes.length} hashes`);
  });
}
