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

test('prioridad en una jugada buena: el mate gana a la táctica, a la captura y al plan, y solo caben dos hechos', () => {
  const ex = coachExplanation({
    ...base, quality: 'best', bestSan: 'Nf3',
    facts: {
      mateIn: { n: 3, mover: true },
      found: [{ kind: 'pin', attacker: 'b', targets: ['n', 'k'] }],
      did: { kind: 'capture', piece: 'p' },
      plan: { kind: 'plain', piece: 'r', from: 'a1', to: 'a2' },
    },
  });
  assert.equal(ex.length, 1);
  const p = ex[0];
  assert.ok(p.includes('mate forzado en 3') && p.includes('clavada'), p);
  assert.ok(p.indexOf('mate forzado en 3') < p.indexOf('clavada'), p);
  assert.ok(!p.includes('captura') && !p.includes('pasa de'), p);
});

test('prioridad en una jugada mala: lo que hizo con el veredicto, el mate permitido como único hecho de por qué falla y la mejor jugada con su razón', () => {
  const [p] = coachExplanation({
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
  assert.ok(p.startsWith('Nc6+ captura un peón, pero es un error grave.'), p);
  assert.ok(p.includes('mate en 3') && p.includes('La mejor jugada era Nf3, porque captura un caballo.'), p);
  assert.ok(p.indexOf('captura un peón') < p.indexOf('mate en 3') && p.indexOf('mate en 3') < p.indexOf('La mejor jugada'), p);
  assert.ok(!p.includes('Nxe5') && !p.includes('horquilla') && !p.includes('clavada') && !p.includes('Qh5+') && !p.includes('pasa de'), p);
});

test('la jugada de mate abre el párrafo', () => {
  const [p] = coachExplanation({ ...base, quality: 'best', facts: { did: { kind: 'mate' }, plan: { kind: 'plain', piece: 'n', from: 'e5', to: 'c6' } } });
  assert.ok(p.includes('Nc6+ da jaque mate.') && !p.includes('se mueve de'), p);
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
  ['expl.', ['move', 'san', 'piece', 'best', 'why', 'Attacker', 'target', 'sq']],
  ['verdict.', []], ['why.', ['piece', 'attacker', 'targets', 'targetsDef', 'target', 'sq', 'from', 'to']],
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

const esFmt = (s: string) => s.replace(/[NBRQK]/g, (c) => ({ N: 'C', B: 'A', R: 'T', Q: 'D', K: 'R' })[c as 'N']);
const rd = { capturer: 'b' as const, removed: 'n' as const, removedSq: 'f6', target: 'p' as const, targetSq: 'd4' };
const rdLine = { sans: ['Bxf6', 'gxf6', 'Nxd4'], material: 1, removeDefender: rd };
// El caso del usuario: el rival desarrolla un caballo y deja que se capture otro que defendía un peón.
const userCase: Facts = {
  line: rdLine,
  allows: { kind: 'capture', san: 'Bxf6', piece: 'n', ofMoved: false },
  plan: { kind: 'develop', piece: 'n', from: 'b8', to: 'c6' },
};
const leadsOf = (style: BotStyle, sit: 'good') => TEXTS.es.frame[style][sit].lead;
const bump = { ...base, fmt: esFmt, bestSan: 'Nc6' };


const spanish = (o: Partial<Parameters<typeof coachExplanation>[0]> & { facts: Facts }) => coachExplanation({ ...bump, subject: 'opponent', quality: 'blunder', ...o })[0];
const idx = (p: string, s: string | RegExp) => (typeof s === 'string' ? p.indexOf(s) : p.search(s));

test('el caso del usuario: la idea con su veredicto, el hecho de por qué falla y la mejor jugada, en ese orden', () => {
  for (const style of STYLES)
    for (const seed of [0, 1, 2, 3]) {
      const p = spanish({ style, seed, facts: userCase });
      const verdict = idx(p, ', pero es un error grave.');
      const fact = idx(p, /Eliminar al defensor/i);
      const best = idx(p, 'La mejor jugada para el rival era Cc6');
      assert.ok(/desarrollaba|sacar/.test(p.slice(0, verdict)) && verdict > 0, p);
      assert.ok(fact > verdict && best > fact, p);
      assert.ok(p.includes('Axf6') && p.includes('caballo') && p.includes('d4'), p);
      assert.ok(p.length <= EXPLANATION_CAP, p);
      assert.ok(!p.includes('saca una pieza menor') && !p.includes('Desarrolla el caballo'), p);
      assert.ok(!p.includes('puedes capturar'), p);
    }
});

test('el veredicto sigue a la calidad y no hay frase de costo en peones', () => {
  const only: Facts = { plan: { kind: 'develop', piece: 'n', from: 'b8', to: 'c6' } };
  for (const [quality, verdict] of [['inaccuracy', 'pero es una imprecisión.'], ['mistake', 'pero es un error.'], ['blunder', 'pero es un error grave.']] as const) {
    const p = spanish({ quality, facts: only });
    assert.ok(p.includes(', ' + verdict) && !/peones|Cuesta/.test(p), p);
  }
  const inEn = spanish({ lang: 'en', fmt: (s) => s, bestSan: 'Nc6', quality: 'mistake', facts: only });
  assert.ok(/, but it is a mistake\./.test(inEn) && /The best move for your opponent was Nc6\./.test(inEn), inEn);
});

test('una jugada mala sin idea (captura o jaque) abre con lo que hizo y el veredicto', () => {
  const p = spanish({ move: 'Dxf7+', subject: 'you', facts: { did: { kind: 'capture', piece: 'p' }, allows: { kind: 'capture', san: 'Bxf6', piece: 'n', ofMoved: false } } });
  assert.ok(p.startsWith('Dxf7+ captura un peón, pero es un error grave.'), p);
  assert.ok(p.includes('Deja que el rival capture un caballo con Axf6.') && p.includes('La mejor jugada era Cc6.'), p);
  const check = spanish({ move: 'Dh5+', subject: 'you', facts: { did: { kind: 'check' }, allows: { kind: 'check', san: 'Dxh5+' } } });
  assert.ok(check.startsWith('Dh5+ da jaque, pero es un error grave.'), check);
});

test('la mejor jugada dice por qué lo era solo con razones comprobadas', () => {
  const you = (facts: Facts, bestSan = 'Nf3') => spanish({ subject: 'you', bestSan, facts });
  assert.ok(you({ missed: { kind: 'capture', piece: 'n' } }).includes('La mejor jugada era Cf3, porque captura un caballo.'));
  assert.ok(you({ bestWhy: { found: [{ kind: 'fork', attacker: 'n', targets: ['k', 'r'] }] } }).includes('porque el caballo ataca al rey y a la torre a la vez.'));
  assert.ok(you({ bestWhy: { found: [{ kind: 'hanging', attacker: 'r', targets: ['q'] }] } }).includes('porque la torre captura la dama, que nadie defendía.'));
  assert.ok(you({ bestWhy: { threat: { attacker: 'b', target: 'n', square: 'd4', free: true } } }).includes('porque el alfil ataca al caballo de d4, que no tiene defensores.'));
  assert.ok(you({ bestWhy: { threat: { attacker: 'p', target: 'n', square: 'e5', free: false } } }).includes('porque el peón ataca al caballo de e5, una pieza de más valor.'));
  assert.ok(you({ bestWhy: { plan: { kind: 'develop', piece: 'n', from: 'g1', to: 'f3' } } }).includes('porque desarrolla el caballo de g1 a f3.'));
  assert.ok(spanish({ bestSan: 'Nf3', facts: { bestWhy: { plan: { kind: 'center', piece: 'n', from: 'g1', to: 'f3' } } } }).includes('La mejor jugada para el rival era Cf3, porque lleva el caballo a f3, una casilla central.'));
  // Avanzar un peón o retroceder no explican nada: sin «porque».
  for (const kind of ['pawnAdvance', 'retreat', 'plain'] as const) {
    const p = you({ bestWhy: { plan: { kind, piece: 'p', from: 'e2', to: 'e4' } } });
    assert.ok(p.includes('La mejor jugada era Cf3.') && !p.includes('porque'), p);
  }
  // Si la jugada jugada ya hacía lo mismo, el «porque» no explicaría la diferencia: se omite.
  const same = you({ threat: { attacker: 'b', target: 'n', square: 'd4', free: true }, plan: { kind: 'develop', piece: 'b', from: 'f8', to: 'c5' }, bestWhy: { threat: { attacker: 'p', target: 'n', square: 'd4', free: true } } });
  assert.ok(same.includes('La mejor jugada era Cf3.') && !same.includes('porque'), same);
  const samePlan = you({ plan: { kind: 'develop', piece: 'b', from: 'f8', to: 'c5' }, bestWhy: { plan: { kind: 'develop', piece: 'n', from: 'g1', to: 'f3' } } });
  assert.ok(!samePlan.includes('porque'), samePlan);
});

test('con la oportunidad perdida de la línea del motor, esa frase ya nombra la mejor jugada; un mate perdido va como mate', () => {
  const missedLine = { sans: ['Qxf7+', 'Kxf7', 'Bxe6'], material: 3 };
  for (const subject of ['you', 'opponent'] as const) {
    const p = spanish({ subject, quality: 'mistake', facts: { missedLine } });
    assert.ok(p.includes('3 puntos de material') && /ganabas|podías ganar/.test(p) && !p.includes('La mejor jugada'), p);
    const rdp = spanish({ subject, quality: 'mistake', facts: { missedLine: { ...rdLine, material: 1 } } });
    assert.ok(rdp.includes('Se podía eliminar al defensor') && rdp.includes('Axf6') && !rdp.includes('La mejor jugada'), rdp);
  }
  const mate = spanish({ subject: 'you', bestSan: 'Qxf7#', facts: { missed: { kind: 'mate' }, line: rdLine } });
  assert.ok(mate.includes('Había mate con Dxf7#.') && !mate.includes('La mejor jugada') && !mate.includes('porque'), mate);
  assert.ok(spanish({ subject: 'opponent', bestSan: 'Qxf7#', facts: { missed: { kind: 'mate' } } }).includes('El rival no vio el mate con Dxf7#.'));
  assert.ok(coachExplanation({ ...bump, lang: 'en', fmt: (s) => s, subject: 'you', quality: 'blunder', bestSan: 'Qxf7#', facts: { missed: { kind: 'mate' }, line: rdLine } })[0].includes('There was mate with Qxf7#.'));
});

test('lo que falla: el mate permitido gana a eliminar al defensor, y este a otras tácticas y al material', () => {
  const tactic = { kind: 'pin' as const, attacker: 'b' as const, targets: ['n' as const, 'k' as const] };
  const material = { sans: ['Qxf7+', 'Kxf7', 'Bxe6'], material: 4 };
  const a = spanish({ subject: 'you', facts: { mateIn: { n: 2, mover: false }, line: rdLine, allowsTactic: { tactic, san: 'Bb5' } } });
  assert.ok(a.includes('mate en 2') && !/Eliminar al defensor|clavada/i.test(a), a);
  const b = spanish({ subject: 'you', facts: { line: rdLine, allowsTactic: { tactic, san: 'Bb5' } } });
  assert.ok(/Eliminar al defensor/i.test(b) && !/clavada/.test(b), b);
  const c = spanish({ subject: 'you', facts: { allowsTactic: { tactic, san: 'Bb5' }, line: material } });
  assert.ok(/clavada/.test(c) && !c.includes('puntos de material'), c);
  const d = spanish({ subject: 'opponent', facts: { line: material, allows: { kind: 'check', san: 'Bxf6+' } } });
  assert.ok(d.includes('puntos de material') && !d.includes('Puedes responder con'), d);
  assert.ok(spanish({ facts: { line: rdLine, allows: { kind: 'mate', san: 'Dh7#' } } }).includes('mate'), 'un mate permitido siempre se dice');
  // Con la línea del motor no se repiten la captura ni el jaque permitidos.
  assert.ok(!spanish({ facts: { line: rdLine, allows: { kind: 'check', san: 'Bxf6+' } } }).includes('Puedes responder con'));
});

test('el error propio con eliminar al defensor usa el texto allows; el del rival, el de exploit', () => {
  for (const style of STYLES) {
    const own = spanish({ style, subject: 'you', facts: { line: rdLine } });
    assert.ok(/Eliminar al defensor/i.test(own) && /el rival/i.test(own) && own.includes('Axf6') && !own.includes('Se podía eliminar'), own);
  }
  const opp = spanish({ facts: { line: rdLine } });
  assert.ok(!opp.includes('el rival se lleva') && !opp.includes('el rival captura'), opp);
});

test('la amenaza de la jugada jugada se dice si no hay otro hecho de lo que falla', () => {
  const threat = { attacker: 'b' as const, target: 'n' as const, square: 'd4', free: true };
  const p = spanish({ quality: 'inaccuracy', facts: { threat, plan: { kind: 'develop', piece: 'b', from: 'f8', to: 'c5' } } });
  assert.ok(p.includes('El alfil ataca al caballo de d4, que no tiene defensores.'), p);
  assert.ok(idx(p, ', pero es una imprecisión.') < idx(p, 'El alfil ataca') && idx(p, 'El alfil ataca') < idx(p, 'La mejor jugada'), p);
  // Con otro hecho, la amenaza no entra: el párrafo tiene una sola razón de por qué falla.
  const other = spanish({ quality: 'inaccuracy', facts: { threat, line: rdLine } });
  assert.ok(!other.includes('El alfil ataca al caballo'), other);
});

test('la cola con la voz del bot solo existe si el rival erró o el error permitió algo', () => {
  const tailsOf = (style: BotStyle, sit: 'exploit' | 'allows') => TEXTS.es.frame[style][sit].tail;
  for (const style of STYLES)
    for (const seed of [0, 1, 2, 3]) {
      const opp = spanish({ style, seed, facts: { missed: { kind: 'capture', piece: 'n' } } });
      assert.ok(tailsOf(style, 'exploit').some((t) => opp.endsWith(t)), opp);
      const own = spanish({ style, seed, subject: 'you', facts: { allows: { kind: 'check', san: 'Dh5+' } } });
      assert.ok(tailsOf(style, 'allows').some((t) => own.endsWith(t)), own);
      const miss = spanish({ style, seed, subject: 'you', facts: { missed: { kind: 'capture', piece: 'n' } } });
      assert.ok(![...tailsOf(style, 'exploit'), ...tailsOf(style, 'allows')].some((t) => miss.endsWith(t)), miss);
    }
});

test('si el párrafo no entra se quita primero la cola, luego el hecho de por qué falla y por último la idea', () => {
  const names = ['Qxf7+', 'Kxf7', 'Bxe6+'];
  const tails = [...TEXTS.es.frame.tranquilo.exploit.tail];
  const facts: Facts = { line: { sans: names, material: 3 }, plan: { kind: 'develop', piece: 'n', from: 'b8', to: 'c6' } };
  const rows = Array.from({ length: 301 }, (_, pad) => {
    const fmt = (s: string) => s.padEnd(pad, '_');
    const p = coachExplanation({ ...base, style: 'tranquilo', fmt, seed: 0, subject: 'opponent', quality: 'blunder', bestSan: 'Nf3', facts })[0];
    return { p, tail: tails.some((t) => p.endsWith(t)), fact: p.includes('puntos de material') || p.includes('secuencia'), idea: /pero es un error grave/.test(p), best: p.includes('La mejor jugada para el rival era') };
  });
  const rank = (r: (typeof rows)[number]) => (r.tail ? 0 : r.fact ? 1 : r.idea ? 2 : 3);
  for (let i = 1; i < rows.length; i++) assert.ok(rank(rows[i]) >= rank(rows[i - 1]), `${rows[i - 1].p} => ${rows[i].p}`);
  assert.deepEqual([...new Set(rows.map(rank))], [0, 1, 2, 3]);
  assert.ok(rows.every((r) => r.best), 'la mejor jugada nunca se quita');
  assert.ok(rows[0].tail && rows[0].fact && rows[0].idea);
});

test('el tope de largo se cumple en los cinco idiomas', () => {
  let checked = 0;
  for (const lang of LANGS5)
    for (const style of STYLES)
      for (const seed of [0, 1, 2, 3])
        for (const s of SAMPLES) {
          const ex = coachExplanation({ ...base, lang, style, seed, subject: s.subject, quality: s.quality, bestSan: 'Nf3', facts: s.facts });
          if (ex.length === 0) continue;
          checked++;
          assert.equal(ex.length, 1);
          assert.ok(ex[0].length <= EXPLANATION_CAP, `${lang} ${style} ${seed} ${s.label} (${ex[0].length}): ${ex[0]}`);
        }
  assert.ok(checked > 3000, String(checked));
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
      const best = lang === 'es' ? 'La mejor jugada para el rival era Nf3' : 'The best move for your opponent was Nf3';
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

test('una secuencia nunca se muestra recortada: o sale entera o se usa una variante sin secuencia, en es y en', () => {
  const lines = [
    { sans: ['Qxf7+', 'Kxf7', 'Bxe6+', 'Kg8'], material: 5 },
    { sans: ['Qxf7+', 'Kxf7', 'Bxe6+'], material: 4 },
    { sans: ['Qxf7+', 'Kxf7'], material: 3 },
    { sans: ['Qxf7+'], material: 2 },
    rdLine,
  ];
  const seqLiterals = (lang: 'es' | 'en') =>
    Object.values(TEXTS[lang].line)
      .flatMap((g) => Object.values(g).flat())
      .filter((s) => s.includes('{seq}'))
      .map((s) => s.slice(0, s.indexOf('{seq}')).replace(/\{\w+\}/g, '\u0000').split('\u0000').pop() as string);
  let withSeq = 0;
  let withoutSeq = 0;
  for (const lang of ['es', 'en'] as const) {
    const literals = seqLiterals(lang);
    assert.ok(literals.length >= 6 && literals.every((l) => l.length >= 4), literals.join('|'));
    for (const line of lines)
      for (const style of STYLES)
        for (const seed of [0, 1, 2, 3])
          for (const pad of [0, 10, 20, 30, 40, 50, 60, 80]) {
            const fmt = (s: string) => s.padEnd(pad, '_');
            const full = line.sans.slice(0, 3).map(fmt).join(' ');
            for (const [subject, key] of [['opponent', 'line'], ['you', 'line'], ['you', 'missedLine']] as const) {
              const ex = coachExplanation({ ...base, lang, fmt, style, seed, subject, quality: 'blunder', bestSan: '', facts: { [key]: line } as Facts });
              for (const p of ex) {
                for (const lit of literals) {
                  if (!p.includes(lit)) continue;
                  withSeq++;
                  assert.ok(p.includes(lit + full), `${lang} pad ${pad}: ${p}`);
                }
                if (!literals.some((l) => p.includes(l))) withoutSeq++;
                if (pad <= 20) assert.ok(p.length <= EXPLANATION_CAP, p);
              }
            }
          }
  }
  assert.ok(withSeq > 100 && withoutSeq > 100, `${withSeq} ${withoutSeq}`);
  // Y el caso concreto: con jugadas largas sale la variante que nombra la primera jugada, no una secuencia cortada.
  const long = coachExplanation({ ...base, style: 'tranquilo', fmt: (s) => s.padEnd(120, '_'), seed: 0, subject: 'opponent', quality: 'blunder', bestSan: '', facts: { line: lines[1] } })[0];
  assert.ok(long.includes('empieza una secuencia') && long.includes('Qxf7+'.padEnd(120, '_')) && !long.includes('Kxf7'), long);
});

test('toda línea del motor tiene al menos una variante con y otra sin {seq}, en los cinco idiomas', () => {
  for (const lang of LANGS5)
    for (const [group, texts] of Object.entries(TEXTS[lang].line))
      for (const [sit, list] of Object.entries(texts as Record<string, string[]>))
        assert.ok(list.some((s) => !s.includes('{seq}')) && list.some((s) => s.includes('{seq}')), `${lang} ${group}.${sit}`);
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

test('todas las listas nuevas tienen al menos dos variantes distintas; verdict y why están completos', () => {
  const lists: [string, unknown][] = [];
  const collect = (o: unknown, path: string) => {
    if (Array.isArray(o)) lists.push([path, o]);
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) collect(v, `${path}.${k}`);
  };
  for (const lang of LANGS5) {
    const tx = TEXTS[lang];
    lists.length = 0;
    collect({ frame: tx.frame, opp: tx.opp, line: tx.line, intent: tx.intent }, lang);
    assert.equal(lists.length, 4 * 3 + 4 * 5 + 6 + 7, `${lang}: ${lists.length}`);
    for (const [path, l] of lists) assert.ok(Array.isArray(l) && l.length >= 2 && new Set(l).size === l.length && l.every((x) => typeof x === 'string' && x.length > 0), path);
    for (const s of STYLES) {
      assert.deepEqual(Object.keys(tx.frame[s]).sort(), ['allows', 'exploit', 'good'], lang);
      assert.deepEqual(Object.keys(tx.frame[s].good), ['lead'], lang);
      assert.deepEqual(Object.keys(tx.frame[s].exploit), ['tail'], lang);
      assert.deepEqual(Object.keys(tx.frame[s].allows), ['tail'], lang);
      assert.deepEqual(Object.keys(tx.opp[s]).sort(), ['blunder', 'inaccuracy', 'mate', 'mistake', 'ok'], lang);
    }
    assert.deepEqual(Object.keys(tx.verdict).sort(), ['blunder', 'inaccuracy', 'mistake'], lang);
    assert.deepEqual(Object.keys(tx.why).sort(), [...KINDS, 'capture', 'threatFree', 'threatValue', 'develop', 'center', 'rookFile', 'pawnBreak', 'kingActive', 'trade'].sort(), lang);
    for (const v of Object.values(tx.verdict)) assert.ok(v.endsWith('.'), `${lang}: el veredicto cierra la frase`);
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

// ---- Amenazas y la estructura de una jugada mala en los cinco idiomas ----
test('amenaza de una jugada buena sale rellenada y legible en los cinco idiomas', () => {
  const facts: Facts = { threat: { attacker: 'b', target: 'n', square: 'd4', free: true } };
  for (const lang of LANGS5) {
    const ex = coachExplanation({ ...base, lang, quality: 'good', facts })[0];
    assert.ok(ex.includes('d4') && !ex.includes('{') && !/undefined/.test(ex), `${lang}: ${ex}`);
  }
  const value = coachExplanation({ ...base, quality: 'good', facts: { threat: { attacker: 'p', target: 'n', square: 'e5', free: false } } })[0];
  assert.ok(value.includes('El peón ataca al caballo de e5, una pieza de más valor.'), value);
});

test('una jugada mala sale con idea, veredicto, razón y mejor jugada en los cinco idiomas', () => {
  const facts: Facts = {
    plan: { kind: 'develop', piece: 'n', from: 'b1', to: 'a3' },
    line: rdLine,
    bestWhy: { found: [{ kind: 'fork', attacker: 'b', targets: ['q', 'r'] }] },
  };
  for (const lang of LANGS5)
    for (const subject of ['you', 'opponent'] as const)
      for (const quality of ['inaccuracy', 'mistake', 'blunder'] as const) {
        const [p] = coachExplanation({ ...base, lang, subject, quality, bestSan: 'Bc2', fmt: (s) => s, style: 'equilibrado', seed: 1, facts });
        assert.ok(p.includes('Bc2') && p.includes(TEXTS[lang].verdict[quality].replace(/\.$/, '')), `${lang} ${subject} ${quality}: ${p}`);
        assert.ok(!p.includes('{') && !p.includes('}') && !/undefined/.test(p) && !p.includes('—') && p.length <= EXPLANATION_CAP, `${lang}: ${p}`);
      }
});
