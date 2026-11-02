// Código del Worker de Maia, como texto: corre dentro del WebView invisible (MaiaView), donde el
// JavaScript es rápido (V8 con JIT). Las pruebas (maia.test.ts) lo evalúan igual en Node.
//
// Maia es una red neuronal de Lc0 (Leela Chess Zero) entrenada con partidas humanas de Lichess
// (CSSLab, Universidad de Toronto, GPL v3): https://github.com/CSSLab/maia-chess
// Este archivo hace lo mismo que Lc0 con `nodes 1`: una sola pasada de la red, sin búsqueda.
// Se siguió el código de Lc0 (src/neural/network_legacy.cc, backends/blas/network_blas.cc y
// se_unit.cc). La entrada (112 planos) la arma src/engine/maia/encode.ts.
//
// Sin comillas invertidas ni "${" en el código: va dentro de un String.raw.
export const MAIA_WORKER_JS = String.raw`
var MAIA = (function () {
  'use strict';

  // ---------- protobuf mínimo (formato de pesos de Lc0, lczero-common/proto/net.proto) ----------
  function readVarint(b, p) {
    var r = 0, s = 1, x;
    do { x = b[p.i++]; r += (x & 0x7f) * s; s *= 128; } while (x >= 0x80);
    return r;
  }
  // { número de campo: [valores] }. Bytes como subarreglos; fixed32 como float.
  function fields(b) {
    var p = { i: 0 }, out = {}, dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    while (p.i < b.length) {
      var key = readVarint(b, p), f = Math.floor(key / 8), t = key & 7, v;
      if (t === 0) v = readVarint(b, p);
      else if (t === 1) { v = null; p.i += 8; }
      else if (t === 5) { v = dv.getFloat32(p.i, true); p.i += 4; }
      else if (t === 2) { var n = readVarint(b, p); v = b.subarray(p.i, p.i + n); p.i += n; }
      else throw new Error('protobuf: tipo ' + t);
      (out[f] = out[f] || []).push(v);
    }
    return out;
  }
  // Capa LINEAR16: enteros de 16 bits entre min_val y max_val.
  function layer(b) {
    if (!b) return null;
    var d = fields(b), mn = d[1] ? d[1][0] : 0, mx = d[2] ? d[2][0] : 0, raw = d[3] ? d[3][0] : new Uint8Array(0);
    var enc = d[4] ? d[4][0] : 1;
    if (enc !== 0 && enc !== 1) throw new Error('codificación de pesos no soportada: ' + enc);
    var n = raw.length / 2, out = new Float64Array(n), dv = new DataView(raw.buffer, raw.byteOffset, raw.length);
    for (var i = 0; i < n; i++) out[i] = (dv.getUint16(2 * i, true) / 65535) * (mx - mn) + mn;
    return out;
  }
  // Convolución con batch norm: se pliega en pesos y sesgos, como hace Lc0 al cargar.
  function convBlock(b) {
    var d = fields(b), get = function (k) { return d[k] ? layer(d[k][0]) : null; };
    var w = get(1), bias = get(2), means = get(3), vars = get(4), gam = get(5), bet = get(6);
    if (!means) return { w: w, b: bias, out: bias.length };
    var n = means.length, inputs = w.length / n;
    var b2 = new Float64Array(n);
    for (var o = 0; o < n; o++) {
      var g = (gam ? gam[o] : 1) / Math.sqrt(vars[o] + 1e-5);
      for (var c = 0; c < inputs; c++) w[o * inputs + c] *= g;
      b2[o] = -g * (means[o] - (bias ? bias[o] : 0)) + (bet ? bet[o] : 0);
    }
    return { w: w, b: b2, out: n };
  }

  function loadNet(bytes) {
    var top = fields(bytes);
    var fmt = fields(fields(top[4][0])[2][0]); // Net.format.network_format
    // Maia: entrada clásica de 112 planos, valor WDL, red SE, política convolucional.
    if (fmt[1][0] !== 1 || fmt[4][0] !== 2 || fmt[3][0] !== 4) throw new Error('red no soportada');
    var W = fields(top[10][0]);
    var net = { input: convBlock(W[1][0]), res: [] };
    for (var r = 0; r < W[2].length; r++) {
      var rd = fields(W[2][r]), se = fields(rd[3][0]);
      net.res.push({ c1: convBlock(rd[1][0]), c2: convBlock(rd[2][0]),
        w1: layer(se[1][0]), b1: layer(se[2][0]), w2: layer(se[3][0]), b2: layer(se[4][0]) });
    }
    net.pol1 = convBlock(W[11][0]);
    net.pol = convBlock(W[3][0]);
    net.val = convBlock(W[6][0]);
    net.ip1w = layer(W[7][0]); net.ip1b = layer(W[8][0]);
    net.ip2w = layer(W[9][0]); net.ip2b = layer(W[10][0]);
    net.C = net.input.out;
    return net;
  }

  // ---------- capas ----------
  // Convolución 3x3 (relleno 1) sobre un tablero de 8x8. x: [cin][64]. Pesos [cout][cin][3][3].
  var pad = null;
  function conv3(x, cin, blk, relu) {
    var cout = blk.out, w = blk.w, out = new Float64Array(cout * 64);
    if (!pad || pad.length < cin * 100) pad = new Float64Array(cin * 100);
    pad.fill(0);
    for (var c = 0; c < cin; c++)
      for (var y = 0; y < 8; y++)
        for (var xx = 0; xx < 8; xx++) pad[c * 100 + (y + 1) * 10 + xx + 1] = x[c * 64 + y * 8 + xx];
    var acc = new Float64Array(64);
    for (var o = 0; o < cout; o++) {
      var wo = o * cin * 9;
      acc.fill(0);
      for (c = 0; c < cin; c++) {
        var wc = wo + c * 9, pc = c * 100;
        // Los 9 pesos del filtro en variables: cada casilla suma los 9 productos de una vez.
        var w0 = w[wc], w1 = w[wc + 1], w2 = w[wc + 2], w3 = w[wc + 3], w4 = w[wc + 4];
        var w5 = w[wc + 5], w6 = w[wc + 6], w7 = w[wc + 7], w8 = w[wc + 8];
        for (y = 0; y < 8; y++) {
          var r0 = pc + y * 10, r1 = r0 + 10, r2 = r0 + 20, ar = y * 8;
          for (xx = 0; xx < 8; xx++) {
            acc[ar + xx] +=
              w0 * pad[r0 + xx] + w1 * pad[r0 + xx + 1] + w2 * pad[r0 + xx + 2] +
              w3 * pad[r1 + xx] + w4 * pad[r1 + xx + 1] + w5 * pad[r1 + xx + 2] +
              w6 * pad[r2 + xx] + w7 * pad[r2 + xx + 1] + w8 * pad[r2 + xx + 2];
          }
        }
      }
      var bo = blk.b[o];
      for (var i = 0; i < 64; i++) {
        var v = acc[i] + bo;
        out[o * 64 + i] = relu && v < 0 ? 0 : v;
      }
    }
    return out;
  }

  // ---------- pasada completa ----------
  // planes: Float32Array(112*64). Devuelve logits de política (1858) y [gana, tablas, pierde] del que mueve.
  function forward(net, planes) {
    var C = net.C, i, o, c;
    var x = conv3(planes, 112, net.input, true);
    for (var r = 0; r < net.res.length; r++) {
      var blk = net.res[r];
      var y = conv3(x, C, blk.c1, true);
      y = conv3(y, C, blk.c2, false);
      // Squeeze-and-excitation
      var se = blk.b1.length, pool = new Float64Array(C), h = new Float64Array(se), s = new Float64Array(2 * C);
      for (c = 0; c < C; c++) { var a = 0; for (i = 0; i < 64; i++) a += y[c * 64 + i]; pool[c] = a / 64; }
      for (o = 0; o < se; o++) { a = blk.b1[o]; for (c = 0; c < C; c++) a += blk.w1[o * C + c] * pool[c]; h[o] = a > 0 ? a : 0; }
      for (o = 0; o < 2 * C; o++) { a = blk.b2[o]; for (c = 0; c < se; c++) a += blk.w2[o * se + c] * h[c]; s[o] = a; }
      for (c = 0; c < C; c++) {
        var gamma = 1 / (1 + Math.exp(-s[c])), beta = s[C + c];
        for (i = 0; i < 64; i++) {
          var v = gamma * y[c * 64 + i] + beta + x[c * 64 + i];
          x[c * 64 + i] = v > 0 ? v : 0;
        }
      }
    }
    // Política: dos convoluciones y el mapa de Lc0 de 73x64 salidas a 1858 jugadas.
    var p = conv3(conv3(x, C, net.pol1, true), C, net.pol, false);
    var logits = new Float64Array(1858);
    for (i = 0; i < POLICY_MAP.length; i++) if (POLICY_MAP[i] >= 0) logits[POLICY_MAP[i]] = p[i];
    // Valor: convolución 1x1, dos capas densas y softmax de 3.
    var vc = net.val.out, vin = new Float64Array(vc * 64);
    for (o = 0; o < vc; o++)
      for (i = 0; i < 64; i++) {
        a = net.val.b[o];
        for (c = 0; c < C; c++) a += net.val.w[o * C + c] * x[c * 64 + i];
        vin[o * 64 + i] = a > 0 ? a : 0;
      }
    var n1 = net.ip1b.length, h1 = new Float64Array(n1), nin = vc * 64;
    for (o = 0; o < n1; o++) { a = net.ip1b[o]; for (i = 0; i < nin; i++) a += net.ip1w[o * nin + i] * vin[i]; h1[o] = a > 0 ? a : 0; }
    var wdl = [0, 0, 0], m = -Infinity;
    for (o = 0; o < 3; o++) { a = net.ip2b[o]; for (i = 0; i < n1; i++) a += net.ip2w[o * n1 + i] * h1[i]; wdl[o] = a; if (a > m) m = a; }
    var sum = 0;
    for (o = 0; o < 3; o++) { wdl[o] = Math.exp(wdl[o] - m); sum += wdl[o]; }
    for (o = 0; o < 3; o++) wdl[o] /= sum;
    return { logits: logits, wdl: wdl };
  }

  // Entrada compacta (de encode.ts): 104 planos de piezas como pares [bits 0-31, bits 32-63] y 8 auxiliares.
  function expand(input) {
    var planes = new Float64Array(112 * 64);
    for (var pl = 0; pl < 104; pl++) {
      var lo = input.bits[2 * pl] >>> 0, hi = input.bits[2 * pl + 1] >>> 0;
      if (!lo && !hi) continue;
      for (var sq = 0; sq < 32; sq++) {
        if ((lo >>> sq) & 1) planes[pl * 64 + sq] = 1;
        if ((hi >>> sq) & 1) planes[pl * 64 + 32 + sq] = 1;
      }
    }
    for (var a = 0; a < 8; a++) {
      var val = input.aux[a];
      if (val) for (var j = 0; j < 64; j++) planes[(104 + a) * 64 + j] = val;
    }
    return planes;
  }

  var POLICY_MAP = null;
  return {
    setPolicyMap: function (m) { POLICY_MAP = m; },
    loadNet: loadNet,
    forward: forward,
    expand: expand,
    // Logits de las jugadas pedidas (índices de Lc0) y probabilidades WDL.
    evaluate: function (net, input) {
      var r = forward(net, expand(input));
      var out = [];
      for (var i = 0; i < input.moves.length; i++) out.push(r.logits[input.moves[i]]);
      return { logits: out, wdl: r.wdl };
    }
  };
})();
`;
