import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { buildReview, factsFor, ratePly, winPercent } from './build';
import { analyzeLine } from './lines';
import { detectTactics } from './tactics';
import { bookPositions, positionKey } from './book';
import { coachExplanation, coachVoice } from './coachText';
import { parseGame } from './pgn';
import { clearPendingGame, peekPendingGame, setPendingGame, sideOf } from './session';
import { parseChessComMonth, parseLichessNdjson, validUsername } from './sources';
import type { GameMove, PositionEval } from './types';

const PGN = `[Event "Test"]
[White "Ana"]
[Black "Beto"]
[Result "1-0"]

1. e4 {[%clk 0:03:00]} e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0`;

test('lee un PGN con comentarios de reloj', () => {
  const g = parseGame(PGN);
  assert.ok(g);
  assert.equal(g.white, 'Ana');
  assert.equal(g.black, 'Beto');
  assert.equal(g.moves.length, 7);
  assert.equal(g.moves[0].uci, 'e2e4');
  assert.equal(g.moves[6].san, 'Qxf7#');
});

test('un texto que no es partida da null', () => {
  assert.equal(parseGame('hola'), null);
  assert.equal(parseGame(''), null);
  assert.equal(parseGame('1. e4 e5 2. Ke4'), null);
});

test('con varias partidas se queda con la primera', () => {
  const two = `${PGN}\n\n[Event "Otra"]\n[White "X"]\n[Black "Y"]\n\n1. d4 d5 *`;
  assert.equal(parseGame(two)?.moves.length, 7);
});

test('winPercent es simétrica', () => {
  assert.ok(Math.abs(winPercent(0, 'w') - 50) < 1e-9);
  assert.ok(Math.abs(winPercent(300, 'w') + winPercent(300, 'b') - 100) < 1e-9);
  assert.equal(winPercent(10000, 'w'), 100);
});

/** Evaluaciones inventadas: la jugada 3 (Dh5) pierde ventaja, el resto mantiene. */
function fakeEvals(n: number): PositionEval[] {
  const g = parseGame(PGN)!;
  const evals: PositionEval[] = [];
  for (let i = 0; i <= n; i++) evals.push({ score: 30, best: i < g.moves.length ? g.moves[i].uci : '' });
  return evals;
}

test('clasifica: mejor jugada, error y mate destacado', () => {
  const g = parseGame(PGN)!;
  const evals = fakeEvals(g.moves.length);
  // Después de 2. Dh5 (jugada 3) las blancas pasan de +0,3 a −2,5 (error de verdad)
  evals[3].score = -250;
  evals[2].best = 'g1f3';
  const r = buildReview(g, evals, new Set());
  assert.equal(r.plies.length, 7);
  assert.equal(r.plies[0].quality, 'best'); // jugó la del motor
  assert.equal(r.plies[2].move.san, 'Qh5');
  assert.ok(['mistake', 'blunder'].includes(r.plies[2].quality));
  assert.equal(r.plies[2].bestSan, 'Nf3');
  assert.ok(r.plies[2].highlight);
  assert.ok(r.plies[6].highlight, 'el mate siempre se destaca');
  assert.deepEqual(r.highlights.includes(2), true);
});

test('una jugada de libro se marca como book', () => {
  const g = parseGame(PGN)!;
  const book = new Set([positionKey(g.moves[0].fenAfter)]);
  const r = buildReview(g, fakeEvals(g.moves.length), book);
  assert.equal(r.plies[0].quality, 'book');
});

test('el libro de aperturas trae la posición tras 1.e4', () => {
  const g = parseGame(PGN)!;
  assert.ok(bookPositions().has(positionKey(g.moves[0].fenAfter)));
});

test('hechos: el rival captura una pieza o da mate', () => {
  // Blancas: Dh5 (Qh5) deja la dama atacada? Aquí: tras 1.e4 e5 2.Dh5 Cc6 3.Ac4 Cf6?? 4.Dxf7#
  const g = parseGame(PGN)!;
  const blunder = g.moves[5]; // 3...Nf6, deja Dxf7#
  const f = factsFor(blunder, 'g7g6', 'h5f7', 'blunder');
  assert.equal(f.allows?.kind, 'mate');
});

test('hechos: no hay hechos de error en una jugada buena', () => {
  const g = parseGame(PGN)!;
  const f = factsFor(g.moves[0], 'e2e4', 'e7e5', 'best');
  assert.equal(f.allows, undefined);
  assert.equal(f.missed, undefined);
});

/** Arma una GameMove aplicando `uci` sobre `fen` con chess.js. */
function mk(fen: string, uci: string): GameMove {
  const c = new Chess(fen);
  const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined });
  return { san: m.san, uci, color: m.color, fenBefore: fen, fenAfter: c.fen() };
}
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const FORK_FEN = '1r6/4k3/8/8/3N4/8/8/6K1 w - - 0 1'; // Cc6+ ataca rey y torre
// Las negras tienen Cc2+ (orquilla de rey y torre) y las blancas juegan h3 sin verlo.
const ALLOW_FORK_FEN = '6k1/8/8/8/1n6/8/7P/R3K3 w - - 0 1';
// Las blancas dejan el caballo de d4 sin defensa y la dama negra lo captura.
const HANGING_FEN = '6k1/3q4/8/8/3N4/8/7P/4K3 w - - 0 1';

test('factsFor: jugada buena que encuentra una orquilla trae found', () => {
  const f = factsFor(mk(FORK_FEN, 'd4c6'), 'd4c6', '', 'best');
  assert.equal(f.found?.[0].kind, 'fork');
  assert.equal(f.plan, undefined, 'con found no hay plan');
});

test('factsFor: found trae como mucho 2 tácticas', () => {
  const move = mk(FORK_FEN, 'd4c6');
  assert.ok(detectTactics(move.fenBefore, move.uci).length >= 1);
  assert.ok((factsFor(move, '', '', 'good').found?.length ?? 0) <= 2);
});

test('factsFor: un error cuya mejor respuesta es una orquilla trae allowsTactic con su SAN', () => {
  const move = mk(ALLOW_FORK_FEN, 'h2h3');
  assert.equal(detectTactics(move.fenAfter, 'b4c2')[0].kind, 'fork');
  const f = factsFor(move, 'a1a8', 'b4c2', 'blunder');
  assert.equal(f.allowsTactic?.tactic.kind, 'fork');
  assert.equal(f.allowsTactic?.san, 'Nc2+');
  assert.equal(factsFor(move, 'a1a8', 'b4c2', 'best').allowsTactic, undefined, 'solo con calidad mala');
});

test('factsFor: sin replyUci no hay allowsTactic y no lanza error', () => {
  const move = mk(FORK_FEN, 'd4c6');
  assert.equal(factsFor(move, 'd4c6', '', 'blunder').allowsTactic, undefined);
});

test('factsFor: si allows ya es una captura de la misma respuesta, allowsTactic hanging se omite', () => {
  const move = mk(HANGING_FEN, 'h2h3');
  assert.equal(detectTactics(move.fenAfter, 'd7d4')[0].kind, 'hanging');
  const f = factsFor(move, 'd4b5', 'd7d4', 'blunder');
  assert.equal(f.allows?.kind, 'capture');
  assert.equal(f.allowsTactic, undefined);
});

test('factsFor: mate en N con scoreAfter', () => {
  const e4 = mk(START, 'e2e4');
  assert.deepEqual(factsFor(e4, '', '', 'best', 9996).mateIn, { n: 5, mover: true });
  assert.deepEqual(factsFor(e4, '', '', 'book', 9996).mateIn, { n: 5, mover: true });
  assert.deepEqual(factsFor(e4, '', 'e7e5', 'blunder', -9997).mateIn, { n: 3, mover: false });
  const e5 = mk(e4.fenAfter, 'e7e5');
  assert.deepEqual(factsFor(e5, '', '', 'best', -9996).mateIn, { n: 5, mover: true });
  assert.deepEqual(factsFor(e5, '', '', 'mistake', 9997).mateIn, { n: 3, mover: false });
});

test('factsFor: mate en N se omite en los casos ya cubiertos o sin sentido', () => {
  const e4 = mk(START, 'e2e4');
  assert.equal(factsFor(e4, '', '', 'best', 10000).mateIn, undefined, 'k = 0 ya es did.mate');
  assert.equal(factsFor(e4, '', '', 'blunder', -9999).mateIn, undefined, 'k = 1 ya es allows.mate');
  assert.equal(factsFor(e4, '', '', 'best', -9997).mateIn, undefined, 'mate rival con buena jugada');
  assert.equal(factsFor(e4, '', '', 'blunder', 9996).mateIn, undefined, 'mate propio con mala calidad');
  assert.equal(factsFor(e4, '', '', 'good', 9996).mateIn, undefined);
  assert.equal(factsFor(e4, '', '', 'best', 300).mateIn, undefined);
  assert.equal(factsFor(e4, '', '', 'best').mateIn, undefined);
});

test('factsFor: toda jugada sin did ni found trae plan; con captura no', () => {
  const e4 = factsFor(mk(START, 'e2e4'), '', '', 'best');
  assert.equal(e4.plan?.kind, 'center');
  const conCaptura = mk('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'e4d5');
  const f = factsFor(conCaptura, '', '', 'best');
  assert.equal(f.did?.kind, 'capture');
  assert.equal(f.plan, undefined);
});

test('factsFor: un mate que también es orquilla no trae fork ni skewer', () => {
  // Ce5-f7 es mate ahogado y además ataca a la dama de d8.
  const move = mk('3q2rk/6pp/8/4N3/8/8/8/6K1 w - - 0 1', 'e5f7');
  assert.equal(detectTactics(move.fenBefore, move.uci)[0].kind, 'fork');
  const f = factsFor(move, 'e5f7', '', 'best');
  assert.equal(f.did?.kind, 'mate');
  assert.equal(f.found, undefined);
});

test('factsFor: un mate del pasillo conserva backRank', () => {
  const f = factsFor(mk('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', 'a1a8'), 'a1a8', '', 'best');
  assert.deepEqual(f.found?.map((t) => t.kind), ['backRank']);
});

test('factsFor: recapturar en la casilla del rival no trae hanging; una captura libre en otra casilla sí', () => {
  const move = mk('6k1/8/8/8/R3n3/8/8/4K3 w - - 0 1', 'a4e4');
  assert.equal(factsFor(move, '', '', 'best').found?.[0].kind, 'hanging');
  assert.equal(factsFor(move, '', '', 'best', undefined, 'e4').found, undefined);
  assert.equal(factsFor(move, '', '', 'best', undefined, 'h5').found?.[0].kind, 'hanging');
});

test('factsFor conserva allows y missed existentes', () => {
  // Las blancas tenían Ta8# y juegan Rh1.
  const move = mk('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', 'g1h1');
  const f = factsFor(move, 'a1a8', '', 'blunder');
  assert.deepEqual(f.missed, { kind: 'mate' });
  assert.equal(f.allows, undefined);
  const g = parseGame(PGN)!;
  assert.equal(factsFor(g.moves[5], 'g7g6', 'h5f7', 'blunder').allows?.kind, 'mate');
});

// Lichess puzzle fXWxU: el rival juega d5f5 y el motor sigue con f3f5 e6f5 e3g5 (quita al defensor y gana un peón).
const FXWXU_FEN = '8/5p2/2k1p3/1p1r2p1/1P5p/2K1BR2/5P2/8 b - - 2 50';
const FXWXU_REPLY = ['f3f5', 'e6f5', 'e3g5'];
// Lichess puzzle XRAot: el rival juega e7f5 y el motor sigue con e8e5 f6e5 g3f5 (quita la dama defensora y gana el caballo).
const XRAOT_FEN = '4Q3/4n1pk/5p1p/3pq3/8/6NP/5PPK/8 b - - 8 34';
const XRAOT_REPLY = ['e8e5', 'f6e5', 'g3f5'];

test('factsFor: error del rival con la línea de fXWxU trae line con removeDefender', () => {
  const f = factsFor(mk(FXWXU_FEN, 'd5f5'), '', 'f3f5', 'blunder', undefined, undefined, { reply: FXWXU_REPLY });
  assert.deepEqual(f.line?.removeDefender, { capturer: 'r', removed: 'r', removedSq: 'f5', target: 'p', targetSq: 'g5' });
  assert.equal(f.line?.material, 1);
  assert.equal(f.missedLine, undefined);
  const g = factsFor(mk(XRAOT_FEN, 'e7f5'), '', 'e8e5', 'mistake', undefined, undefined, { reply: XRAOT_REPLY });
  assert.deepEqual(g.line?.removeDefender, { capturer: 'q', removed: 'q', removedSq: 'e5', target: 'n', targetSq: 'f5' });
  assert.equal(g.line?.material, 3);
});

test('factsFor: la línea solo se añade con jugada mala', () => {
  const move = mk(FXWXU_FEN, 'd5f5');
  for (const q of ['book', 'best', 'excellent', 'good'] as const) {
    const f = factsFor(move, '', 'f3f5', q, undefined, undefined, { reply: FXWXU_REPLY, best: FXWXU_REPLY });
    assert.equal(f.line, undefined, q);
    assert.equal(f.missedLine, undefined, q);
  }
  assert.ok(factsFor(move, '', 'f3f5', 'inaccuracy', undefined, undefined, { reply: FXWXU_REPLY }).line);
});

test('factsFor: missedLine con una línea que gana 3 puntos desde antes de la jugada', () => {
  // Tras e7f5 las blancas tienen Dxe5 y juegan h4 sin verlo.
  const after = new Chess(XRAOT_FEN);
  after.move('e7f5');
  const move = mk(after.fen(), 'h3h4');
  const f = factsFor(move, 'e8e5', '', 'blunder', undefined, undefined, { best: XRAOT_REPLY });
  assert.equal(f.missedLine?.material, 3);
  assert.equal(f.missedLine?.sans[0], 'Qxe5');
  assert.equal(f.line, undefined);
});

test('factsFor: sin pvs, con pv vacía o ilegal no hay line ni missedLine y lo demás no cambia', () => {
  const move = mk(FXWXU_FEN, 'd5f5');
  const base = factsFor(move, 'a1a8', 'f3f5', 'blunder');
  assert.equal(base.line, undefined);
  assert.equal(base.missedLine, undefined);
  for (const pvs of [{}, { reply: [], best: [] }, { reply: ['a1a8', 'h7h8'], best: ['e2e9'] }]) {
    const f = factsFor(move, 'a1a8', 'f3f5', 'blunder', undefined, undefined, pvs);
    assert.deepEqual(f, base);
  }
});

test('factsFor: una línea que gana menos de 2 puntos y sin removeDefender no trae line', () => {
  // Tras e7f5 la línea h4 (jugada tranquila) no gana nada.
  const move = mk(XRAOT_FEN, 'e7f5');
  assert.deepEqual(analyzeLine(move.fenAfter, ['h3h4'])?.material, 0);
  const f = factsFor(move, '', 'h3h4', 'blunder', undefined, undefined, { reply: ['h3h4'], best: ['h7g8'] });
  assert.equal(f.line, undefined);
  assert.equal(f.missedLine, undefined);
});

test('ratePly: pasa after.pv como line y before.pv como missedLine', () => {
  const black = mk(XRAOT_FEN, 'e7f5');
  const r = ratePly(1, black, { score: 0, best: 'e7e6' }, { score: 500, best: 'e8e5', pv: XRAOT_REPLY }, new Set());
  assert.equal(r.quality, 'blunder');
  assert.equal(r.facts.line?.material, 3);
  assert.equal(r.facts.missedLine, undefined);
  const white = mk(black.fenAfter, 'h3h4');
  const r2 = ratePly(2, white, { score: 500, best: 'e8e5', pv: XRAOT_REPLY }, { score: -500, best: 'g7g6' }, new Set());
  assert.equal(r2.facts.missedLine?.material, 3);
  assert.equal(r2.facts.line, undefined);
});

test('buildReview: lleva after.pv y before.pv a los hechos de cada jugada', () => {
  const black = mk(XRAOT_FEN, 'e7f5');
  const white = mk(black.fenAfter, 'h3h4');
  const game = { white: 'A', black: 'B', result: '*', startFen: XRAOT_FEN, moves: [black, white] };
  const evals: PositionEval[] = [
    { score: 0, best: 'e7e6' },
    { score: 500, best: 'e8e5', pv: XRAOT_REPLY },
    { score: -500, best: 'g7g6' },
  ];
  const r = buildReview(game, evals, new Set());
  assert.equal(r.plies[0].facts.line?.material, 3);
  assert.equal(r.plies[1].facts.missedLine?.material, 3);
});

test('el comentarista cambia de voz según el estilo y el sujeto', () => {
  const base = { lang: 'es' as const, quality: 'blunder' as const, great: false, mate: false, move: 'Df3', seed: 0 };
  const a = coachVoice({ ...base, style: 'tranquilo', subject: 'you' });
  const b = coachVoice({ ...base, style: 'agresivo', subject: 'you' });
  const c = coachVoice({ ...base, style: 'agresivo', subject: 'opponent' });
  assert.notEqual(a, b);
  assert.ok(a.includes('Df3'));
  assert.ok(c.startsWith('¡El rival'));
  assert.ok(coachVoice({ ...base, lang: 'en', style: 'posicional', subject: 'you' }).includes('Df3'));
});

test('la explicación nombra solo hechos comprobados', () => {
  const lines = coachExplanation({
    lang: 'es',
    style: 'equilibrado',
    subject: 'you',
    quality: 'blunder',
    facts: { did: { kind: 'capture', piece: 'p' }, allows: { kind: 'capture', piece: 'q', san: 'Axd1', ofMoved: false }, missed: { kind: 'mate' } },
    move: 'Cxe5',
    bestSan: 'Dxf7#',
    fmt: (s) => s,
  });
  // Un único párrafo: lo que hizo la jugada con el veredicto, lo que permitió y el mate que se dejó pasar, en ese orden.
  assert.equal(lines.length, 1);
  const p = lines[0];
  assert.ok(p.startsWith('Cxe5 captura un peón, pero es un error grave.'), p);
  assert.ok(p.includes('Deja que el rival capture la dama con Axd1.') && p.includes('Había mate con Dxf7#.'), p);
  assert.ok(p.indexOf('Axd1') < p.indexOf('Había mate'), p);
  const none = coachExplanation({ lang: 'en', style: 'agresivo', subject: 'you', quality: 'best', facts: {}, move: 'e4', bestSan: '', fmt: (s) => s });
  assert.deepEqual(none, []);
});

test('chess.com: arma la lista y calcula el resultado', () => {
  const games = parseChessComMonth({
    games: [
      { url: 'u1', pgn: PGN, end_time: 100, time_class: 'blitz', white: { username: 'Ana', rating: 800, result: 'win' }, black: { username: 'Beto', rating: 790, result: 'checkmated' } },
      { url: 'u2', pgn: PGN, end_time: 200, time_class: 'rapid', white: { username: 'Ana', result: 'agreed' }, black: { username: 'Beto', result: 'agreed' } },
      { url: 'u3', white: { username: 'Ana' } }, // sin PGN: se ignora
    ],
  });
  assert.equal(games.length, 2);
  assert.equal(games[0].id, 'u2'); // la más nueva primero
  assert.equal(games[0].result, '1/2-1/2');
  assert.equal(games[1].result, '1-0');
});

test('lichess: lee ndjson y salta líneas rotas', () => {
  const line = JSON.stringify({ id: 'abc', createdAt: 5, speed: 'blitz', winner: 'black', pgn: PGN, players: { white: { user: { name: 'Ana' }, rating: 1500 }, black: { user: { name: 'Beto' } } } });
  const games = parseLichessNdjson(`${line}\nbasura{\n\n`);
  assert.equal(games.length, 1);
  assert.equal(games[0].result, '0-1');
  assert.equal(games[0].white, 'Ana');
});

test('nombres de usuario válidos', () => {
  assert.ok(validUsername('Passat1_9TDI2005'));
  assert.ok(!validUsername('a'));
  assert.ok(!validUsername('con espacio'));
  assert.ok(!validUsername('../x'));
});

test('de qué lado juega el usuario', () => {
  assert.equal(sideOf('ana', 'Ana', 'Beto'), 'w');
  assert.equal(sideOf('BETO', 'Ana', 'Beto'), 'b');
  assert.equal(sideOf('otro', 'Ana', 'Beto'), null);
  assert.equal(sideOf(undefined, 'Ana', 'Beto'), null);
});

test('la partida pendiente se puede leer varias veces hasta que se borra', () => {
  setPendingGame({ pgn: 'x' });
  assert.equal(peekPendingGame()?.pgn, 'x');
  assert.equal(peekPendingGame()?.pgn, 'x');
  clearPendingGame();
  assert.equal(peekPendingGame(), null);
});

// ---- El caso de la captura del 6-11-2026: ...Ac5 ataca el caballo de d4 y cuesta ~0,4 peones ----
const FEN_BEFORE_BC5 = 'rnbqkbnr/ppp3pp/8/3p1p2/3Np3/6P1/PPPPPPBP/RNBQ1RK1 b kq - 0 5';
const FEN_AFTER_BC5 = 'rnbqk1nr/ppp3pp/8/2bp1p2/3Np3/6P1/PPPPPPBP/RNBQ1RK1 w kq - 1 6';
const bc5: GameMove = { san: 'Bc5', uci: 'f8c5', color: 'b', fenBefore: FEN_BEFORE_BC5, fenAfter: FEN_AFTER_BC5 };

test('ratePly: cpLoss es la ventaja perdida desde quien jugó, en centipeones', () => {
  // Las negras estaban mejor por 0,33 (blancas −33) y quedan en −0,04 (blancas +4): pierden 37.
  const r = ratePly(10, bc5, { score: -33, best: 'c7c5' }, { score: 4, best: 'd4b3' }, new Set());
  assert.equal(r.cpLoss, 37);
  // Para las blancas el signo se invierte: perder ventaja es bajar la evaluación.
  const w: GameMove = { san: 'e4', uci: 'e2e4', color: 'w', fenBefore: FEN_AFTER_BC5, fenAfter: FEN_AFTER_BC5 };
  assert.equal(ratePly(1, w, { score: 50, best: 'e2e4' }, { score: 20, best: '' }, new Set()).cpLoss, 30);
  // Mejorar la evaluación no es pérdida.
  assert.equal(ratePly(1, w, { score: 10, best: '' }, { score: 80, best: '' }, new Set()).cpLoss, 0);
});

test('ratePly: una imprecisión de menos de 0,8 peones se marca pero no se destaca; una mayor sí', () => {
  const rate = (after: number) => ratePly(10, bc5, { score: -33, best: 'c7c5' }, { score: after, best: 'd4b3' }, new Set());
  const small = rate(25); // cuesta 58 cp
  assert.equal(small.quality, 'inaccuracy');
  assert.equal(small.cpLoss, 58);
  assert.equal(small.highlight, false);
  const edge = rate(40); // 73 cp: todavía chica
  assert.equal(edge.quality, 'inaccuracy');
  assert.equal(edge.highlight, false);
  const bigger = rate(70); // 103 cp: sigue siendo imprecisión, pero ya se destaca
  assert.equal(bigger.quality, 'inaccuracy');
  assert.equal(bigger.highlight, true);
  assert.equal(rate(120).highlight, true, 'un error siempre se destaca');
});

test('factsFor: ...Ac5 trae la amenaza al caballo de d4 sin defensores y el plan de desarrollo', () => {
  const f = factsFor(bc5, 'c7c5', 'd4b3', 'good');
  assert.deepEqual(f.threat, { attacker: 'b', target: 'n', square: 'd4', free: true });
  assert.equal(f.plan?.kind, 'develop');
});

test('factsFor: una jugada con táctica (orquilla) no trae threat aparte', () => {
  const f = factsFor({ san: 'Nc6+', uci: 'd4c6', color: 'w', fenBefore: '1r6/4k3/8/8/3N4/8/8/6K1 w - - 0 1', fenAfter: '1r6/4k3/2N5/8/8/8/8/6K1 b - - 1 1' }, 'd4c6', '', 'best');
  assert.ok(f.found?.some((t) => t.kind === 'fork'));
  assert.equal(f.threat, undefined);
});

test('explicación de ...Ac5: la idea con su veredicto, la amenaza y la mejor jugada, sin frase de costo', () => {
  const f = factsFor(bc5, 'c7c5', 'd4b3', 'inaccuracy');
  const text = coachExplanation({
    lang: 'es', subject: 'opponent', quality: 'inaccuracy', facts: f, move: 'Ac5', bestSan: 'c5', fmt: (s) => s, style: 'equilibrado', seed: 3,
  })[0];
  assert.ok(/(desarrollaba|sacar) el alfil de f8/.test(text) && text.includes(', pero es una imprecisión.'), text);
  assert.ok(text.includes('El alfil ataca al caballo de d4, que no tiene defensores.'), text);
  assert.ok(text.includes('La mejor jugada para el rival era c5'), text);
  assert.ok(!/peones|Cuesta|respirar/.test(text), text);
});

// ---- Re-análisis profundo y línea del motor ----
test('buildReview: una jugada revisada a más profundidad se califica con su par profundo y las demás no cambian', () => {
  const g = parseGame(PGN)!;
  const evals = fakeEvals(g.moves.length);
  evals[3].score = -250; // a profundidad baja Dh5 parece un error grave
  evals[2].best = 'g1f3';
  const base = buildReview(g, evals, new Set());
  assert.ok(['mistake', 'blunder'].includes(base.plies[2].quality));
  // A más profundidad la jugada resulta casi igual de buena: el par profundo manda en esa jugada.
  const deep = new Map([[2, { before: { score: 30, best: 'g1f3' }, after: { score: 20, best: 'b8c6' } }]]);
  const r = buildReview(g, evals, new Set(), deep);
  assert.ok(!['mistake', 'blunder'].includes(r.plies[2].quality), r.plies[2].quality);
  assert.deepEqual(r.plies.map((p, i) => (i === 2 ? '' : p.quality)), base.plies.map((p, i) => (i === 2 ? '' : p.quality)));
  assert.deepEqual(r.scores, base.scores, 'el gráfico sigue con las evaluaciones del recorrido completo');
});

test('ratePly: la variante de la mejor jugada se guarda solo en jugadas malas', () => {
  const g = parseGame(PGN)!;
  const pv = ['g1f3', 'b8c6', 'f1c4'];
  const bad = ratePly(3, g.moves[2], { score: 30, best: 'g1f3', pv }, { score: -250, best: 'b8c6' }, new Set());
  assert.deepEqual(bad.bestPv, pv);
  const good = ratePly(1, g.moves[0], { score: 30, best: 'e2e4', pv: ['e2e4', 'e7e5'] }, { score: 30, best: 'e7e5' }, new Set());
  assert.equal(good.bestPv, undefined);
  const noPv = ratePly(3, g.moves[2], { score: 30, best: 'g1f3' }, { score: -250, best: 'b8c6' }, new Set());
  assert.equal(noPv.bestPv, undefined);
});
