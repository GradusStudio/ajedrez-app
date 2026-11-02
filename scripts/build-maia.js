// Empaqueta las redes de Maia para la app: `npm run build:maia`.
//
// 1. Si falta alguna red original en src/engine/maia/redes/maia-<nivel>.pb.gz, la baja de
//    https://github.com/CSSLab/maia-chess (carpeta maia_weights, licencia GPL v3) y comprueba que sea
//    exactamente ese archivo (SHA-256).
// 2. Genera src/engine/maia/redes/maia<nivel>.generated.ts con el archivo SIN MODIFICAR, en base64.
//
// Volver a ejecutarlo solo si se agrega o cambia una red. Ver docs/maia.md.
/* global __dirname, Buffer */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'engine', 'maia', 'redes');
const SOURCE = 'https://raw.githubusercontent.com/CSSLab/maia-chess/749204cf5979ce7f8b0412e804a4ee7c83c49ff8/maia_weights';
// SHA-256 de los archivos de CSSLab/maia-chess (versión fija, para que siempre sean los mismos).
const NETS = {
  1100: 'e1cf1cd0c96b8a4fa6a275f4b9fd54ed1ffebf9fe44641b9fceded310e9619c4',
  1500: '35ab6f20421d59e1df3b17c5a5016947af4c6761368ef84044a9a9c7619a9a00',
  1900: 'e2f565f42d7cd9f122557e6dc4eb84e5bbaedceda1d404dc485d3611c7c97a12',
};

const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

async function main() {
  fs.mkdirSync(dir, { recursive: true });
  for (const [level, hash] of Object.entries(NETS)) {
    const file = path.join(dir, `maia-${level}.pb.gz`);
    if (!fs.existsSync(file)) {
      console.log(`Bajando maia-${level}.pb.gz…`);
      const res = await fetch(`${SOURCE}/maia-${level}.pb.gz`);
      if (!res.ok) throw new Error(`No se pudo bajar maia-${level}.pb.gz (HTTP ${res.status})`);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    }
    const bytes = fs.readFileSync(file);
    if (sha(bytes) !== hash) {
      throw new Error(`${file} no es la red original de Maia (SHA-256 distinto). Bórralo y vuelve a ejecutar el script.`);
    }
    fs.writeFileSync(
      path.join(dir, `maia${level}.generated.ts`),
      [
        '// ARCHIVO GENERADO por scripts/build-maia.js. No editar a mano.',
        `// Red maia-${level}.pb.gz de https://github.com/CSSLab/maia-chess (GPL v3), sin modificar, en base64.`,
        `export const MAIA_${level} = ${JSON.stringify(bytes.toString('base64'))};`,
        '',
      ].join('\n')
    );
    console.log(`Listo: maia-${level} (${(bytes.length / 1048576).toFixed(2)} MB)`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
