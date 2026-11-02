import { LC0_CONV_POLICY_MAP } from './lc0Tables';
import { MAIA_WORKER_JS } from './maiaWorkerSource';

/**
 * Página del WebView invisible de Maia (MaiaView). Arma un Worker con el código de maiaWorkerSource.ts,
 * le pasa la red (el archivo .pb.gz original de Maia, en base64) y después solo intercambian JSON:
 *   app → página: window.sendToMaia('{"type":"eval","id":1,"input":{...}}')
 *   página → app: window.ReactNativeWebView.postMessage('{"type":"result","id":1,...}')
 * Mensajes de la página: {type:'ready'}, {type:'result', id, logits, wdl} y {type:'error', id?, message}.
 */
export function buildMaiaHtml(netBase64: string): string {
  const worker = `${MAIA_WORKER_JS}
MAIA.setPolicyMap(${JSON.stringify(LC0_CONV_POLICY_MAP)});
var net = null;
function gunzip(bytes) {
  if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('el WebView no puede descomprimir la red'));
  var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer().then(function (b) { return new Uint8Array(b); });
}
onmessage = function (e) {
  var m = e.data;
  if (m.type === 'init') {
    var bin = atob(m.net), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    gunzip(bytes).then(function (raw) {
      net = MAIA.loadNet(raw);
      postMessage({ type: 'ready' });
    }).catch(function (err) { postMessage({ type: 'error', message: String(err && err.message || err) }); });
  } else if (m.type === 'eval') {
    try {
      var r = MAIA.evaluate(net, m.input);
      postMessage({ type: 'result', id: m.id, logits: r.logits, wdl: r.wdl });
    } catch (err) {
      postMessage({ type: 'error', id: m.id, message: String(err && err.message || err) });
    }
  }
};
`;
  // "</" dentro del JS cerraría la etiqueta <script>: se escapa.
  const js = JSON.stringify(worker).replace(/<\//g, '<\\/');
  return `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
(function () {
  function post(m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  try {
    var url = URL.createObjectURL(new Blob([${js}], { type: 'text/javascript' }));
    var worker = new Worker(url);
    worker.onmessage = function (e) { post(e.data); };
    worker.onerror = function (e) { post({ type: 'error', message: e.message || 'worker' }); };
    window.sendToMaia = function (json) { worker.postMessage(JSON.parse(json)); };
    worker.postMessage({ type: 'init', net: ${JSON.stringify(netBase64)} });
  } catch (e) {
    post({ type: 'error', message: e.message });
  }
})();
</script></body></html>`;
}
