import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { buildReview, factsFor, winPercent } from './build';
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

test('factsFor conserva allows y missed existentes', () => {
  // Las blancas tenían Ta8# y juegan Rh1.
  const move = mk('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', 'g1h1');
  const f = factsFor(move, 'a1a8', '', 'blunder');
  assert.deepEqual(f.missed, { kind: 'mate' });
  assert.equal(f.allows, undefined);
  const g = parseGame(PGN)!;
  assert.equal(factsFor(g.moves[5], 'g7g6', 'h5f7', 'blunder').allows?.kind, 'mate');
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
    subject: 'you',
    quality: 'blunder',
    facts: { did: { kind: 'capture', piece: 'p' }, allows: { kind: 'capture', piece: 'q', san: 'Axd1', ofMoved: false }, missed: { kind: 'mate' } },
    move: 'Cxe5',
    bestSan: 'Dxf7#',
    fmt: (s) => s,
  });
  assert.equal(lines.length, 3);
  assert.ok(lines[0].includes('un peón'));
  assert.ok(lines[1].includes('la dama'));
  assert.ok(lines[2].includes('mate'));
  const none = coachExplanation({ lang: 'en', subject: 'you', quality: 'best', facts: {}, move: 'e4', bestSan: '', fmt: (s) => s });
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
