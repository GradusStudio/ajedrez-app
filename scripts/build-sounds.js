// Los sonidos de assets/sounds (move, capture, correct, wrong) ya no se sintetizan: salen de ComfyUI
// (Stable Audio Open, audio-a-audio). Este script queda vacío a propósito para no pisarlos.
/* global __dirname, Buffer */
const fs = require('fs');
const path = require('path');

const RATE = 44100;
const out = path.join(__dirname, '..', 'assets', 'sounds');

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const sounds = {
  // Ningún sonido se genera acá: los de assets/sounds (move, capture, correct, wrong) salen de ComfyUI
  // (Stable Audio Open, audio-a-audio); los sintetizados anteriores están en assets/fuente/sonidos/previos.
  // Se deja vacío para que `npm run build:sounds` no pise los archivos de assets/sounds.
};

fs.mkdirSync(out, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  const file = path.join(out, `${name}.wav`);
  fs.writeFileSync(file, wav(samples));
  console.log(`${name}.wav: ${(samples.length / RATE * 1000).toFixed(0)} ms, ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
}
