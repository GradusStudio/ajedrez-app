import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectTactics, mateIn } from './tactics';

const kinds = (fen: string, uci: string) => detectTactics(fen, uci).map((t) => t.kind);

test('orquilla: Cc6+ ataca rey y torre', () => {
  const t = detectTactics('1r6/4k3/8/8/3N4/8/8/6K1 w - - 0 1', 'd4c6');
  assert.ok(t.some((x) => x.kind === 'fork' && x.attacker === 'n' && x.targets.includes('k') && x.targets.includes('r')));
});
test('clavada: Ab5 clava el caballo de d7 al rey', () => {
  assert.ok(kinds('4k3/3n4/8/8/8/8/8/4KB2 w - - 0 1', 'f1b5').includes('pin'));
});
test('enfilada: Th8+ con la dama detras del rey', () => {
  assert.ok(kinds('q3k3/8/8/8/8/8/8/4K2R w - - 0 1', 'h1h8').includes('skewer'));
});
test('ataque descubierto: Ad5 descubre la torre de e1 contra la dama de e7', () => {
  const t = detectTactics('4k3/4q2p/8/8/4B3/8/8/4R1K1 w - - 0 1', 'e4d5');
  assert.ok(t.some((x) => x.kind === 'discovered' && x.attacker === 'r' && x.targets.includes('q')));
});
test('jaque doble: Cf6+ con la torre detras', () => {
  assert.ok(kinds('4k3/8/8/8/4N3/8/8/4R1K1 w - - 0 1', 'e4f6').includes('doubleCheck'));
});
test('pieza colgada: Txd5 captura una dama sin defensa', () => {
  assert.ok(kinds('4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1', 'd1d5').includes('hanging'));
});
test('una dama defendida no cuenta como colgada', () => {
  // La dama de d5 esta defendida por el peon de e6.
  assert.ok(!kinds('4k3/8/4p3/3q4/8/8/8/3RK3 w - - 0 1', 'd1d5').includes('hanging'));
});
test('mate del pasillo: Ta8#', () => {
  assert.ok(kinds('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1', 'a1a8').includes('backRank'));
});
test('una jugada tranquila no devuelve tacticas, y una ilegal tampoco', () => {
  assert.deepEqual(detectTactics('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'e2e4'), []);
  assert.deepEqual(detectTactics('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'e2e5'), []);
});
test('coronacion (5 letras) y enroque no rompen el detector', () => {
  assert.doesNotThrow(() => detectTactics('4k3/P7/8/8/8/8/8/4K3 w - - 0 1', 'a7a8q'));
  assert.doesNotThrow(() => detectTactics('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'e1g1'));
});
test('una orquilla cuyo atacante puede ser capturado gratis por el rival no cuenta', () => {
  // Cc6+ ataca rey y torre, pero el peon de b7 captura el caballo.
  assert.ok(!kinds('1r6/1p2k3/8/8/3N4/8/8/6K1 w - - 0 1', 'd4c6').includes('fork'));
});
test('mateIn lee el bando y N', () => {
  assert.deepEqual(mateIn(9997), { by: 'w', n: 3 });
  assert.deepEqual(mateIn(-9998), { by: 'b', n: 2 });
  assert.equal(mateIn(120), null);
});
