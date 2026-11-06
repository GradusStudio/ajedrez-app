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
  // El rey de f1 defiende la torre descubierta de e1.
  const t = detectTactics('4k3/4q2p/8/8/4B3/8/8/4RK2 w - - 0 1', 'e4d5');
  assert.ok(t.some((x) => x.kind === 'discovered' && x.attacker === 'r' && x.targets.includes('q')));
});
test('descubierto que no cuenta: la dama captura gratis la torre sin defensa', () => {
  // Con el rey en g1 la torre de e1 queda sin defensa y Dxe1+ la gana.
  assert.ok(!kinds('4k3/4q2p/8/8/4B3/8/8/4R1K1 w - - 0 1', 'e4d5').includes('discovered'));
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
test('un enroque no es un ataque descubierto aunque la torre quede frente a una pieza', () => {
  // Tras O-O la torre de f1 ataca al caballo de f6 (sin defensa), pero la torre se movio: no se descubrio nada.
  assert.ok(!kinds('7k/8/5n2/8/8/8/8/4K2R w K - 0 1', 'e1g1').includes('discovered'));
});
test('la misma jugada de torre sin enroque tampoco da descubierto (control)', () => {
  assert.deepEqual(kinds('7k/8/5n2/8/8/8/8/6KR w - - 0 1', 'h1f1'), []);
});
test('mantener una clavada que ya existia no cuenta como encontrarla', () => {
  // El alfil de b5 ya clava el caballo de d7 al rey; Ab5-a4 sigue en la misma diagonal.
  assert.ok(!kinds('4k3/3n4/8/1B6/8/8/8/4K3 w - - 0 1', 'b5a4').includes('pin'));
});
test('una clavada nueva sigue contando aunque haya otra pieza en la diagonal', () => {
  // El alfil llega a b5 desde f1: antes no clavaba nada.
  assert.ok(kinds('4k3/3n4/8/8/8/8/8/4KB2 w - - 0 1', 'f1b5').includes('pin'));
});
test('mantener una horquilla que ya existia no cuenta como encontrarla', () => {
  // La dama de d5 ya ataca a los dos caballos sin defensa (a5 y h5); De5 sigue atacandolos a los dos.
  assert.ok(!kinds('6k1/8/8/n2Q3n/8/8/8/4K3 w - - 0 1', 'd5e5').includes('fork'));
});
test('una horquilla nueva con la dama sigue contando', () => {
  // La dama llega a d5 desde d1: antes no atacaba ninguno de los dos caballos.
  assert.ok(kinds('6k1/8/8/n6n/8/8/8/3QK3 w - - 0 1', 'd1d5').includes('fork'));
});
test('mateIn lee el bando y N', () => {
  assert.deepEqual(mateIn(9997), { by: 'w', n: 3 });
  assert.deepEqual(mateIn(-9998), { by: 'b', n: 2 });
  assert.equal(mateIn(120), null);
});
