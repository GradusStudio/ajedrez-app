// Corre antes de pintar la portada (la CSP no permite scripts en línea, por eso va en un archivo).
// 1. Quien ya usa Gradus pasa directo a la app: la tiene instalada (modo app) o tiene progreso guardado.
//    Con ?portada en la dirección se ve la portada igual.
// 2. El idioma del documento sigue al del navegador (es, en, de, it, fr; si no, inglés), como en la app.
(function () {
  try {
    var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    var hasProgress = localStorage.getItem('ajedrez:progreso') !== null;
    if ((standalone || hasProgress) && !/[?&]portada\b/.test(location.search)) {
      location.replace('/app/');
      return;
    }
  } catch (e) {
    // Sin acceso a localStorage (modo privado estricto): se muestra la portada.
  }
  var l = String(navigator.language || 'es').slice(0, 2).toLowerCase();
  document.documentElement.lang = ['es', 'en', 'de', 'it', 'fr'].indexOf(l) >= 0 ? l : 'en';
})();
