// Script fijo que va al comienzo de la página de cada iframe oculto de la web (HiddenFrame.web.tsx).
// El iframe tiene `sandbox="allow-scripts"` (origen opaco): no puede tocar `parent`, así que habla con la
// app solo por `postMessage`. Debe ser un texto constante: su hash va en la CSP de public/_headers
// (scripts/frameCsp.ts lo calcula y src/engine/frameCsp.test.ts avisa si quedó desactualizado).
export const FRAME_SHIM =
  '<script>window.ReactNativeWebView={postMessage:function(m){parent.postMessage({gradus:1,m:m},"*");}};' +
  'addEventListener("message",function(e){var d=e.data;' +
  'if(e.source===parent&&d&&(d.fn==="sendToEngine"||d.fn==="sendToMaia")&&typeof window[d.fn]==="function")window[d.fn](d.arg);});</script>';
