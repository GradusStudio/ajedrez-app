import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReview, factsFor, winPercent } from './build';
import { bookPositions, positionKey } from './book';
import { coachExplanation, coachVoice } from './coachText';
import { parseGame } from './pgn';
import { clearPendingGame, peekPendingGame, setPendingGame, sideOf } from './session';
import { parseChessComMonth, parseLichessNdjson, validUsername } from './sources';
import type { PositionEval } from './types';

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
