import assert from 'node:assert/strict';
import test from 'node:test';
import { coachExplanation, coachLang, coachVoice, TEXTS } from './coachText';

const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
const shape = (o: unknown): unknown =>
  typeof o === 'string' ? ph(o) : Array.isArray(o) ? o.map(shape) : Object.fromEntries(Object.entries(o as object).map(([k, v]) => [k, shape(v)]));

test('los cinco idiomas del comentarista tienen la misma forma y los mismos marcadores', () => {
  for (const lang of ['es', 'de', 'it', 'fr'] as const) assert.deepEqual(shape(TEXTS[lang]), shape(TEXTS.en), lang);
});

test('coachLang cubre los cinco idiomas y cae a inglés', () => {
  assert.equal(coachLang('de'), 'de');
  assert.equal(coachLang('fr'), 'fr');
  assert.equal(coachLang('pt'), 'en');
});

test('voz y explicación salen rellenadas en todos los idiomas', () => {
  for (const lang of ['es', 'en', 'de', 'it', 'fr'] as const) {
    const v = coachVoice({ lang, style: 'agresivo', quality: 'blunder', great: false, mate: false, subject: 'you', move: 'Qh5', seed: 1 });
    assert.ok(v.includes('Qh5') && !v.includes('{'), `${lang}: ${v}`);
    const ex = coachExplanation({
      lang, subject: 'you', quality: 'blunder', move: 'Qh5', bestSan: 'Nf3', fmt: (s) => s,
      facts: { did: { kind: 'capture', piece: 'p' }, allows: { kind: 'capture', san: 'Nxh5', piece: 'q', ofMoved: true } },
    });
    assert.ok(ex.length >= 2 && ex.every((l) => !l.includes('{')), `${lang}: ${ex.join(' ')}`);
  }
});

const base = { lang: 'es' as const, subject: 'you' as const, quality: 'best' as const, move: 'Nc6+', bestSan: 'Nc6+', fmt: (s: string) => s };
const KINDS = ['fork', 'pin', 'skewer', 'discovered', 'doubleCheck', 'hanging', 'backRank'] as const;
const PLANS = ['develop', 'center', 'rookFile', 'pawnBreak', 'pawnAdvance', 'trade', 'retreat', 'kingActive', 'plain'] as const;
const LANGS5 = ['es', 'en', 'de', 'it', 'fr'] as const;

test('horquilla encontrada se explica con piezas reales', () => {
  const ex = coachExplanation({ ...base, facts: { found: [{ kind: 'fork', attacker: 'n', targets: ['k', 'r'] }] } });
  assert.ok(ex[0].includes('horquilla') && ex[0].includes('el caballo') && ex[0].includes('al rey y a la torre'), ex[0]);
  const opp = coachExplanation({ ...base, subject: 'opponent', facts: { found: [{ kind: 'fork', attacker: 'n', targets: ['k', 'r'] }] } });
  assert.ok(opp[0].startsWith('El rival') && opp[0].includes('horquilla') && opp[0].includes('a la torre'), opp[0]);
});

test('los objetivos repetidos se listan una sola vez', () => {
  const ex = coachExplanation({ ...base, facts: { found: [{ kind: 'fork', attacker: 'n', targets: ['r', 'r', 'q'] }] } });
  assert.ok(ex[0].includes('a la torre y a la dama') && !ex[0].includes('torre y a la torre'), ex[0]);
});

test('una táctica permitida nombra la jugada del rival', () => {
  const facts = { allowsTactic: { tactic: { kind: 'fork' as const, attacker: 'n' as const, targets: ['q' as const, 'r' as const] }, san: 'Nxe5' } };
  const ex = coachExplanation({ ...base, quality: 'blunder', move: 'Qh5', bestSan: 'Nf3', facts });
  assert.ok(ex.some((l) => l.includes('Nxe5') && l.includes('horquilla') && l.includes('tu rival')), ex.join(' | '));
  const opp = coachExplanation({ ...base, subject: 'opponent', quality: 'blunder', facts });
  assert.ok(opp.some((l) => l.includes('Nxe5') && l.includes('horquilla') && l.includes('te habilita')), opp.join(' | '));
});

test('mate en N, en las dos direcciones y para los dos sujetos', () => {
  const f = (n: number, mover: boolean, subject: 'you' | 'opponent') => coachExplanation({ ...base, subject, facts: { mateIn: { n, mover } } });
  assert.equal(f(3, false, 'you')[0], 'Esa jugada habilita a tu rival a realizar un mate en 3.');
  assert.equal(f(2, false, 'opponent')[0], 'Esa jugada te habilita a realizar un mate en 2.');
  assert.ok(f(4, true, 'you')[0].includes('4') && f(4, true, 'you')[0].includes('Tu jugada'));
  assert.ok(f(5, true, 'opponent')[0].includes('5') && f(5, true, 'opponent')[0].includes('rival'));
});

test('jugada sin hechos tácticos ni did explica el plan', () => {
  const ex = coachExplanation({ ...base, move: 'Nf3', quality: 'good', facts: { plan: { kind: 'develop', piece: 'n', from: 'g1', to: 'f3' } } });
  assert.equal(ex.length, 1);
  assert.ok(ex[0].includes('el caballo') && ex[0].includes('g1') && ex[0].includes('f3'), ex[0]);
  const plain = coachExplanation({ ...base, facts: { plan: { kind: 'plain', piece: 'r', from: 'a1', to: 'a2' } } });
  assert.equal(plain[0], 'La torre se mueve de a1 a a2.');
});

test('kingActive no habla de finales ni de endgame en ningún idioma', () => {
  for (const lang of LANGS5) {
    const [line] = coachExplanation({ ...base, lang, facts: { plan: { kind: 'kingActive', piece: 'k', from: 'e1', to: 'e2' } } });
    assert.ok(!/final|endgame|Endspiel|finale|fin de partie/i.test(line) && line.includes('e2'), `${lang}: ${line}`);
  }
  assert.ok(coachExplanation({ ...base, facts: { plan: { kind: 'kingActive', piece: 'k', from: 'e1', to: 'e2' } } })[0].includes('se acerca al centro'));
});

test('tope de 3 líneas y prioridad: el mate gana a la captura, a las tácticas y al plan', () => {
  const ex = coachExplanation({
    ...base, quality: 'blunder', bestSan: 'Nf3',
    facts: {
      mateIn: { n: 3, mover: false },
      found: [{ kind: 'pin', attacker: 'b', targets: ['n', 'k'] }],
      allowsTactic: { tactic: { kind: 'fork', attacker: 'n', targets: ['q', 'r'] }, san: 'Nxe5' },
      did: { kind: 'capture', piece: 'p' },
      allows: { kind: 'check', san: 'Qh5+' },
      missed: { kind: 'capture', piece: 'n' },
      plan: { kind: 'plain', piece: 'r', from: 'a1', to: 'a2' },
    },
  });
  assert.equal(ex.length, 3);
  assert.ok(ex[0].includes('mate en 3'), ex[0]);
  assert.ok(ex[1].includes('clavada'), ex[1]);
  assert.ok(ex[2].includes('Nxe5') && ex[2].includes('horquilla'), ex[2]);
  assert.ok(!ex.some((l) => l.includes('pasa de')));
});

test('la jugada de mate abre la lista, antes de lo permitido', () => {
  const ex = coachExplanation({ ...base, quality: 'blunder', facts: { did: { kind: 'mate' }, allows: { kind: 'check', san: 'Qh5+' } } });
  assert.equal(ex[0], 'Nc6+ da jaque mate.');
});

test('las variantes dependen de la semilla', () => {
  const facts = { found: [{ kind: 'fork' as const, attacker: 'n' as const, targets: ['k' as const, 'r' as const] }] };
  const lines = new Set([0, 1, 2, 3].map((seed) => coachExplanation({ ...base, seed, facts })[0]));
  assert.ok(lines.size >= 2, [...lines].join(' | '));
  const allows = { allowsTactic: { tactic: { kind: 'pin' as const, attacker: 'b' as const, targets: ['n' as const, 'k' as const] }, san: 'Bb5' } };
  const a = new Set([0, 1].map((seed) => coachExplanation({ ...base, quality: 'blunder', seed, facts: allows })[0]));
  assert.equal(a.size, 2);
});

test('cada texto nuevo sale rellenado en los cinco idiomas, sin llaves ni rayas largas', () => {
  const mateKeys: [number, boolean][] = [[3, true], [3, false]];
  for (const lang of LANGS5) {
    for (const subject of ['you', 'opponent'] as const) {
      const out: string[] = [];
      for (const kind of KINDS) {
        const tactic = { kind, attacker: 'q' as const, targets: ['k' as const, 'r' as const, 'r' as const] };
        for (const seed of [0, 1]) {
          out.push(...coachExplanation({ ...base, lang, subject, seed, facts: { found: [tactic] } }));
          out.push(...coachExplanation({ ...base, lang, subject, seed, quality: 'blunder', facts: { allowsTactic: { tactic, san: 'Qxf7' } } }));
        }
      }
      for (const [n, mover] of mateKeys) out.push(...coachExplanation({ ...base, lang, subject, facts: { mateIn: { n, mover } } }));
      for (const kind of PLANS) out.push(...coachExplanation({ ...base, lang, subject, facts: { plan: { kind, piece: 'n', from: 'g1', to: 'f3' } } }));
      assert.ok(out.length >= 7 * 4 + 2 + PLANS.length, `${lang} ${subject}`);
      for (const l of out) assert.ok(l.length > 0 && !l.includes('{') && !l.includes('—') && !l.includes('undefined'), `${lang} ${subject}: ${l}`);
    }
    assert.ok(!JSON.stringify(TEXTS[lang]).includes('—'), lang);
  }
});

// Marcadores que el código rellena en cada familia de textos (fill deja vacío lo que falta, así que un
// error de tecleo como {atacker} solo se ve comparando con esta lista).
const SUPPLIED: [string, string[]][] = [
  ['you.', ['move']], ['opp.', ['move']], ['pieces.', []], ['pieceDef.', []], ['pieceObj.', []], ['and', []],
  ['expl.', ['move', 'san', 'piece', 'best']],
  ['tact.found.', ['attacker', 'targets', 'targetsDef']], ['tact.allows.', ['attacker', 'targets', 'targetsDef', 'san']],
  ['mateIn.', ['n']], ['plan.', ['piece', 'Piece', 'from', 'to', 'move']],
];
const walk = (o: unknown, path: string, out: [string, string][]) => {
  if (typeof o === 'string') out.push([path, o]);
  else if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${path}[${i}]`, out));
  else for (const [k, v] of Object.entries(o as object)) walk(v, path ? `${path}.${k}` : k, out);
};

test('cada marcador de cada plantilla lo rellena el código y los idiomas coinciden con es', () => {
  const es: [string, string][] = [];
  walk(TEXTS.es, '', es);
  assert.ok(es.length > 150);
  for (const [path, text] of es) {
    const allowed = SUPPLIED.find(([p]) => path.startsWith(p))?.[1];
    assert.ok(allowed, `familia sin lista: ${path}`);
    for (const m of text.match(/\{\w+\}/g) ?? []) assert.ok(allowed.includes(m.slice(1, -1)), `${path}: ${m}`);
  }
  for (const lang of ['en', 'de', 'it', 'fr'] as const) {
    const other: [string, string][] = [];
    walk(TEXTS[lang], '', other);
    assert.deepEqual(other.map(([p, t]) => [p, ph(t)]), es.map(([p, t]) => [p, ph(t)]), lang);
  }
});

test('la jugada permitida usa el marco pedido y las colgadas no se juegan', () => {
  const only = (kind: 'fork' | 'hanging' | 'backRank', subject: 'you' | 'opponent', seed: number) =>
    coachExplanation({ ...base, subject, seed, quality: 'blunder', bestSan: '', facts: { allowsTactic: { tactic: { kind, attacker: 'q', targets: ['r'] }, san: 'Qxf7' } } })[0];
  assert.equal(only('fork', 'you', 0), 'Esa jugada habilita a tu rival a realizar una horquilla con Qxf7.');
  assert.equal(only('hanging', 'you', 0), 'Esa jugada deja una pieza colgada: el rival la captura con Qxf7.');
  assert.equal(only('backRank', 'opponent', 0), 'Esa jugada te habilita a dar mate del pasillo con Qxf7.');
});
