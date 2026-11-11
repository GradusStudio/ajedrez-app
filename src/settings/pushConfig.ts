// Clave pública VAPID de Gradus (la privada vive como secreto del Worker, nunca en el repositorio). Se genera con
// `npx tsx scripts/generate-vapid.ts` y se pega también en `vars.VAPID_PUBLIC_KEY` de wrangler.sync.jsonc. Mientras
// siga el marcador, activar el recordatorio no hace nada: sin clave no se puede crear la suscripción.
export const VAPID_PUBLIC_KEY = 'REEMPLAZAR';
