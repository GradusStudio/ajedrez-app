import type { Bot } from '../data/bots';
import { coachExplanation, coachVoice, type CoachLang, type Subject } from './coachText';
import type { ReviewPly } from './types';

/** Lo que el comentarista dice de una jugada: su opinión (una frase) y los hechos verificados, ya en palabras. */
export type CoachTake = { voice: string; details: string[] };

type Args = {
  ply: ReviewPly;
  /** Solo se usan el estilo (plantillas) y el Elo (semilla de las variantes). */
  coach: Pick<Bot, 'style' | 'elo'>;
  lang: CoachLang;
  subject: Subject;
  /** La jugada en la notación del usuario (ya pasada por `fmt`). */
  san: string;
  fmt: (san: string) => string;
};

/**
 * La voz y la explicación de una jugada, del mismo compositor que usa el resto de la app. Una revisión guardada vieja
 * o rota puede traer hechos con formas inesperadas: en ese caso se conserva la voz del bot (si llegó a componerse) y se
 * dejan los hechos vacíos, sin tirar la pantalla ni el resumen. Módulo puro: sin React Native.
 */
export function coachTake(o: Args): CoachTake {
  let voice = '';
  try {
    voice = coachVoice({
      lang: o.lang,
      style: o.coach.style,
      quality: o.ply.quality,
      great: o.ply.great,
      mate: o.ply.move.san.endsWith('#'),
      subject: o.subject,
      move: o.san,
      seed: o.ply.ply + o.coach.elo,
    });
    const details = coachExplanation({
      lang: o.lang,
      subject: o.subject,
      quality: o.ply.quality,
      facts: o.ply.facts,
      move: o.san,
      bestSan: o.ply.bestSan,
      fmt: o.fmt,
      seed: o.ply.ply + o.coach.elo,
      style: o.coach.style,
    });
    return { voice, details };
  } catch {
    return { voice, details: [] };
  }
}
