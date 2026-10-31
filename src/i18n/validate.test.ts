import test from 'node:test';
import assert from 'node:assert/strict';
import { namedMoves, toSpanishLetters, checkTranslation } from './validate';
import type { Content, LanguageFiles } from '../data/translate';
import type { Bot } from '../data/bots';
import type { Language } from './languages';

test('encuentra jugadas', () => assert.deepEqual(namedMoves('Tras Cf3 y O-O, juega Dxd5+.'), ['Cf3', 'O-O', 'Dxd5+']));
test('alemán a letras españolas', () => assert.equal(toSpanishLetters('Lxf7+', 'de'), 'Axf7+'));
test('inglés y francés a letras españolas', () => {
  assert.equal(toSpanishLetters('Nf3', 'en'), 'Cf3');
  assert.equal(toSpanishLetters('Bb5', 'en'), 'Ab5');
  assert.equal(toSpanishLetters('Fb5', 'fr'), 'Ab5');
  assert.equal(toSpanishLetters('e8=Q', 'en'), 'e8=D');
  assert.equal(toSpanishLetters('e4', 'en'), 'e4');
});

test('no lee palabras normales como jugadas', () => {
  const cases: [Language, string][] = [
    ['es', 'Una Dama y un Rey; la Ta es una torre. Dama, Torre, Alfil.'],
    ['en', 'A Queen and a King can Be a Bad idea. Knight, Bishop.'],
    ['de', 'Eine Dame, ein König, ein Läufer und Springer. Ta da!'],
    ['it', 'Una Donna e un Re. La Torre, il Cavallo.'],
    ['fr', 'Une Dame, un Roi, un Fou. La Tour.'],
  ];
  for (const [, text] of cases) assert.deepEqual(namedMoves(text), [], text);
});
test('jugadas de peón y números de jugada', () => {
  assert.deepEqual(namedMoves('Juega a4 y luego exd5.'), ['a4', 'exd5']);
  assert.deepEqual(namedMoves('1.e4 e5 2.Cf3'), ['e4', 'e5', 'Cf3']);
  assert.deepEqual(namedMoves('12...Cf6 13.Axf6'), ['Cf6', 'Axf6']);
});
test('enroques, capturas, jaques y coronación en cada idioma', () => {
  assert.deepEqual(namedMoves('O-O y O-O-O, o 0-0'), ['O-O', 'O-O-O', 'O-O']);
  assert.deepEqual(namedMoves('Corona con e8=D+ tras Txe8#.'), ['e8=D+', 'Txe8#']);
  assert.deepEqual(namedMoves('After Nf3 Nc6, Bxc6+ and e8=Q.'), ['Nf3', 'Nc6', 'Bxc6+', 'e8=Q']);
  assert.deepEqual(namedMoves('Nach Sf3 und Lxf7+ kommt O-O.'), ['Sf3', 'Lxf7+', 'O-O']);
  assert.deepEqual(namedMoves('Dopo Cf3 e Axf7+ arriva O-O-O.'), ['Cf3', 'Axf7+', 'O-O-O']);
  assert.deepEqual(namedMoves('Après Cf3, Fxf7+ et Dxd5.'), ['Cf3', 'Fxf7+', 'Dxd5']);
});
test('una letra de pieza de otro idioma no se pasa por alto: queda como jugada distinta', () => {
  // "Nf3" en un texto alemán no se convierte a "Cf3" (en alemán N no es pieza), así que no coincide.
  assert.deepEqual(namedMoves('Nach Nf3 geht es weiter.').map((m) => toSpanishLetters(m, 'de')), ['Nf3']);
});

// ---- checkTranslation con contenido inyectado ----
const FEN = '8/8/8/8/8/8/8/K6k w - - 0 1';
const bot = (id: string): Bot =>
  ({
    id,
    name: 'Pipo',
    tagline: 'Hola',
    elo: 400,
    style: 'tranquilo',
    trait: 'Rasgo',
    teaches: 'Enseña',
    engine: { type: 'stockfish-elo', uciElo: 1320, multipv: 1, thinkMs: [1, 2] },
    repertoire: { white: [], black: [] },
    book: 'corto',
    lines: { greeting: 'a', onGoodMove: 'b', onBlunder: 'c', onWin: 'd', onLose: 'e' },
    teaching: { welcome: ['w1', 'w2'], close: ['c1'], reminder: { risk: 'Racha de {n}', recovery: 'Recupera', general: 'Juega' } },
  }) as Bot;
const spanish: Content = {
  units: [
    {
      unit: 1,
      title: 'Básico',
      lessons: [
        {
          id: 'u1-l1',
          order: 1,
          title: 'El peón',
          summary: 'Resumen',
          xp: 15,
          steps: [
            { id: 's1', type: 'explain', fen: FEN, text: 'Juega Cf3 y luego O-O.' },
            { id: 's2', type: 'quiz', fen: FEN, prompt: 'Cuántos {n}', options: ['uno', 'dos'], answer: 0, explanation: 'Porque', feedback: ['', 'No'] },
            {
              id: 's3',
              type: 'line',
              fen: FEN,
              prompt: 'Juega',
              side: 'w',
              mode: 'guided',
              moves: [
                { uci: 'g1f3', san: 'Cf3', note: 'Saca el caballo' },
                { uci: 'e7e5', san: 'e5' },
              ],
            },
          ],
        },
      ],
    },
  ],
  openings: [],
  bots: [bot('pipo')],
};
const good = (): any => ({
  units: {
    '1': {
      title: 'Basics',
      lessons: {
        'u1-l1': {
          title: 'The pawn',
          summary: 'Summary',
          steps: {
            s1: { text: 'Play Nf3 and then O-O.' },
            s2: { prompt: 'How many {n}', options: ['one', 'two'], explanation: 'Because', feedback: ['', 'No'] },
            s3: { prompt: 'Play', notes: ['Develops the knight', ''] },
          },
        },
      },
    },
  },
  bots: {
    pipo: {
      name: 'Pipo',
      tagline: 'Hi',
      trait: 'Trait',
      teaches: 'Teaches',
      lines: { greeting: 'a', onGoodMove: 'b', onBlunder: 'c', onWin: 'd', onLose: 'e' },
      teaching: { welcome: ['w1', 'w2'], close: ['c1'], reminder: { risk: 'Streak of {n}', recovery: 'Recover', general: 'Play' } },
    },
  },
});
const check = (files: LanguageFiles | undefined, exceptions: string[] = []) =>
  checkTranslation('en', spanish, files, new Set(exceptions));
const mutate = (fn: (f: any) => void) => {
  const f = good();
  fn(f);
  return check(f);
};
const step = (f: any, id: string) => f.units['1'].lessons['u1-l1'].steps[id];

test('una traducción correcta no da problemas, aunque la jugada use otras letras', () => {
  assert.deepEqual(check(good()), []);
});
test('sin archivos faltan todos los ids', () => {
  assert.ok(check(undefined).length > 0);
});
test('falta un id', () => {
  assert.ok(mutate((f) => delete step(f, 's2').prompt).some((p) => p.includes('s2')));
  assert.ok(mutate((f) => delete f.units['1'].lessons['u1-l1'].steps.s2).some((p) => p.includes('s2')));
  assert.ok(mutate((f) => delete f.bots.pipo).some((p) => p.includes('pipo')));
});
test('sobra un id', () => {
  assert.ok(mutate((f) => (f.units['1'].lessons['u1-l1'].steps.zzz = { text: 'x' })).some((p) => p.includes('zzz')));
  assert.ok(mutate((f) => (f.units['9'] = { title: 'x' })).some((p) => p.includes('9')));
  assert.ok(mutate((f) => (f.openings = { nope: { name: 'x' } })).some((p) => p.includes('nope')));
  assert.ok(mutate((f) => (f.bots.nope = { name: 'x' })).some((p) => p.includes('nope')));
});
test('texto vacío', () => {
  assert.ok(mutate((f) => (step(f, 's1').text = '')).some((p) => p.includes('s1')));
});
test('marcadores distintos', () => {
  assert.ok(mutate((f) => (step(f, 's2').prompt = 'How many')).some((p) => p.includes('{n}')));
});
test('lista de otro largo', () => {
  assert.ok(mutate((f) => (step(f, 's2').options = ['one'])).some((p) => p.includes('options')));
  assert.ok(mutate((f) => (step(f, 's3').notes = ['x'])).some((p) => p.includes('notes')));
});
test('jugada nombrada distinta', () => {
  assert.ok(mutate((f) => (step(f, 's1').text = 'Play Nc3 and then O-O.')).some((p) => p.includes('jugadas')));
  assert.ok(mutate((f) => (step(f, 's1').text = 'Play Nf3 and then O-O-O.')).some((p) => p.includes('jugadas')));
  assert.ok(mutate((f) => (step(f, 's1').text = 'Play Nf3.')).some((p) => p.includes('jugadas')));
});
test('la excepción por id de paso permite jugadas distintas', () => {
  const f = good();
  step(f, 's1').text = 'Play Nc3.';
  assert.deepEqual(check(f, ['s1']), []);
});
test('signo ! en una frase de bot', () => {
  assert.ok(mutate((f) => (f.bots.pipo.lines.greeting = 'Hi!')).some((p) => p.includes('!')));
});
test('recuperación vacía', () => {
  assert.ok(mutate((f) => (f.bots.pipo.teaching.reminder.recovery = '')).some((p) => p.includes('recovery')));
});
