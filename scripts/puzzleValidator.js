// Validación de puzzles con chess.js. También es el hilo de trabajo de build-puzzles.js: recibe lotes
// [[fen, jugadas], ...] y devuelve cuáles tienen todas sus jugadas legales.
const { isMainThread, parentPort } = require('worker_threads');
const { Chess } = require('chess.js');

/** Comprueba con chess.js que todas las jugadas son legales. */
function isValid(fen, moves) {
  try {
    const c = new Chess(fen);
    for (const uci of moves.split(' ')) c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return true;
  } catch {
    return false;
  }
}

if (!isMainThread && parentPort) {
  parentPort.on('message', ({ seq, items }) => {
    const ok = new Uint8Array(items.length);
    for (let i = 0; i < items.length; i++) ok[i] = isValid(items[i][0], items[i][1]) ? 1 : 0;
    parentPort.postMessage({ seq, ok }, [ok.buffer]);
  });
}

module.exports = { isValid };
