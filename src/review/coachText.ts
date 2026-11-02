import type { BotStyle } from '../data/bots';
import type { Facts, MoveQuality, PieceKind } from './types';

// Voz del comentarista. Las opiniones salen de plantillas por estilo del personaje; los hechos
// (qué capturó, qué permite, qué se dejó pasar) vienen ya verificados con el tablero (build.ts):
// aquí solo se ponen en palabras. Sin React Native.
// Hoy hay textos en español e inglés; los demás idiomas usan el inglés.

export type CoachLang = 'es' | 'en';
export const coachLang = (language: string): CoachLang => (language === 'es' ? 'es' : 'en');

export type VoiceKey = MoveQuality | 'great' | 'mate';
export type Subject = 'you' | 'opponent';

type Table = Record<BotStyle, Record<VoiceKey, string[]>>;

const YOU: Record<CoachLang, Table> = {
  es: {
    tranquilo: {
      book: ['{move} es jugada de libro. Vas por buen camino.', 'Teoría pura con {move}: sin apuro y bien.'],
      best: ['{move} es la mejor. Muy bien, así se hace.', 'Justo lo que había que jugar: {move}.'],
      excellent: ['{move} es excelente. Sigue así.', 'Muy buena jugada, {move}.'],
      good: ['{move} está bien, no hay problema.', 'Jugada correcta: {move}. Tranquilo.'],
      inaccuracy: ['{move} es una imprecisión. Nada grave, pero había algo mejor.', 'Con {move} se te escapa un poquito de ventaja.'],
      mistake: ['{move} es un error. Pasa, lo importante es entender por qué.', 'Ojo con {move}: cambia la partida.'],
      blunder: ['{move} es un error grave. Respira: lo vemos juntos.', 'Uy, {move} fue un descuido importante. Mira bien el tablero.'],
      great: ['{move}: aprovechaste el error del rival. Muy bien visto.', 'Buen ojo con {move}: castigaste la jugada anterior.'],
      mate: ['{move} es jaque mate. Partida ganada, felicitaciones.', 'Mate con {move}. Qué lindo final.'],
    },
    equilibrado: {
      book: ['{move} es teoría. Seguimos en libro.', 'Jugada de libro: {move}.'],
      best: ['{move} es la mejor jugada.', 'Exacto: {move} era lo mejor.'],
      excellent: ['{move} es excelente.', 'Muy precisa, {move}.'],
      good: ['{move} es una buena jugada.', '{move} cumple: correcta, sin más.'],
      inaccuracy: ['{move} es imprecisa: había algo mejor.', 'Con {move} regalas un poco de ventaja.'],
      mistake: ['{move} es un error y se paga.', 'Error con {move}: te cuesta la iniciativa.'],
      blunder: ['{move} es un error grave. Cambia el resultado.', 'Grave: {move} deja la partida en manos del rival.'],
      great: ['{move} castiga el error del rival. Buena.', 'Bien ahí: {move} aprovecha el regalo.'],
      mate: ['{move} es mate. Bien cerrado.', 'Jaque mate con {move}.'],
    },
    posicional: {
      book: ['{move} sigue la teoría: estructura sana.', '{move} es de libro; la posición es la esperada.'],
      best: ['{move} es la mejor: mejora tu posición al máximo.', '{move} era lo más preciso.'],
      excellent: ['{move} es excelente: conserva tu ventaja.', 'Muy sólida, {move}.'],
      good: ['{move} es correcta, aunque hay jugadas más finas.', '{move} es aceptable: no empeora la posición.'],
      inaccuracy: ['{move} es imprecisa: cede un poco de control.', 'Con {move} la posición se vuelve algo más fácil para el rival.'],
      mistake: ['{move} es un error posicional y táctico: pierde el hilo de la partida.', '{move} debilita demasiado tu posición.'],
      blunder: ['{move} es un error grave: la posición se desploma.', 'Con {move} rompes el equilibrio de la peor manera.'],
      great: ['{move} aprovecha con precisión el error rival.', '{move}: cobras la ventaja que te regaló.'],
      mate: ['{move} es mate: la posición lo pedía.', 'Mate con {move}. Final limpio.'],
    },
    agresivo: {
      book: ['{move}, de libro. Ahora a atacar.', 'Teoría con {move}: sigue presionando.'],
      best: ['¡{move}! La mejor, directo al grano.', '{move} es lo mejor: así se juega.'],
      excellent: ['¡{move} es excelente! Con ganas.', 'Qué buena, {move}.'],
      good: ['{move} está bien, pero se podía apretar más.', 'Correcta, {move}; falta un poco de fuego.'],
      inaccuracy: ['{move} es imprecisa: pierdes ritmo.', 'Con {move} le das aire al rival.'],
      mistake: ['{move} es un error: te sacan de la pelea.', 'Eso con {move} no se hace: lo pagas caro.'],
      blunder: ['¡{move} es un error grave! Se te cayó todo.', 'Ay, {move}: regalaste la partida.'],
      great: ['¡{move}! Castigaste sin piedad el error.', '¡Así se aprovecha un regalo con {move}!'],
      mate: ['¡{move} es mate! ¡Ese es el final que quería ver!', '¡Jaque mate con {move}! Ni lo vio venir.'],
    },
  },
  en: {
    tranquilo: {
      book: ['{move} is a book move. You are on the right track.', 'Pure theory with {move}: calm and correct.'],
      best: ['{move} is the best move. Well done.', 'Exactly what the position needed: {move}.'],
      excellent: ['{move} is excellent. Keep it up.', 'A really nice move, {move}.'],
      good: ['{move} is fine, no problem at all.', 'A correct move: {move}. Relax.'],
      inaccuracy: ['{move} is an inaccuracy. Nothing serious, but there was better.', 'With {move} a little of your edge slips away.'],
      mistake: ['{move} is a mistake. It happens; what matters is understanding why.', 'Careful with {move}: it changes the game.'],
      blunder: ['{move} is a blunder. Breathe: we will look at it together.', 'Oops, {move} was a big slip. Look at the board again.'],
      great: ['{move}: you took advantage of the mistake. Nicely spotted.', 'Good eye with {move}: you punished the last move.'],
      mate: ['{move} is checkmate. Game won, congratulations.', 'Mate with {move}. What a lovely ending.'],
    },
    equilibrado: {
      book: ['{move} is theory. Still in the book.', 'Book move: {move}.'],
      best: ['{move} is the best move.', 'Exactly: {move} was best.'],
      excellent: ['{move} is excellent.', 'Very precise, {move}.'],
      good: ['{move} is a good move.', '{move} does the job: correct, nothing more.'],
      inaccuracy: ['{move} is inaccurate: there was better.', 'With {move} you give away a little advantage.'],
      mistake: ['{move} is a mistake and it costs you.', 'A mistake with {move}: you lose the initiative.'],
      blunder: ['{move} is a blunder. It changes the result.', 'Serious: {move} hands the game to your opponent.'],
      great: ['{move} punishes the opponent\'s mistake. Good.', 'Well done: {move} takes the gift.'],
      mate: ['{move} is mate. Nicely finished.', 'Checkmate with {move}.'],
    },
    posicional: {
      book: ['{move} follows theory: a healthy structure.', '{move} is book; the position is as expected.'],
      best: ['{move} is the best: it improves your position the most.', '{move} was the most precise.'],
      excellent: ['{move} is excellent: it keeps your edge.', 'Very solid, {move}.'],
      good: ['{move} is correct, though there were finer moves.', '{move} is acceptable: it does not worsen the position.'],
      inaccuracy: ['{move} is inaccurate: it gives up a little control.', 'With {move} the position gets easier for your opponent.'],
      mistake: ['{move} is a positional and tactical mistake: you lose the thread.', '{move} weakens your position too much.'],
      blunder: ['{move} is a blunder: the position collapses.', 'With {move} you break the balance in the worst way.'],
      great: ['{move} precisely exploits the opponent\'s mistake.', '{move}: you collect the advantage you were given.'],
      mate: ['{move} is mate: the position called for it.', 'Mate with {move}. A clean finish.'],
    },
    agresivo: {
      book: ['{move}, straight from the book. Now attack.', 'Theory with {move}: keep the pressure on.'],
      best: ['{move}! The best, right to the point.', '{move} is best: that is how you play.'],
      excellent: ['{move} is excellent! Love it.', 'What a move, {move}.'],
      good: ['{move} is fine, but you could press harder.', 'Correct, {move}; it needs a bit more fire.'],
      inaccuracy: ['{move} is inaccurate: you lose the tempo.', 'With {move} you give your opponent air.'],
      mistake: ['{move} is a mistake: you are out of the fight.', 'You do not play {move} there: it costs you dearly.'],
      blunder: ['{move} is a blunder! Everything fell apart.', 'Ouch, {move}: you gave the game away.'],
      great: ['{move}! You punished the mistake without mercy.', 'That is how you take a gift with {move}!'],
      mate: ['{move} is mate! That is the ending I wanted to see!', 'Checkmate with {move}! They never saw it coming.'],
    },
  },
};

type OppKey = 'ok' | 'inaccuracy' | 'mistake' | 'blunder' | 'mate';
const OPP: Record<CoachLang, Record<OppKey, string[]>> = {
  es: {
    ok: ['El rival juega {move}, una jugada correcta.', 'El rival responde con {move}.'],
    inaccuracy: ['El rival juega {move}, una imprecisión: te da algo de aire.'],
    mistake: ['El rival se equivoca con {move}: es tu oportunidad.'],
    blunder: ['¡El rival cometió un error grave con {move}! Aprovéchalo.'],
    mate: ['El rival da mate con {move}.'],
  },
  en: {
    ok: ['Your opponent plays {move}, a correct move.', 'Your opponent answers with {move}.'],
    inaccuracy: ['Your opponent plays {move}, an inaccuracy: it gives you some air.'],
    mistake: ['Your opponent errs with {move}: this is your chance.'],
    blunder: ['Your opponent blundered with {move}! Take advantage.'],
    mate: ['Your opponent delivers mate with {move}.'],
  },
};

const PIECES: Record<CoachLang, Record<PieceKind, string>> = {
  es: { p: 'un peón', n: 'un caballo', b: 'un alfil', r: 'una torre', q: 'la dama', k: 'el rey' },
  en: { p: 'a pawn', n: 'a knight', b: 'a bishop', r: 'a rook', q: 'the queen', k: 'the king' },
};

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

const pick = (list: string[], seed: number) => list[Math.abs(seed) % list.length];

/** Opinión del comentarista sobre la jugada (una frase). `move` ya viene en la notación del usuario. */
export function coachVoice(o: {
  lang: CoachLang;
  style: BotStyle;
  quality: MoveQuality;
  great: boolean;
  mate: boolean;
  subject: Subject;
  move: string;
  seed: number;
}): string {
  const key: VoiceKey = o.mate ? 'mate' : o.great ? 'great' : o.quality;
  if (o.subject === 'you') return fill(pick(YOU[o.lang][o.style][key], o.seed), { move: o.move });
  const k: OppKey = o.mate ? 'mate' : o.quality === 'inaccuracy' || o.quality === 'mistake' || o.quality === 'blunder' ? o.quality : 'ok';
  return fill(pick(OPP[o.lang][k], o.seed), { move: o.move });
}

/**
 * Las tres partes de la explicación, con hechos verificados: qué hizo la jugada, qué le dejó al rival
 * y qué convenía jugar. `fmt` pasa una jugada de notación inglesa a la del usuario.
 */
export function coachExplanation(o: {
  lang: CoachLang;
  subject: Subject;
  quality: MoveQuality;
  facts: Facts;
  move: string;
  bestSan: string;
  fmt: (san: string) => string;
}): string[] {
  const { lang, facts, fmt } = o;
  const es = lang === 'es';
  const lines: string[] = [];
  const you = o.subject === 'you';
  const P = (k: PieceKind) => PIECES[lang][k];

  if (facts.did) {
    const d = facts.did;
    if (d.kind === 'mate') lines.push(es ? `${o.move} da jaque mate.` : `${o.move} is checkmate.`);
    else if (d.kind === 'check') lines.push(es ? `${o.move} da jaque.` : `${o.move} gives check.`);
    else if (d.kind === 'capture')
      lines.push(es ? `${o.move} captura ${P(d.piece)}.` : `${o.move} captures ${P(d.piece)}.`);
    else lines.push(es ? `${o.move} es un enroque: rey a salvo y torre al juego.` : `${o.move} castles: king safe and rook in play.`);
  }

  const a = facts.allows;
  if (a) {
    const san = fmt(a.san);
    if (a.kind === 'mate')
      lines.push(you ? (es ? `Permite ${san}: jaque mate.` : `It allows ${san}: checkmate.`) : es ? `Con ${san} puedes dar mate.` : `${san} would be mate.`);
    else if (a.kind === 'capture')
      lines.push(
        you
          ? a.ofMoved
            ? es ? `Esa pieza queda sin defensa: con ${san} el rival se lleva ${P(a.piece)}.` : `That piece is left unprotected: ${san} wins ${P(a.piece)}.`
            : es ? `Deja que el rival capture ${P(a.piece)} con ${san}.` : `It lets your opponent capture ${P(a.piece)} with ${san}.`
          : es ? `Con ${san} puedes capturar ${P(a.piece)}.` : `${san} wins ${P(a.piece)}.`
      );
    else
      lines.push(
        you
          ? es ? `El rival responde con ${san}, jaque, y toma la iniciativa.` : `Your opponent answers with check, ${san}, and takes the initiative.`
          : es ? `Puedes responder con ${san}, jaque.` : `You can answer with ${san}, check.`
      );
  }

  const m = facts.missed;
  const bad = o.quality === 'inaccuracy' || o.quality === 'mistake' || o.quality === 'blunder';
  if (bad && o.bestSan) {
    const best = fmt(o.bestSan);
    if (m?.kind === 'mate') lines.push(you ? (es ? `Había mate con ${best}.` : `There was mate with ${best}.`) : es ? `El rival no vio el mate con ${best}.` : `Your opponent missed mate with ${best}.`);
    else if (m?.kind === 'capture')
      lines.push(you ? (es ? `Podías capturar ${P(m.piece)} con ${best}.` : `You could capture ${P(m.piece)} with ${best}.`) : es ? `El rival podía capturar ${P(m.piece)} con ${best}.` : `Your opponent could capture ${P(m.piece)} with ${best}.`);
    else lines.push(you ? (es ? `Lo mejor era ${best}.` : `The best move was ${best}.`) : es ? `Lo mejor para el rival era ${best}.` : `Best for your opponent was ${best}.`);
  }
  return lines;
}
