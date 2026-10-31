import test from 'node:test';
import assert from 'node:assert/strict';
import { applyBotText, applyLessonText, applyOpeningText, buildContent } from './translate';
import { localizedContent } from './localized';
import { bots } from './bots';
import { openings } from './openings';
import { units } from './units';
import type { Lesson } from './lessonTypes';

const FEN = '8/8/8/8/8/8/8/K6k w - - 0 1';
const lesson: Lesson = {
  id: 'x-l01',
  order: 1,
  title: 'Horquilla',
  summary: 'Resumen',
  xp: 15,
  steps: [
    { id: 's1', type: 'move', fen: FEN, prompt: 'Juega', solutions: ['a1a2'], hint: 'Pista', success: 'Bien' },
    { id: 's2', type: 'explain', fen: FEN, text: 'Texto', arrows: ['a1a2'] },
  ],
};
const quizLesson: Lesson = {
  ...lesson,
  steps: [
    { id: 's1', type: 'quiz', fen: FEN, prompt: 'Cuál', options: ['uno', 'dos'], answer: 1, explanation: 'Porque' },
  ],
};
const lineLesson: Lesson = {
  ...lesson,
  steps: [
    {
      id: 's1',
      type: 'line',
      fen: FEN,
      prompt: 'Juega',
      side: 'w',
      mode: 'guided',
      moves: [
        { uci: 'e2e4', san: 'e4', note: 'nota 1' },
        { uci: 'e7e5', san: 'e5' },
        { uci: 'g1f3', san: 'Cf3', note: 'nota 3' },
      ],
    },
  ],
};

test('reemplaza el texto y no toca lo demás', () => {
  const out = applyLessonText(lesson, { title: 'Fork', steps: { s1: { prompt: 'Play' } } });
  assert.equal(out.title, 'Fork');
  assert.equal(out.summary, 'Resumen');
  const step = out.steps[0] as { prompt: string; fen: string; solutions: string[]; hint: string };
  assert.equal(step.prompt, 'Play');
  assert.equal(step.hint, 'Pista');
  assert.equal(step.fen, FEN);
  assert.deepEqual(step.solutions, ['a1a2']);
  assert.equal(out.steps[1], lesson.steps[1]);
});

test('sin traducción queda el español', () => {
  assert.equal(applyLessonText(lesson, undefined), lesson);
  assert.deepEqual(applyLessonText(lesson, {}), lesson);
});

test('lista de otro largo queda en español', () => {
  const out = applyLessonText(quizLesson, { steps: { s1: { options: ['a'] } } });
  assert.deepEqual((out.steps[0] as { options: string[] }).options, ['uno', 'dos']);
});

test('lista del mismo largo se reemplaza y la respuesta no cambia', () => {
  const out = applyLessonText(quizLesson, { steps: { s1: { options: ['one', 'two'] } } });
  const step = out.steps[0] as { options: string[]; answer: number };
  assert.deepEqual(step.options, ['one', 'two']);
  assert.equal(step.answer, 1);
});

test('un campo que no es texto se ignora', () => {
  const out = applyLessonText(lesson, { steps: { s1: { fen: 'x', solutions: ['a1a2'], uci: 'z' } } } as never);
  const step = out.steps[0] as { fen: string; solutions: string[] };
  assert.equal(step.fen, FEN);
  assert.deepEqual(step.solutions, ['a1a2']);
});

test('un texto vacío o de otro tipo se ignora', () => {
  const out = applyLessonText(lesson, { title: '', steps: { s1: { prompt: 3 } } } as never);
  assert.equal(out.title, 'Horquilla');
  assert.equal((out.steps[0] as { prompt: string }).prompt, 'Juega');
});

test('un texto no aplica a un campo que el paso no tiene', () => {
  const out = applyLessonText(lesson, { steps: { s2: { prompt: 'x' } } });
  assert.equal('prompt' in out.steps[1], false);
});

test('las notas de line se alinean con las jugadas y no tocan uci ni san', () => {
  // Falta el texto de una jugada que sí tenía nota: la lista no vale.
  const bad = applyLessonText(lineLesson, { steps: { s1: { notes: ['note 1', '', ''] } } });
  assert.deepEqual((bad.steps[0] as { moves: unknown[] }).moves, (lineLesson.steps[0] as { moves: unknown[] }).moves);
  const ok = applyLessonText(lineLesson, { steps: { s1: { notes: ['note 1', '', 'note 3'] } } });
  const moves = (ok.steps[0] as { moves: { uci: string; san: string; note?: string }[] }).moves;
  assert.deepEqual(
    moves.map((m) => [m.uci, m.san, m.note]),
    [['e2e4', 'e4', 'note 1'], ['e7e5', 'e5', undefined], ['g1f3', 'Cf3', 'note 3']]
  );
  const short = applyLessonText(lineLesson, { steps: { s1: { notes: ['a'] } } });
  assert.deepEqual((short.steps[0] as { moves: unknown[] }).moves, (lineLesson.steps[0] as { moves: unknown[] }).moves);
});

test('apertura: nombre y resumen cambian, el color no', () => {
  const course = openings[0];
  const out = applyOpeningText(course, { name: 'Name', summary: 'Sum' });
  assert.equal(out.name, 'Name');
  assert.equal(out.summary, 'Sum');
  assert.equal(out.color, course.color);
  assert.equal(out.id, course.id);
});

test('bot: texto traducido, nivel y motor intactos; frases de otro largo quedan en español', () => {
  const bot = bots[0];
  const out = applyBotText(bot, {
    name: 'Pip',
    lines: { greeting: 'Hi' },
    teaching: { welcome: ['solo una'], close: bot.teaching.close.map((_, i) => `c${i}`) },
  });
  assert.equal(out.name, 'Pip');
  assert.equal(out.lines.greeting, 'Hi');
  assert.equal(out.lines.onWin, bot.lines.onWin);
  assert.deepEqual(out.teaching.welcome, bot.teaching.welcome);
  assert.equal(out.teaching.close[0], 'c0');
  assert.equal(out.elo, bot.elo);
  assert.equal(out.engine, bot.engine);
});

test('buildContent traduce por número de unidad, id de curso y de bot', () => {
  const out = buildContent(
    { units, openings, bots },
    { units: { '1': { title: 'Basics' } }, openings: { [openings[0].id]: { name: 'N' } }, bots: { [bots[0].id]: { name: 'B' } } }
  );
  assert.equal(out.units[0].title, 'Basics');
  assert.equal(out.units[1], units[1]);
  assert.equal(out.openings[0].name, 'N');
  assert.equal(out.bots[0].name, 'B');
});

test('español devuelve los datos originales', () => {
  const es = localizedContent('es');
  assert.equal(es.units, units);
  assert.equal(es.openings, openings);
  assert.equal(es.bots, bots);
});

test('un idioma sin archivos devuelve el español, con memoria', () => {
  const en = localizedContent('de');
  assert.equal(en.units, units);
  assert.equal(localizedContent('de'), en);
});

test('feedback acepta "" donde el español lo tiene y lo rechaza donde hay texto', () => {
  const quiz: Lesson = {
    ...lesson,
    steps: [{ id: 's1', type: 'quiz', fen: FEN, prompt: 'Cuál', options: ['uno', 'dos'], answer: 0, explanation: 'x', feedback: ['', 'Es cierto, pero'] }],
  };
  const ok = applyLessonText(quiz, { steps: { s1: { feedback: ['', 'True, but'] } } });
  assert.deepEqual((ok.steps[0] as { feedback: string[] }).feedback, ['', 'True, but']);
  const bad = applyLessonText(quiz, { steps: { s1: { feedback: ['', ''] } } });
  assert.deepEqual((bad.steps[0] as { feedback: string[] }).feedback, ['', 'Es cierto, pero']);
  const bad2 = applyLessonText(quiz, { steps: { s1: { feedback: ['algo', 'True'] } } });
  assert.deepEqual((bad2.steps[0] as { feedback: string[] }).feedback, ['', 'Es cierto, pero']);
});
