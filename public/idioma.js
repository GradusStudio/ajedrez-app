// El idioma del documento sigue al del navegador (es, en, de, it, fr; si no, inglés).
// Va en un archivo aparte para que la CSP no necesite 'unsafe-inline' en script-src.
(function () {
  var l = String(navigator.language || 'es').slice(0, 2).toLowerCase();
  document.documentElement.lang = ['es', 'en', 'de', 'it', 'fr'].indexOf(l) >= 0 ? l : 'en';
})();
