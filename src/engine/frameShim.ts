// Script fijo al comienzo de cada iframe oculto de la web (HiddenFrame.web.tsx). Su hash va en la CSP de
// public/_headers (scripts/frameCsp.ts), así que el texto no puede variar. Con `sandbox` no toca `parent`: usa `postMessage`.
export const FRAME_SHIM =
  '<script>window.ReactNativeWebView={postMessage:function(m){parent.postMessage({gradus:1,m:m},"*");}};' +
  'addEventListener("message",function(e){var d=e.data;' +
  'if(e.source===parent&&d&&(d.fn==="sendToEngine"||d.fn==="sendToMaia")&&typeof window[d.fn]==="function")window[d.fn](d.arg);});</script>';
