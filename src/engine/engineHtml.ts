import { STOCKFISH_JS, STOCKFISH_WASM_BASE64 } from './stockfish/stockfishAssets';

/**
 * Página que corre dentro del WebView invisible (EngineView).
 * Arma el motor en un Worker a partir de los archivos de Stockfish sin modificar:
 * el .wasm se pasa por la URL del worker (después de '#'), como espera stockfish.js.
 * Comunicación solo por texto UCI:
 *   app → motor: window.sendToEngine("go depth 10")
 *   motor → app: window.ReactNativeWebView.postMessage("bestmove e2e4 ...")
 */
export function buildEngineHtml(): string {
  // "</" dentro del JS cerraría la etiqueta <script>: se escapa.
  const js = JSON.stringify(STOCKFISH_JS).replace(/<\//g, '<\\/');
  return `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
(function () {
  function post(m) { window.ReactNativeWebView.postMessage(m); }
  try {
    var bin = atob(${JSON.stringify(STOCKFISH_WASM_BASE64)});
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var wasmUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/wasm' }));
    var jsUrl = URL.createObjectURL(new Blob([${js}], { type: 'text/javascript' }));
    var worker = new Worker(jsUrl + '#' + encodeURIComponent(wasmUrl));
    worker.onmessage = function (e) { if (typeof e.data === 'string') post(e.data); };
    worker.onerror = function (e) { post('error ' + (e.message || 'worker')); };
    window.sendToEngine = function (cmd) { worker.postMessage(cmd); };
    post('host ready');
  } catch (e) {
    post('error ' + e.message);
  }
})();
</script></body></html>`;
}
