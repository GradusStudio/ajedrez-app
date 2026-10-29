// Genera los sonidos de la app sintetizándolos (obra propia, sin licencias de terceros):
// `npm run build:sounds` → assets/sounds/*.wav (mono, 44,1 kHz, 16 bits).
/* global __dirname, Buffer */
const fs = require('fs');
const path = require('path');

const RATE = 44100;
const out = path.join(__dirname, '..', 'assets', 'sounds');

// Ruido reproducible (el mismo sonido cada vez que se genera).
let seed = 12345;
const noise = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed / 0x7fffffff) * 2 - 1;
};

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

/** Golpe de madera: tonos que se apagan muy rápido + un poco de ruido filtrado al principio. */
function knock({ ms, tones, noiseAmount, decayMs, gain }) {
  const n = Math.round((RATE * ms) / 1000);
  const out = new Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const env = Math.exp(-t / (decayMs / 1000));
    let s = 0;
    for (const [f, a] of tones) s += a * Math.sin(2 * Math.PI * f * t);
    lp += 0.25 * (noise() - lp); // ruido suavizado: el "clac" del contacto
    s += noiseAmount * lp * Math.exp(-t / 0.004);
    const attack = Math.min(1, i / (RATE * 0.0008));
    out[i] = gain * s * env * attack;
  }
  return out;
}

/** Notas suaves una detrás de otra (campanita). */
function chime(notes, { noteMs, gain }) {
  const per = Math.round((RATE * noteMs) / 1000);
  const tail = Math.round(RATE * 0.12);
  const outLen = per * notes.length + tail;
  const out = new Array(outLen).fill(0);
  notes.forEach((f, k) => {
    for (let i = 0; i < per + tail; i++) {
      const t = i / RATE;
      const env = Math.min(1, i / (RATE * 0.005)) * Math.exp(-t / 0.09);
      const s = Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * 2 * f * t);
      out[k * per + i] += gain * s * env;
    }
  });
  return out;
}

/** Tono grave que baja (error), con un poco de armónicos para que no suene a pitido. */
function buzz({ ms, from, to, gain }) {
  const n = Math.round((RATE * ms) / 1000);
  const out = new Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    const f = from + (to - from) * p;
    phase += (2 * Math.PI * f) / RATE;
    const env = Math.min(1, i / (RATE * 0.008)) * Math.pow(1 - p, 1.5);
    const s = Math.sin(phase) + 0.35 * Math.sin(2 * phase) + 0.15 * Math.sin(3 * phase);
    out[i] = gain * s * env;
  }
  return out;
}

const sounds = {
  move: knock({ ms: 70, tones: [[880, 0.6], [1760, 0.25], [2640, 0.1]], noiseAmount: 0.9, decayMs: 14, gain: 0.55 }),
  capture: knock({ ms: 110, tones: [[520, 0.6], [1040, 0.3], [1560, 0.15]], noiseAmount: 1.3, decayMs: 24, gain: 0.6 }),
  correct: chime([880, 1318.5], { noteMs: 90, gain: 0.35 }),
  wrong: buzz({ ms: 220, from: 260, to: 170, gain: 0.35 }),
};

fs.mkdirSync(out, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  const file = path.join(out, `${name}.wav`);
  fs.writeFileSync(file, wav(samples));
  console.log(`${name}.wav: ${(samples.length / RATE * 1000).toFixed(0)} ms, ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
}
