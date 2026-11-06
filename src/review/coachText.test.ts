import assert from 'node:assert/strict';
import test from 'node:test';
import type { BotStyle } from '../data/bots';
import { coachExplanation, coachLang, coachVoice, EXPLANATION_CAP, TEXTS } from './coachText';
import type { Facts } from './types';

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
      lang, subject: 'you', quality: 'blunder', move: 'Qh5', bestSan: 'Nf3', fmt: (s) => s, style: 'agresivo',
      facts: { did: { kind: 'capture', piece: 'p' }, allows: { kind: 'capture', san: 'Nxh5', piece: 'q', ofMoved: true } },
    });
    assert.ok(ex.length === 1 && ex[0].length > 40 && !ex[0].includes('{'), `${lang}: ${ex.join(' ')}`);
  }
});

const base = { lang: 'es' as const, subject: 'you' as const, quality: 'best' as const, move: 'Nc6+', bestSan: 'Nc6+', fmt: (s: string) => s, style: 'equilibrado' as BotStyle };
const KINDS = ['fork', 'pin', 'skewer', 'discovered', 'doubleCheck', 'hanging', 'backRank'] as const;
const PLANS = ['develop', 'center', 'rookFile', 'pawnBreak', 'pawnAdvance', 'trade', 'retreat', 'kingActive', 'plain'] as const;
const LANGS5 = ['es', 'en', 'de', 'it', 'fr'] as const;
const STYLES: BotStyle[] = ['tranquilo', 'equilibrado', 'posicional', 'agresivo'];

test('horquilla encontrada se explica con piezas reales', () => {
  const ex = coachExplanation({ ...base, facts: { found: [{ kind: 'fork', attacker: 'n', targets: ['k', 'r'] }] } });
  assert.ok(ex[0].includes('horquilla') && ex[0].includes('el caballo') && ex[0].includes('al rey y a la torre'), ex[0]);
  const opp = coachExplanation({ ...base, subject: 'opponent', facts: { found: [{ kind: 'fork', attacker: 'n', targets: ['k', 'r'] }] } });
  assert.ok(opp[0].includes('El rival encontró una horquilla') && opp[0].includes('a la torre'), opp[0]);
});

test('los objetivos repetidos se listan una sola vez', () => {
  const ex = coachExplanation({ ...base, facts: { found: [{ kind: 'fork', attacker: 'n', targets: ['r', 'r', 'q'] }] } });
  assert.ok(ex[0].includes('a la torre y a la dama') && !ex[0].includes('torre y a la torre'), ex[0]);
});

test('una táctica permitida nombra la jugada del rival', () => {
  const facts = { allowsTactic: { tactic: { kind: 'fork' as const, attacker: 'n' as const, targets: ['q' as const, 'r' as const] }, san: 'Nxe5' } };
  const ex = coachExplanation({ ...base, quality: 'blunder', move: 'Qh5', bestSan: 'Nf3', facts });
  assert.ok(ex[0].includes('Nxe5') && ex[0].includes('horquilla') && ex[0].includes('tu rival'), ex[0]);
  const opp = coachExplanation({ ...base, subject: 'opponent', quality: 'blunder', facts });
  assert.ok(opp[0].includes('Nxe5') && opp[0].includes('horquilla') && opp[0].includes('te habilita'), opp[0]);
});

test('mate en N, en las dos direcciones y para los dos sujetos', () => {
  const f = (n: number, mover: boolean, subject: 'you' | 'opponent') => coachExplanation({ ...base, subject, facts: { mateIn: { n, mover } } });
  assert.ok(f(3, false, 'you')[0].includes('Esa jugada habilita a tu rival a realizar un mate en 3.'));
  assert.ok(f(2, false, 'opponent')[0].includes('Esa jugada te habilita a realizar un mate en 2.'));
  assert.ok(f(4, true, 'you')[0].includes('4') && f(4, true, 'you')[0].includes('Tu jugada'));
  assert.ok(f(5, true, 'opponent')[0].includes('5') && f(5, true, 'opponent')[0].includes('rival'));
});

test('jugada sin hechos tácticos ni did explica el plan', () => {
  const ex = coachExplanation({ ...base, move: 'Nf3', quality: 'good', facts: { plan: { kind: 'develop', piece: 'n', from: 'g1', to: 'f3' } } });
  assert.equal(ex.length, 1);
  assert.ok(ex[0].includes('Desarrolla el caballo de g1 a f3'), ex[0]);
  const plain = coachExplanation({ ...base, facts: { plan: { kind: 'plain', piece: 'r', from: 'a1', to: 'a2' } } });
  assert.ok(plain[0].includes('La torre se mueve de a1 a a2.'), plain[0]);
});

test('kingActive no habla de finales ni de endgame en ningún idioma', () => {
  const noEndgame = /final|endgame|Endspiel|finale|fin de partie/i;
  for (const lang of LANGS5) {
    const [line] = coachExplanation({ ...base, lang, facts: { plan: { kind: 'kingActive', piece: 'k', from: 'e1', to: 'e2' } } });
    assert.ok(!noEndgame.test(line) && line.includes('e2'), `${lang}: ${line}`);
    const [intent] = coachExplanation({ ...base, lang, quality: 'blunder', facts: { plan: { kind: 'kingActive', piece: 'k', from: 'e1', to: 'e2' } } });
    assert.ok(!noEndgame.test(intent) && intent.includes('e2'), `${lang}: ${intent}`);
  }
  assert.ok(coachExplanation({ ...base, facts: { plan: { kind: 'kingActive', piece: 'k', from: 'e1', to: 'e2' } } })[0].includes('se acerca al centro'));
});

test('prioridad: el mate gana a la captura, a las tácticas y al plan, y solo caben dos hechos', () => {
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
  assert.equal(ex.length, 1);
  const p = ex[0];
  assert.ok(p.includes('mate en 3') && p.includes('clavada'), p);
  assert.ok(p.indexOf('mate en 3') < p.indexOf('clavada'), p);
  assert.ok(!p.includes('Nxe5') && !p.includes('horquilla') && !p.includes('captura') && !p.includes('Qh5+') && !p.includes('pasa de'), p);
});

test('la jugada de mate abre el párrafo, antes de lo permitido', () => {
  const [p] = coachExplanation({ ...base, quality: 'blunder', facts: { did: { kind: 'mate' }, allows: { kind: 'check', san: 'Qh5+' } } });
  assert.ok(p.includes('Nc6+ da jaque mate.') && p.indexOf('da jaque mate') < p.indexOf('Qh5+'), p);
});

test('las variantes dependen de la semilla', () => {
  const facts = { found: [{ kind: 'fork' as const, attacker: 'n' as const, targets: ['k' as const, 'r' as const] }] };
  const lines = new Set([0, 1, 2, 3].map((seed) => coachExplanation({ ...base, seed, facts })[0]));
  assert.ok(lines.size >= 2, [...lines].join(' | '));
  const allows = { allowsTactic: { tactic: { kind: 'pin' as const, attacker: 'b' as const, targets: ['n' as const, 'k' as const] }, san: 'Bb5' } };
  const a = new Set([0, 1].map((seed) => coachExplanation({ ...base, quality: 'blunder', seed, facts: allows })[0]));
  assert.equal(a.size, 2);
  assert.ok(coachExplanation({ ...base, quality: 'blunder', seed: 0, facts: allows })[0].includes('habilita a tu rival a realizar una clavada con Bb5'));
  assert.ok(coachExplanation({ ...base, quality: 'blunder', seed: 1, facts: allows })[0].includes('el rival clava'));
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
  ['you.', ['move']], ['opp.', ['move']], ['frame.', []], ['pieces.', []], ['pieceDef.', []], ['pieceObj.', []], ['and', []],
  ['expl.', ['move', 'san', 'piece', 'best']],
  ['tact.found.', ['attacker', 'targets', 'targetsDef']], ['tact.allows.', ['attacker', 'targets', 'targetsDef', 'san']],
  ['mateIn.', ['n']], ['plan.', ['piece', 'Piece', 'from', 'to', 'move']],
  ['line.removeDefender.', ['first', 'finish', 'capturer', 'removed', 'target', 'targetSq', 'seq', 'n']], ['line.material.', ['first', 'seq', 'n']],
  ['intent.', ['piece', 'Piece', 'from', 'to']],
];
const walk = (o: unknown, path: string, out: [string, string][]) => {
  if (typeof o === 'string') out.push([path, o]);
  else if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${path}[${i}]`, out));
  else for (const [k, v] of Object.entries(o as object)) walk(v, path ? `${path}.${k}` : k, out);
};

test('cada marcador de cada plantilla lo rellena el código y los idiomas coinciden con es', () => {
  const es: [string, string][] = [];
  walk(TEXTS.es, '', es);
  assert.ok(es.length > 250);
  for (const [path, text] of es) {
    const allowed = SUPPLIED.find(([p]) => path.startsWith(p))?.[1];
    assert.ok(allowed, `familia sin lista: ${path}`);
    for (const m of text.match(/\{\w+\}/g) ?? []) assert.ok(allowed.includes(m.slice(1, -1)), `${path}: ${m}`);
  }
  // Las familias nuevas existen de verdad en el texto (no basta con que la lista las permita).
  for (const fam of ['frame.', 'opp.tranquilo.', 'opp.agresivo.', 'line.removeDefender.', 'line.material.', 'intent.']) assert.ok(es.some(([p]) => p.startsWith(fam)), fam);
  assert.ok(es.some(([p, t]) => p.startsWith('intent.develop') && t.includes('{from}') && t.includes('{piece}')));
  for (const lang of ['en', 'de', 'it', 'fr'] as const) {
    const other: [string, string][] = [];
    walk(TEXTS[lang], '', other);
    assert.deepEqual(other.map(([p, t]) => [p, ph(t)]), es.map(([p, t]) => [p, ph(t)]), lang);
  }
});

test('la jugada permitida usa el marco pedido y las colgadas no se juegan', () => {
  const only = (kind: 'fork' | 'hanging' | 'backRank', subject: 'you' | 'opponent', seed: number) =>
    coachExplanation({ ...base, subject, seed, quality: 'blunder', bestSan: '', facts: { allowsTactic: { tactic: { kind, attacker: 'q', targets: ['r'] }, san: 'Qxf7' } } })[0];
  assert.ok(only('fork', 'you', 0).includes('Esa jugada habilita a tu rival a realizar una horquilla con Qxf7.'));
  assert.ok(only('hanging', 'you', 0).includes('Esa jugada deja una pieza colgada: el rival la captura con Qxf7.'));
  assert.ok(only('backRank', 'opponent', 0).includes('Esa jugada te habilita a dar mate del pasillo con Qxf7.'));
});

// ---- Composición en la voz del bot ----
const esFmt = (s: string) => s.replace(/[NBRQK]/g, (c) => ({ N: 'C', B: 'A', R: 'T', Q: 'D', K: 'R' })[c as 'N']);
const rd = { capturer: 'b' as const, removed: 'n' as const, removedSq: 'f6', target: 'p' as const, targetSq: 'd4' };
const rdLine = { sans: ['Bxf6', 'gxf6', 'Nxd4'], material: 1, removeDefender: rd };
// El caso del usuario: el rival desarrolla un caballo y deja que se capture otro que defendía un peón.
const userCase: Facts = {
  line: rdLine,
  allows: { kind: 'capture', san: 'Bxf6', piece: 'n', ofMoved: false },
  plan: { kind: 'develop', piece: 'n', from: 'b8', to: 'c6' },
};
const leadsOf = (style: BotStyle, sit: 'exploit' | 'allows' | 'good') => TEXTS.es.frame[style][sit].lead;
const bump = { ...base, fmt: esFmt, bestSan: 'Nc6' };

test('el caso del usuario: un párrafo con el concepto, la jugada, el defensor y la casilla; sin el plan en positivo', () => {
  for (const style of STYLES) {
    for (const seed of [0, 1, 2, 3]) {
      const ex = coachExplanation({ ...bump, style, seed, subject: 'opponent', quality: 'blunder', facts: userCase });
      assert.equal(ex.length, 1);
      const p = ex[0];
      assert.ok(/Eliminar al defensor/i.test(p) && p.includes('Axf6') && p.includes('caballo') && p.includes('d4'), p);
      assert.ok(p.length <= EXPLANATION_CAP, p);
      assert.ok(!p.includes('saca una pieza menor') && !p.includes('Desarrolla el caballo'), p);
      assert.ok(!p.includes('puedes capturar'), p);
      assert.ok(leadsOf(style, 'exploit').some((l) => p.startsWith(l)), p);
    }
  }
});

test('la intención del plan se dice después de los hechos y nunca en positivo', () => {
  const only: Facts = { plan: { kind: 'develop', piece: 'n', from: 'b8', to: 'c6' } };
  const p = coachExplanation({ ...bump, style: 'agresivo', subject: 'opponent', quality: 'blunder', facts: only })[0];
  assert.ok(p.includes('Lo mejor para el rival era Cc6') && /desarrollaba|sacar/.test(p), p);
  assert.ok(p.indexOf('Lo mejor para el rival') < p.search(/desarrollaba|sacar/), p);
  assert.ok(!p.includes('saca una pieza menor'), p);
  const inEn = coachExplanation({ ...bump, lang: 'en', fmt: (s) => s, bestSan: 'Nc6', style: 'agresivo', subject: 'opponent', quality: 'blunder', facts: only })[0];
  assert.ok(/developed|bring/.test(inEn) && !inEn.includes('a minor piece leaves'), inEn);
  // Con el concepto como único hecho y espacio de sobra, la intención llega después del concepto.
  const withRd = coachExplanation({ ...bump, bestSan: '', style: 'agresivo', seed: 0, subject: 'opponent', quality: 'blunder', facts: { line: rdLine, plan: only.plan } })[0];
  assert.ok(/desarrollaba|sacar/.test(withRd) && withRd.search(/Eliminar al defensor/i) < withRd.search(/desarrollaba|sacar/), withRd);
});

test('el mismo caso en los cuatro estilos tiene leads distintos', () => {
  const leads = STYLES.map((style) => {
    const p = coachExplanation({ ...bump, style, seed: 0, subject: 'opponent', quality: 'blunder', facts: userCase })[0];
    return leadsOf(style, 'exploit').find((l) => p.startsWith(l));
  });
  assert.ok(leads.every(Boolean));
  assert.equal(new Set(leads).size, 4, leads.join(' | '));
  for (const lang of ['es', 'en'] as const)
    for (const sit of ['exploit', 'allows', 'good'] as const) {
      const all = STYLES.flatMap((s) => TEXTS[lang].frame[s][sit].lead);
      assert.equal(new Set(all).size, all.length, `${lang} ${sit}`);
    }
});

test('el error propio con eliminar al defensor usa el texto allows, no el de exploit', () => {
  for (const style of STYLES) {
    const p = coachExplanation({ ...bump, style, subject: 'you', quality: 'blunder', facts: { line: rdLine, plan: userCase.plan } })[0];
    assert.ok(/Eliminar al defensor/i.test(p) && /el rival/i.test(p) && p.includes('Axf6'), p);
    assert.ok(!p.includes('Se podía eliminar'), p);
    assert.ok(leadsOf(style, 'allows').some((l) => p.startsWith(l)), p);
    assert.ok(!leadsOf(style, 'exploit').some((l) => p.startsWith(l)), p);
  }
  // Si el rival comete el error, el mismo hecho se dice en exploit.
  const opp = coachExplanation({ ...bump, subject: 'opponent', quality: 'blunder', facts: { line: rdLine } })[0];
  assert.ok(leadsOf('equilibrado', 'exploit').some((l) => opp.startsWith(l)), opp);
  assert.ok(!opp.includes('el rival se lleva') && !opp.includes('el rival captura'), opp);
});

test('missedLine solo se usa en el error propio y con el texto missed', () => {
  const missedLine = { sans: ['Qxf7+', 'Kxf7', 'Bxe6'], material: 3 };
  for (const seed of [0, 1]) {
    const own = coachExplanation({ ...bump, subject: 'you', quality: 'mistake', seed, facts: { missedLine } })[0];
    assert.ok(own.includes('3 puntos de material') && /ganabas|podías ganar/.test(own), own);
    assert.ok(!own.includes('Lo mejor era'), own);
  }
  const withRd = coachExplanation({ ...bump, subject: 'you', quality: 'mistake', facts: { missedLine: { ...rdLine, material: 1 } } })[0];
  assert.ok(withRd.includes('Se podía eliminar al defensor') && withRd.includes('Axf6') && !withRd.includes('Lo mejor era'), withRd);
  // En una jugada del rival no se usa la línea de oportunidad perdida.
  const opp = coachExplanation({ ...bump, subject: 'opponent', quality: 'mistake', facts: { missedLine: { ...rdLine, material: 3 } } })[0];
  assert.ok(!/ganabas|podías ganar|Se podía eliminar|puntos de material/.test(opp), opp);
  // Con la línea tras la jugada, el error propio habla de lo que gana el rival y el error ajeno, de lo que ganas tú.
  const allows = coachExplanation({ ...bump, subject: 'you', quality: 'mistake', facts: { line: { sans: ['Qxf7+', 'Kxf7', 'Bxe6'], material: 4 } } })[0];
  assert.ok(allows.includes('4 puntos de material') && /pierdes|rival queda/.test(allows), allows);
  const exploit = coachExplanation({ ...bump, subject: 'opponent', quality: 'mistake', facts: { line: { sans: ['Qxf7+', 'Kxf7', 'Bxe6'], material: 4 } } })[0];
  assert.ok(exploit.includes('4 puntos de material') && /ganas|te deja/.test(exploit), exploit);
});

test('con mate y eliminar al defensor a la vez, el mate va primero y solo hay dos hechos', () => {
  const p = coachExplanation({
    ...bump, subject: 'you', quality: 'blunder',
    facts: { mateIn: { n: 2, mover: false }, line: rdLine, found: [{ kind: 'pin', attacker: 'b', targets: ['n', 'k'] }], did: { kind: 'capture', piece: 'p' } },
  })[0];
  assert.ok(p.includes('mate en 2') && /Eliminar al defensor/i.test(p), p);
  assert.ok(p.indexOf('mate en 2') < p.search(/Eliminar al defensor/i), p);
  assert.ok(!p.includes('clavada') && !p.includes('captura'), p);
});

test('eliminar al defensor va antes que otras tácticas, la táctica antes que el material y el material antes que lo que hizo la jugada', () => {
  const tactic = { kind: 'pin' as const, attacker: 'b' as const, targets: ['n' as const, 'k' as const] };
  const a = coachExplanation({ ...bump, subject: 'opponent', quality: 'blunder', facts: { line: rdLine, found: [tactic], did: { kind: 'check' } } })[0];
  assert.ok(/Eliminar al defensor/i.test(a) && /lavada/.test(a) && !a.includes('da jaque'), a);
  assert.ok(a.search(/Eliminar al defensor/i) < a.search(/lavada/), a);
  const material = { sans: ['Qxf7+', 'Kxf7', 'Bxe6'], material: 4 };
  const b = coachExplanation({ ...bump, subject: 'opponent', quality: 'blunder', facts: { line: material, found: [tactic], did: { kind: 'check' } } })[0];
  assert.ok(/lavada/.test(b) && b.includes('puntos de material') && !b.includes('da jaque'), b);
  assert.ok(b.search(/lavada/) < b.indexOf('puntos de material'), b);
  const c = coachExplanation({ ...bump, subject: 'opponent', quality: 'blunder', facts: { line: material, did: { kind: 'check' }, missed: { kind: 'capture', piece: 'n' } } })[0];
  assert.ok(c.includes('puntos de material') && c.includes('da jaque') && !/podía capturar/i.test(c), c);
  assert.ok(c.indexOf('puntos de material') < c.indexOf('da jaque'), c);
});

test('si hay línea del motor no se repiten la captura ni el jaque permitidos, pero sí la mejor jugada', () => {
  const p = coachExplanation({
    ...bump, subject: 'opponent', quality: 'blunder',
    facts: { line: rdLine, allows: { kind: 'check', san: 'Bxf6+' } },
  })[0];
  assert.ok(!p.includes('Puedes responder con') && /Lo mejor para el rival era Cc6/.test(p), p);
  const mate = coachExplanation({ ...bump, subject: 'opponent', quality: 'blunder', facts: { line: rdLine, allows: { kind: 'mate', san: 'Dh7#' } } })[0];
  assert.ok(mate.includes('Dh7#') && mate.includes('mate'), mate);
});

test('una jugada buena con plan y sin hechos: lead good y plan en positivo, nunca solo el lead', () => {
  for (const style of STYLES) {
    const ex = coachExplanation({ ...bump, style, move: 'Nf3', quality: 'good', facts: { plan: { kind: 'develop', piece: 'n', from: 'g1', to: 'f3' } } });
    assert.equal(ex.length, 1);
    assert.ok(leadsOf(style, 'good').some((l) => ex[0].startsWith(l)), ex[0]);
    assert.ok(ex[0].includes('Desarrolla el caballo de g1 a f3'), ex[0]);
    assert.ok(!ex[0].includes('Solo desarrollaba'), ex[0]);
  }
  assert.deepEqual(coachExplanation({ ...bump, quality: 'good', facts: {} }), []);
  // Una jugada mala sin ningún hecho comprobado tampoco devuelve un lead solo.
  assert.deepEqual(coachExplanation({ ...bump, bestSan: '', quality: 'mistake', facts: { plan: { kind: 'plain', piece: 'n', from: 'g1', to: 'f3' } } }), []);
  assert.deepEqual(coachExplanation({ ...bump, bestSan: '', quality: 'mistake', facts: { plan: { kind: 'develop', piece: 'n', from: 'g1', to: 'f3' } } }), []);
});

test('plan en una jugada mala: trade y plain se omiten, el resto se dice como intención', () => {
  const run = (kind: (typeof PLANS)[number], lang: 'es' | 'en') =>
    coachExplanation({ ...bump, lang, fmt: (s) => s, subject: 'opponent', quality: 'mistake', bestSan: 'Nf3', facts: { plan: { kind, piece: 'n', from: 'g1', to: 'h3' } } })[0];
  for (const lang of ['es', 'en'] as const)
    for (const kind of PLANS) {
      const p = run(kind, lang);
      const best = lang === 'es' ? 'Lo mejor para el rival era Nf3' : 'Best for your opponent was Nf3';
      assert.ok(p.includes(best), p);
      assert.equal(p.includes('h3'), kind !== 'trade' && kind !== 'plain', `${lang} ${kind}: ${p}`);
      assert.ok(p.length <= EXPLANATION_CAP, p);
    }
  assert.ok(!run('trade', 'es').includes('cambio de piezas'));
  assert.ok(!run('plain', 'es').includes('se mueve de'));
  assert.ok(!run('develop', 'es').includes('saca una pieza menor'));
  // El plan en positivo sigue para jugadas buenas, incluidos trade y plain.
  const good = coachExplanation({ ...bump, quality: 'good', facts: { plan: { kind: 'trade', piece: 'n', from: 'g1', to: 'f3' } } })[0];
  assert.ok(good.includes('Ofrece un cambio de piezas en f3'), good);
});

type Sample = { label: string; facts: Facts; quality: 'blunder' | 'best'; subject: 'you' | 'opponent' };
const longTactic = { kind: 'doubleCheck' as const, attacker: 'q' as const, targets: ['k' as const, 'r' as const, 'q' as const] };
const sans4 = ['Qxf7+', 'Kxf7', 'Bxe6+', 'Kg8'];
const SAMPLES: Sample[] = [];
{
  const pool: [string, Facts][] = [
    ['rd', { line: { sans: ['Bxf6', 'gxf6', 'Nxd4'], material: 1, removeDefender: { ...rd, removed: 'q', target: 'r', capturer: 'n' } } }],
    ['rd+tactic', { line: rdLine, found: [longTactic], allowsTactic: { tactic: longTactic, san: 'Qxf7+' } }],
    ['missedRd', { missedLine: rdLine, did: { kind: 'castle' } }],
    ['material', { line: { sans: sans4, material: 5 }, did: { kind: 'capture', piece: 'q' } }],
    ['missedMaterial', { missedLine: { sans: sans4, material: 9 }, missed: { kind: 'mate' }, allows: { kind: 'check', san: 'Qh5+' } }],
    ['mate+rd', { mateIn: { n: 4, mover: true }, line: rdLine, found: [longTactic] }],
    ['tactics', { found: [longTactic, { kind: 'discovered', attacker: 'b', targets: ['q', 'r'] }], allowsTactic: { tactic: longTactic, san: 'Qxf7+' } }],
    ['rest', { did: { kind: 'check' }, allows: { kind: 'capture', san: 'Qxf7+', piece: 'q', ofMoved: true }, missed: { kind: 'capture', piece: 'q' } }],
    ...(['p', 'n', 'b', 'r', 'q'] as const).map((p): [string, Facts] => [`did ${p}`, { did: { kind: 'capture', piece: p }, plan: { kind: 'develop', piece: 'n', from: 'g1', to: 'f3' }, missed: { kind: 'capture', piece: p } }]),
    ...PLANS.map((kind): [string, Facts] => [`plan ${kind}`, { plan: { kind, piece: 'n', from: 'g1', to: 'f3' }, line: { sans: sans4, material: 3 } }]),
  ];
  for (const [label, facts] of pool)
    for (const quality of ['blunder', 'best'] as const)
      for (const subject of ['you', 'opponent'] as const) SAMPLES.push({ label, facts, quality, subject });
}

test('el tope de largo se cumple en es y en, y el concepto no desaparece', () => {
  const concept = /Eliminar al defensor|Remove the defender|eliminar al defensor|remove the defender/;
  let checked = 0;
  let concepts = 0;
  for (const lang of ['es', 'en'] as const)
    for (const style of STYLES)
      for (const seed of [0, 1, 2, 3])
        for (const s of SAMPLES) {
          const ex = coachExplanation({ ...base, lang, style, seed, subject: s.subject, quality: s.quality, bestSan: 'Nf3', facts: s.facts });
          if (ex.length === 0) continue;
          const p = ex[0];
          checked++;
          assert.equal(ex.length, 1);
          assert.ok(p.length <= EXPLANATION_CAP, `${lang} ${style} ${seed} ${s.label} (${p.length}): ${p}`);
          // Si el concepto es el primer hecho (no lo gana el mate), nunca se quita.
          const bad = s.quality === 'blunder';
          const rdFirst = bad && !s.facts.mateIn && (s.facts.line?.removeDefender || (s.subject === 'you' && s.facts.missedLine?.removeDefender));
          if (rdFirst) {
            concepts++;
            assert.ok(concept.test(p), `${lang} ${s.label}: ${p}`);
          }
        }
  assert.ok(checked > 1500 && concepts > 100, `${checked} ${concepts}`);
});

test('si el párrafo no entra se acorta la secuencia (3, 2, 1) antes de quitar nada y luego se quita la cola, la intención y el segundo hecho', () => {
  const names = ['Qxf7+', 'Kxf7', 'Bxe6+'];
  const facts: Facts = { line: { sans: names, material: 3 }, plan: { kind: 'develop', piece: 'n', from: 'b8', to: 'c6' } };
  const tails = TEXTS.es.frame.tranquilo.exploit.tail;
  const rows: { pad: number; p: string; tail: boolean; intent: boolean; second: boolean; shown: number; seqVariant: boolean }[] = [];
  for (let pad = 0; pad <= 130; pad++) {
    const fmt = (s: string) => s.padEnd(pad, '_');
    const p = coachExplanation({ ...base, style: 'tranquilo', fmt, seed: 0, subject: 'opponent', quality: 'blunder', bestSan: 'Nf3', facts })[0];
    rows.push({
      pad, p,
      tail: tails.some((t) => p.endsWith(t)),
      intent: /desarrollaba|sacar/.test(p),
      second: p.includes('Lo mejor para el rival'),
      shown: names.filter((n) => p.includes(fmt(n))).length,
      seqVariant: p.includes('El motor ve'),
    });
  }
  const rank = (r: (typeof rows)[number]) => (r.tail ? 0 : r.intent ? 1 : r.second ? 2 : 3);
  // El primer hecho nunca se quita y, mientras algo entre, no se pasa del tope.
  for (const r of rows) {
    assert.ok(r.p.includes('puntos de material') || r.p.includes('secuencia'), r.p);
    if (r.pad <= 40) assert.ok(r.p.length <= EXPLANATION_CAP, r.p);
  }
  // Lo que se quita va en orden: cola, intención, segundo hecho; nunca vuelve algo ya quitado.
  for (let i = 1; i < rows.length; i++) assert.ok(rank(rows[i]) >= rank(rows[i - 1]), `${rows[i - 1].p} => ${rows[i].p}`);
  assert.deepEqual([...new Set(rows.map(rank))], [0, 1, 2, 3]);
  // Antes de quitar la cola se acorta la secuencia de la variante elegida: 3, luego 2, luego 1.
  const shortened = rows.filter((r) => r.tail && r.seqVariant);
  assert.deepEqual([...new Set(shortened.map((r) => r.shown))].sort().reverse(), [3, 2, 1], shortened.map((r) => r.shown).join());
  for (let i = 1; i < shortened.length; i++) assert.ok(shortened[i].shown <= shortened[i - 1].shown);
  // Con todo cabiendo (jugadas cortas) salen los dos hechos, la intención y la cola.
  assert.ok(rows[0].tail && rows[0].intent && rows[0].second);
});

test('dos semillas distintas pueden dar dos párrafos distintos', () => {
  const texts = (style: BotStyle, seed: number) => coachExplanation({ ...bump, style, seed, subject: 'opponent', quality: 'blunder', facts: userCase })[0];
  for (const style of STYLES) assert.notEqual(texts(style, 0), texts(style, 1), style);
  assert.ok(new Set([0, 1, 2, 3].map((seed) => texts('agresivo', seed))).size >= 2);
  const seen = new Set([0, 1, 2, 3, 4, 5].map((seed) => coachExplanation({ ...bump, seed, subject: 'you', quality: 'mistake', facts: { missedLine: { sans: sans4, material: 3 } } })[0]));
  assert.ok(seen.size >= 2);
});

test('ningún párrafo sale con llaves, dobles espacios, rayas largas ni undefined, en ningún estilo, situación, táctica ni plan', () => {
  let n = 0;
  const kindFacts: Facts[] = [
    ...KINDS.flatMap((kind): Facts[] => {
      const tactic = { kind, attacker: 'q' as const, targets: ['k' as const, 'r' as const, 'r' as const] };
      return [{ found: [tactic] }, { allowsTactic: { tactic, san: 'Qxf7' } }];
    }),
    ...PLANS.map((kind): Facts => ({ plan: { kind, piece: 'n', from: 'g1', to: 'f3' } })),
    { mateIn: { n: 3, mover: true } }, { mateIn: { n: 3, mover: false } },
    { line: rdLine }, { missedLine: rdLine }, { line: { sans: ['Qxf7+'], material: 2 } }, { missedLine: { sans: ['Qxf7+', 'Kxf7'], material: 6 } },
    { did: { kind: 'castle' }, missed: { kind: 'mate' } },
  ];
  for (const lang of LANGS5)
    for (const style of STYLES)
      for (const subject of ['you', 'opponent'] as const)
        for (const quality of ['blunder', 'good'] as const)
          for (const seed of [0, 1])
            for (const facts of kindFacts) {
              const ex = coachExplanation({ ...base, lang, style, seed, subject, quality, facts });
              assert.ok(ex.length <= 1);
              for (const p of ex) {
                n++;
                assert.ok(p.length > 0 && !p.includes('{') && !p.includes('}') && !p.includes('  ') && !p.includes('—') && !p.includes('undefined') && p === p.trim(), `${lang} ${style} ${subject} ${quality}: ${p}`);
              }
            }
  assert.ok(n > 3000, String(n));
});

test('todas las listas nuevas tienen al menos dos variantes distintas y el tail solo existe en exploit y allows', () => {
  const lists: [string, unknown][] = [];
  const collect = (o: unknown, path: string) => {
    if (Array.isArray(o)) lists.push([path, o]);
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) collect(v, `${path}.${k}`);
  };
  for (const lang of LANGS5) {
    const tx = TEXTS[lang];
    lists.length = 0;
    collect({ frame: tx.frame, opp: tx.opp, line: tx.line, intent: tx.intent }, lang);
    assert.equal(lists.length, 4 * 5 + 4 * 5 + 6 + 7, `${lang}: ${lists.length}`);
    for (const [path, l] of lists) assert.ok(Array.isArray(l) && l.length >= 2 && new Set(l).size === l.length && l.every((x) => typeof x === 'string' && x.length > 0), path);
    for (const s of STYLES) {
      assert.deepEqual(Object.keys(tx.frame[s].good), ['lead'], lang);
      assert.deepEqual(Object.keys(tx.frame[s].exploit).sort(), ['lead', 'tail'], lang);
      assert.deepEqual(Object.keys(tx.frame[s].allows).sort(), ['lead', 'tail'], lang);
      assert.deepEqual(Object.keys(tx.opp[s]).sort(), ['blunder', 'inaccuracy', 'mate', 'mistake', 'ok'], lang);
    }
  }
});

test('coachVoice sobre el rival cambia de frase según el estilo', () => {
  const keys = [
    { quality: 'good', mate: false }, { quality: 'inaccuracy', mate: false }, { quality: 'mistake', mate: false },
    { quality: 'blunder', mate: false }, { quality: 'best', mate: true },
  ] as const;
  for (const lang of ['es', 'en'] as const)
    for (const k of keys) {
      const outs = STYLES.map((style) => coachVoice({ lang, style, quality: k.quality, great: false, mate: k.mate, subject: 'opponent', move: 'Nf3', seed: 0 }));
      assert.equal(new Set(outs).size, 4, `${lang} ${k.quality}: ${outs.join(' | ')}`);
      for (const o of outs) assert.ok(o.includes('Nf3') && !o.includes('{') && !o.includes('—'), o);
    }
  // Con la semilla cambia la variante dentro del mismo estilo.
  const v = (seed: number) => coachVoice({ lang: 'es', style: 'agresivo', quality: 'blunder', great: false, mate: false, subject: 'opponent', move: 'Nf3', seed });
  assert.notEqual(v(0), v(1));
});
