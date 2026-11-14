import assert from 'node:assert/strict';
import { test } from 'node:test';
import es from './es.json';
import en from './en.json';
import de from './de.json';
import it from './it.json';
import fr from './fr.json';

// Regla de la spec (feedback del tester, sección 4): el comentarista es un personaje, no habla de una
// máquina. Los mensajes del sistema y Créditos sí pueden nombrar al motor; estas plantillas, no.
const BANNED = /el motor|the engine|die engine|il motore|le moteur|la máquina|the machine|die maschine|la macchina/i;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(strings);
  return [];
}

const FILES: Record<string, unknown> = { es, en, de, it, fr };

for (const [lang, data] of Object.entries(FILES)) {
  test(`comentarista en ${lang}: ninguna plantilla habla del motor`, () => {
    const found = strings(data).filter((s) => BANNED.test(s));
    assert.deepEqual(found, []);
  });

  test(`comentarista en ${lang}: las plantillas de material conservan {seq} y {n}`, () => {
    const plantillas = strings((data as { line?: { material?: unknown } }).line?.material ?? {});
    const conSeq = plantillas.filter((s) => s.includes('{seq}'));
    assert.equal(conSeq.length, 3);
    for (const s of conSeq) assert.match(s, /\{n\}/);
  });
}
