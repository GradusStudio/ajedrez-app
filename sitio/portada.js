// Portada: el paso «Avanza el peón dos casillas» de la lección del peón (u1-l07-s05), con Pipo, que la enseña.
// Se juega tocando el peón y una casilla, arrastrándolo o con el teclado (Tab y Enter). Solo vale e2-e4:
// otra jugada vuelve atrás y Pipo da la pista de la lección. Los textos vienen de datos.js (los arma
// scripts/build-portada.ts a partir de la app).
(function () {
  'use strict';
  var DATA = window.GRADUS_PORTADA;
  if (!DATA) return;
  var lang = DATA.langs[document.documentElement.lang] ? document.documentElement.lang : 'es';
  var T = DATA.langs[lang];
  var FROM = 'e2';
  var TARGETS = ['e3', 'e4'];
  var SOLUTION = 'e4';
  /** Marca que lee la bienvenida de la app: si ya se jugó acá, salta directo a elegir el nivel. */
  var MARK = 'gradus:portada-peon';

  var $ = function (id) { return document.getElementById(id); };
  var board = $('board');
  var pawn = $('pawn');
  var face = $('face');
  var say = $('say');
  var ask = $('ask');
  var cta = $('cta');
  var teacher = document.querySelector('.teacher');
  var hlA = $('hl-a');
  var hlB = $('hl-b');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var fmt = function (s, vars) {
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
  };

  // Idioma: el HTML viene en español; los demás se aplican acá.
  if (lang !== 'es') {
    document.title = T['meta.title'];
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', T['meta.description']);
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) {
      el.textContent = T[el.getAttribute('data-t')];
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-t-label]'), function (el) {
      el.setAttribute('aria-label', T[el.getAttribute('data-t-label')]);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-bot]'), function (el) {
      el.setAttribute('aria-label', fmt(T.botLabel, { name: el.getAttribute('data-name'), elo: el.getAttribute('data-elo') }));
    });
    say.textContent = T.say;
    ask.textContent = T.ask;
  }

  // Las otras caras se cargan antes, para que no parpadeen al cambiar.
  ['acierto', 'pista', 'piensa'].forEach(function (e) { new Image().src = '/portada/pipo-' + e + '.webp'; });

  var state = 'idle'; // idle | selected | busy | done
  var targetEls = [];

  function coords(sq) {
    return { x: sq.charCodeAt(0) - 97, y: 8 - Number(sq[1]) };
  }
  function place(el, sq) {
    var c = coords(sq);
    el.style.left = c.x * 12.5 + '%';
    el.style.top = c.y * 12.5 + '%';
  }
  function putPawn(sq) {
    var c = coords(sq);
    pawn.style.transform = 'translate(' + c.x * 100 + '%,' + c.y * 100 + '%)';
    pawn.setAttribute('aria-label', fmt(T.pawnLabel, { sq: sq }));
  }
  function highlight(el, sq, cls) {
    if (!sq) {
      el.className = 'sq';
      el.hidden = true;
      return;
    }
    place(el, sq);
    el.className = 'sq ' + cls;
    el.hidden = false;
  }
  function setFace(expr) {
    face.src = '/portada/pipo-' + expr + '.webp';
  }

  function showTargets() {
    hideTargets();
    TARGETS.forEach(function (sq) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'target';
      b.setAttribute('aria-label', fmt(T.moveTo, { sq: sq }));
      place(b, sq);
      b.addEventListener('click', function () { tryMove(sq); });
      board.appendChild(b);
      targetEls.push(b);
    });
  }
  function hideTargets() {
    targetEls.forEach(function (b) { b.remove(); });
    targetEls = [];
  }

  function select(byKeyboard) {
    state = 'selected';
    // Si hubo un error, la pista sigue escrita pero el globo deja de estar en rojo.
    teacher.className = 'teacher';
    highlight(hlA, FROM, 'hl-sel');
    setFace('piensa');
    showTargets();
    if (byKeyboard) targetEls[0].focus();
  }
  function deselect() {
    state = 'idle';
    highlight(hlA, null);
    setFace('explica');
    hideTargets();
  }

  function tryMove(to) {
    hideTargets();
    putPawn(to);
    if (to === SOLUTION) {
      state = 'done';
      highlight(hlA, FROM, 'hl-last');
      highlight(hlB, to, 'hl-last');
      teacher.className = 'teacher is-right';
      setFace('acierto');
      say.textContent = T.right;
      ask.hidden = true;
      pawn.disabled = true;
      cta.textContent = T.continue;
      cta.href = '/app/leccion/u1-l07';
      try {
        localStorage.setItem(MARK, '1');
      } catch (e) {
        // Sin almacenamiento la bienvenida empieza desde el principio: no pasa nada.
      }
      cta.focus({ preventScroll: true });
      return;
    }
    state = 'busy';
    highlight(hlA, null);
    highlight(hlB, to, 'hl-wrong');
    teacher.className = 'teacher is-wrong';
    setFace('pista');
    say.textContent = T.hint;
    setTimeout(function () {
      putPawn(FROM);
      highlight(hlB, null);
      state = 'idle';
      pawn.focus({ preventScroll: true });
    }, reduceMotion ? 900 : 1100);
  }

  // Teclado: Enter o Espacio sobre el peón disparan click con detail 0.
  pawn.addEventListener('click', function (e) {
    if (e.detail !== 0) return;
    if (state === 'idle') select(true);
    else if (state === 'selected') deselect();
  });

  // Toque y arrastre.
  var drag = null;
  pawn.addEventListener('pointerdown', function (e) {
    if (state !== 'idle' && state !== 'selected') return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, wasSelected: state === 'selected' };
    pawn.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  pawn.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      pawn.classList.add('dragging');
      if (state === 'idle') select(false);
    }
    var r = board.getBoundingClientRect();
    var size = r.width / 8;
    var px = ((e.clientX - r.left - size / 2) / size) * 100;
    var py = ((e.clientY - r.top - size / 2) / size) * 100;
    pawn.style.transform = 'translate(' + px + '%,' + py + '%)';
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    pawn.classList.remove('dragging');
    if (!d.moved) {
      if (d.wasSelected) deselect();
      else select(false);
      return;
    }
    var r = board.getBoundingClientRect();
    var fx = Math.floor(((e.clientX - r.left) / r.width) * 8);
    var fy = Math.floor(((e.clientY - r.top) / r.height) * 8);
    var sq = fx >= 0 && fx < 8 && fy >= 0 && fy < 8 ? String.fromCharCode(97 + fx) + (8 - fy) : null;
    if (sq && TARGETS.indexOf(sq) >= 0) {
      tryMove(sq);
    } else {
      putPawn(FROM);
      deselect();
    }
  }
  pawn.addEventListener('pointerup', endDrag);
  pawn.addEventListener('pointercancel', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    pawn.classList.remove('dragging');
    putPawn(FROM);
    deselect();
  });

  putPawn(FROM);
})();
