import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { openingGame, progressPosition, piecesFromFen, type ProgressGame, type ProgressGamesFile } from './progressGame';
import gamesRaw from '../data/progressGames.json';
import { openings } from '../data/openings';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const italiana: ProgressGame = { moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'], side: 'w' };
const negras: ProgressGame = { moves: ['e2e4', 'c7c5', 'g1f3', 'd7d6'], side: 'b' };

test('Italiana: 0 lecciones muestra la posición inicial', () => {
  const p = progressPosition(italiana, 0, 6);
  assert.equal(p.fen, START);
  assert.equal(p.lastMove, null);
  assert.equal(p.played, 0);
  assert.equal(p.total, 3);
  assert.equal(p.complete, false);
});

test('Italiana: 1 lección muestra la posición después de 1.e4', () => {
  const p = progressPosition(italiana, 1, 6);
  assert.equal(p.fen, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
  assert.deepEqual(p.lastMove, { from: 'e2', to: 'e4' });
  assert.equal(p.played, 1);
  assert.equal(p.complete, false);
});

test('Italiana: 2 lecciones muestran la posición después de 2.Cf3', () => {
  const p = progressPosition(italiana, 2, 6);
  assert.equal(p.fen, 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2');
  assert.deepEqual(p.lastMove, { from: 'g1', to: 'f3' });
  assert.equal(p.played, 2);
  assert.equal(p.complete, false);
});

test('Italiana: 3 lecciones muestran 3.Ac4 y la partida queda completa', () => {
  const p = progressPosition(italiana, 3, 6);
  assert.equal(p.fen, 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3');
  assert.deepEqual(p.lastMove, { from: 'f1', to: 'c4' });
  assert.equal(p.played, 3);
  assert.equal(p.total, 3);
  assert.equal(p.complete, true);
});

test('más lecciones que jugadas se queda en la posición final', () => {
  const p = progressPosition(italiana, 9, 6);
  assert.equal(p.played, 3);
  assert.equal(p.total, 3);
  assert.equal(p.complete, true);
});

test('curso de negras: 0 lecciones es la posición inicial', () => {
  const p = progressPosition(negras, 0, 8);
  assert.equal(p.fen, START);
  assert.equal(p.played, 0);
  assert.equal(p.total, 2);
  assert.equal(p.complete, false);
});

test('curso de negras: 1 lección muestra 1.e4 c5', () => {
  const p = progressPosition(negras, 1, 8);
  assert.equal(p.fen, 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2');
  assert.deepEqual(p.lastMove, { from: 'c7', to: 'c5' });
  assert.equal(p.played, 1);
  assert.equal(p.total, 2);
  assert.equal(p.complete, false);
});

test('curso de negras: 2 lecciones muestran 1.e4 c5 2.Cf3 d6', () => {
  const p = progressPosition(negras, 2, 8);
  assert.equal(p.fen, 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3');
  assert.deepEqual(p.lastMove, { from: 'd7', to: 'd6' });
  assert.equal(p.played, 2);
  assert.equal(p.total, 2);
  assert.equal(p.complete, true);
});

test('unidad completa: muestra el final aunque sobren jugadas', () => {
  const larga: ProgressGame = {
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'b1c3', 'f8b4', 'd2d3', 'e8g8'],
    side: 'w',
  };
  const p = progressPosition(larga, 3, 3);
  assert.equal(p.fen, 'r1bq1rk1/pppp1ppp/2n2n2/4p3/1bB1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 1 6');
  assert.deepEqual(p.lastMove, { from: 'e8', to: 'g8' });
  assert.equal(p.played, 5);
  assert.equal(p.total, 5);
  assert.equal(p.complete, true);
});

test('piecesFromFen: la posición inicial tiene las 32 piezas', () => {
  const pieces = piecesFromFen(START);
  assert.equal(Object.keys(pieces).length, 32);
  assert.equal(pieces['e1'], 'wk');
  assert.equal(pieces['d8'], 'bq');
  assert.equal(pieces['a2'], 'wp');
});

test('piecesFromFen: después de 1.e4 el peón cambió de casilla', () => {
  const pieces = piecesFromFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
  assert.equal(pieces['e4'], 'wp');
  assert.equal(pieces['e2'], undefined);
});

test('apertura: la partida sale de la línea principal de l02', () => {
  const london = openings.find((o) => o.id === 'london');
  assert.ok(london);
  const game = openingGame(london);
  assert.equal(game.side, 'w');
  assert.deepEqual(game.moves.slice(0, 4), ['d2d4', 'd7d5', 'c1f4', 'g8f6']);
  assert.equal(game.startFen?.split(' ')[0], START.split(' ')[0]);
  const p = progressPosition(game, 2, london.lessons.length);
  assert.equal(p.played, 2);
  assert.deepEqual(p.lastMove, { from: 'c1', to: 'f4' });
});

test('apertura de negras: el bando que estudia es b', () => {
  const scandi = openings.find((o) => o.id === 'scandinavian');
  assert.ok(scandi);
  const game = openingGame(scandi);
  assert.equal(game.side, 'b');
  assert.ok(game.moves.length > 0);
  const p = progressPosition(game, 1, scandi.lessons.length);
  assert.equal(p.played, 1);
  assert.notEqual(p.fen, START);
});

test('apertura sin línea principal: no hay jugadas', () => {
  const sinLinea = { ...openings[0], lessons: [] };
  assert.deepEqual(openingGame(sinLinea).moves, []);
});

const units = (gamesRaw as ProgressGamesFile).units;

test('progressGames.json tiene una partida por unidad (1 a 9)', () => {
  for (let unit = 1; unit <= 9; unit++) {
    assert.ok(units[String(unit)], `falta la unidad ${unit}`);
  }
});

for (let unit = 1; unit <= 9; unit++) {
  test(`unidad ${unit}: todas las jugadas son legales`, () => {
    const game = units[String(unit)];
    assert.ok(game.side === 'w' || game.side === 'b');
    const chess = new Chess(game.startFen);
    for (const uci of game.moves) {
      assert.match(uci, /^[a-h][1-8][a-h][1-8][qrbn]?$/);
      chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.slice(4) || undefined,
      });
    }
  });
}

for (const unit of [1, 2, 3, 4, 6, 9]) {
  test(`unidad ${unit}: la partida termina en mate`, () => {
    const game = units[String(unit)];
    const chess = new Chess(game.startFen);
    for (const uci of game.moves) {
      chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.slice(4) || undefined,
      });
    }
    assert.equal(chess.isCheckmate(), true);
  });
}

test('unidad 8: la ruptura de peones avanza hasta coronar', () => {
  const game = units['8'];
  assert.equal(game.startFen, '7k/ppp5/8/PPP5/8/8/8/7K w - - 0 1');
  assert.equal(game.moves.length, 9);

  const inicio = progressPosition(game, 0, 7);
  assert.equal(inicio.fen, game.startFen);
  assert.equal(inicio.played, 0);
  assert.equal(inicio.total, 5);
  assert.equal(inicio.complete, false);

  const dos = progressPosition(game, 2, 7);
  assert.deepEqual(dos.lastMove, { from: 'c5', to: 'c6' });
  assert.equal(dos.played, 2);
  assert.equal(dos.complete, false);

  const final = progressPosition(game, 7, 7);
  assert.equal(final.complete, true);
  assert.equal(final.played, 5);
  assert.deepEqual(final.lastMove, { from: 'a7', to: 'a8' });
  assert.equal(piecesFromFen(final.fen)['a8'], 'wq');
});
