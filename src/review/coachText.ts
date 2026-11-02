import type { BotStyle } from '../data/bots';
import de from './coach/de.json';
import en from './coach/en.json';
import es from './coach/es.json';
import fr from './coach/fr.json';
import it from './coach/it.json';
import type { Facts, MoveQuality, PieceKind } from './types';

// Voz del comentarista. Las opiniones salen de plantillas por estilo del personaje; los hechos
// (qué capturó, qué permite, qué se dejó pasar) vienen ya verificados con el tablero (build.ts):
// aquí solo se ponen en palabras. Los textos de cada idioma están en `coach/<idioma>.json`
// (de, it y fr traducidos con IA, sin revisión de nativos). Sin React Native.

export type CoachLang = 'es' | 'en' | 'de' | 'it' | 'fr';
const LANGS: CoachLang[] = ['es', 'en', 'de', 'it', 'fr'];
export const coachLang = (language: string): CoachLang =>
  (LANGS as string[]).includes(language) ? (language as CoachLang) : 'en';

export type VoiceKey = MoveQuality | 'great' | 'mate';
export type Subject = 'you' | 'opponent';

type OppKey = 'ok' | 'inaccuracy' | 'mistake' | 'blunder' | 'mate';
type ExplKey =
  | 'didMate' | 'didCheck' | 'didCapture' | 'didCastle'
  | 'allowsMateYou' | 'allowsMateOpp' | 'allowsCaptureMoved' | 'allowsCaptureYou' | 'allowsCaptureOpp'
  | 'allowsCheckYou' | 'allowsCheckOpp'
  | 'missedMateYou' | 'missedMateOpp' | 'missedCaptureYou' | 'missedCaptureOpp' | 'missedBestYou' | 'missedBestOpp';

type Texts = {
  you: Record<BotStyle, Record<VoiceKey, string[]>>;
  opp: Record<OppKey, string[]>;
  pieces: Record<PieceKind, string>;
  expl: Record<ExplKey, string>;
};

export const TEXTS: Record<CoachLang, Texts> = { es, en, de, it, fr } as Record<CoachLang, Texts>;

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
  const tx = TEXTS[o.lang];
  const key: VoiceKey = o.mate ? 'mate' : o.great ? 'great' : o.quality;
  if (o.subject === 'you') return fill(pick(tx.you[o.style][key], o.seed), { move: o.move });
  const k: OppKey = o.mate ? 'mate' : o.quality === 'inaccuracy' || o.quality === 'mistake' || o.quality === 'blunder' ? o.quality : 'ok';
  return fill(pick(tx.opp[k], o.seed), { move: o.move });
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
  const { facts, fmt } = o;
  const tx = TEXTS[o.lang];
  const lines: string[] = [];
  const you = o.subject === 'you';
  const say = (key: ExplKey, v: Record<string, string> = {}) => lines.push(fill(tx.expl[key], { move: o.move, ...v }));
  const piece = (k: PieceKind) => tx.pieces[k];

  if (facts.did) {
    const d = facts.did;
    if (d.kind === 'mate') say('didMate');
    else if (d.kind === 'check') say('didCheck');
    else if (d.kind === 'capture') say('didCapture', { piece: piece(d.piece) });
    else say('didCastle');
  }

  const a = facts.allows;
  if (a) {
    const san = fmt(a.san);
    if (a.kind === 'mate') say(you ? 'allowsMateYou' : 'allowsMateOpp', { san });
    else if (a.kind === 'capture')
      say(you ? (a.ofMoved ? 'allowsCaptureMoved' : 'allowsCaptureYou') : 'allowsCaptureOpp', { san, piece: piece(a.piece) });
    else say(you ? 'allowsCheckYou' : 'allowsCheckOpp', { san });
  }

  const m = facts.missed;
  const bad = o.quality === 'inaccuracy' || o.quality === 'mistake' || o.quality === 'blunder';
  if (bad && o.bestSan) {
    const best = fmt(o.bestSan);
    if (m?.kind === 'mate') say(you ? 'missedMateYou' : 'missedMateOpp', { best });
    else if (m?.kind === 'capture') say(you ? 'missedCaptureYou' : 'missedCaptureOpp', { best, piece: piece(m.piece) });
    else say(you ? 'missedBestYou' : 'missedBestOpp', { best });
  }
  return lines;
}
