// Genera las claves VAPID de Web Push del Worker `gradus-sync` (una sola vez).
// Uso: `npx tsx scripts/generate-vapid.ts`.
//
// La pública va en src/settings/pushConfig.ts y en `vars.VAPID_PUBLIC_KEY` de wrangler.sync.jsonc.
// La privada es un secreto del Worker: `npx wrangler secret put VAPID_PRIVATE_KEY -c wrangler.sync.jsonc`.
// No pegarla en el chat, en el repositorio ni en la documentación.
import { webcrypto } from 'node:crypto';

const { subtle } = webcrypto;

/** base64url sin relleno, el formato de la API de Push y de `jwk.d`. */
function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

async function main(): Promise<void> {
  const pair = (await subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair;
  const raw = new Uint8Array(await subtle.exportKey('raw', pair.publicKey));
  const jwk = (await subtle.exportKey('jwk', pair.privateKey)) as JsonWebKey;
  if (!jwk.d) throw new Error('La clave privada no tiene el componente d.');

  console.log(`VAPID_PUBLIC_KEY=${base64url(raw)}`);
  console.log(`VAPID_PRIVATE_KEY=${jwk.d}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
