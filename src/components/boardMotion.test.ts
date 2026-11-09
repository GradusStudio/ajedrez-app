import test from 'node:test';
import assert from 'node:assert/strict';
import { dragTilt, mateSquares, MAX_TILT, slideTilt } from './boardMotion';

test('dragTilt: hacia la derecha inclina en sentido horario, hacia la izquierda al revés', () => {
  assert.ok(dragTilt(0.5) > 0);
  assert.ok(dragTilt(-0.5) < 0);
  assert.equal(dragTilt(0), 0);
});

test('dragTilt: nunca pasa del máximo', () => {
  assert.equal(dragTilt(50), MAX_TILT);
  assert.equal(dragTilt(-50), -MAX_TILT);
});

test('slideTilt: según hacia dónde va la pieza; sin movimiento horizontal, no se inclina', () => {
  // dx es el desplazamiento desde la casilla final hasta la de partida: dx negativo = viene de la izquierda, va a la derecha.
  assert.ok(slideTilt(-100) > 0);
  assert.ok(slideTilt(100) < 0);
  assert.equal(slideTilt(0), 0);
});

test('mateSquares: mate del pasillo, rey en g8 encerrado por sus peones', () => {
  // Torre blanca en a8 da mate al rey negro en g8, encerrado por f7, g7 y h7.
  const m = mateSquares('R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1');
  assert.ok(m);
  assert.equal(m.king, 'g8');
  // Casillas vecinas vacías: f8 y h8 (f7, g7 y h7 tienen peones propios).
  assert.deepEqual([...m.escapes].sort(), ['f8', 'h8']);
});

test('mateSquares: rey en la esquina, con todas sus vecinas vacías', () => {
  // Dama en g7 protegida por el rey en f6: mate al rey en h8.
  const m = mateSquares('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1');
  assert.ok(m);
  assert.equal(m.king, 'h8');
  // g7 tiene la dama (no está vacía); g8 y h7 sí.
  assert.deepEqual([...m.escapes].sort(), ['g8', 'h7']);
});

test('mateSquares: sin mate (jaque común o posición normal) devuelve null', () => {
  assert.equal(mateSquares('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'), null);
  assert.equal(mateSquares('4k3/8/8/8/8/8/8/4R1K1 b - - 0 1'), null);
});

test('mateSquares: una posición inválida no rompe nada', () => {
  assert.equal(mateSquares('esto no es un fen'), null);
});
