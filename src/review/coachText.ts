import type { BotStyle } from '../data/bots';
import de from './coach/de.json';
import en from './coach/en.json';
import es from './coach/es.json';
import fr from './coach/fr.json';
import it from './coach/it.json';
import type { PlanKind } from './plans';
import type { TacticKind } from './tactics';
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

type MateKey = 'foundYou' | 'foundOpp' | 'allowsYou' | 'allowsOpp';
type TactTexts = Record<'you' | 'opp', Record<TacticKind, string[]>>;

// Convención: las tácticas (tact.*) son listas de variantes elegidas con la semilla; mateIn y plan
// son una sola frase. En plan, {piece} va en minúscula con artículo ("el caballo") y {Piece} con
// la primera letra en mayúscula, para empezar frase.
type Texts = {
  you: Record<BotStyle, Record<VoiceKey, string[]>>;
  opp: Record<OppKey, string[]>;
  // `pieces` lleva artículo indefinido ("un caballo", para lo capturado); `pieceDef` el definido ("el caballo", sujeto o
  // complemento con preposición) y `pieceObj` el complemento directo ("al rey", "a la torre"; igual que pieceDef en inglés).
  pieces: Record<PieceKind, string>;
  expl: Record<ExplKey, string>;
  tact: { found: TactTexts; allows: TactTexts };
  mateIn: Record<MateKey, string>;
  plan: Record<PlanKind, string>;
  and: string;
  pieceDef: Record<PieceKind, string>;
  pieceObj: Record<PieceKind, string>;
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
 * y qué convenía jugar. `fmt` pasa una jugada de notación inglesa a la del usuario. Como mucho 3 líneas,
 * por prioridad: mate, tácticas encontradas, táctica permitida, lo que hizo, lo permitido y perdido, plan.
 * `seed` elige entre las variantes de cada táctica.
 */
export function coachExplanation(o: {
  lang: CoachLang;
  subject: Subject;
  quality: MoveQuality;
  facts: Facts;
  move: string;
  bestSan: string;
  fmt: (san: string) => string;
  seed?: number;
}): string[] {
  const { facts, fmt } = o;
  const tx = TEXTS[o.lang];
  const seed = o.seed ?? 0;
  const mate: string[] = [];
  const tactics: string[] = [];
  const allowedTactic: string[] = [];
  const did: string[] = [];
  const rest: string[] = [];
  const plan: string[] = [];
  const you = o.subject === 'you';
  const side = you ? 'you' : 'opp';
  const say = (to: string[], key: ExplKey, v: Record<string, string> = {}) => to.push(fill(tx.expl[key], { move: o.move, ...v }));
  const piece = (k: PieceKind) => tx.pieces[k];
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  const def = (k: PieceKind) => tx.pieceDef[k];
  const list = (ks: PieceKind[], table: Record<PieceKind, string>) => {
    const names = [...new Set(ks)].map((k) => table[k]);
    return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} ${tx.and} ${names[names.length - 1]}`;
  };
  const tacticVars = (t: { attacker: PieceKind; targets: PieceKind[] }) => ({ attacker: def(t.attacker), targets: list(t.targets, tx.pieceObj), targetsDef: list(t.targets, tx.pieceDef) });

  if (facts.mateIn) {
    const { n, mover } = facts.mateIn;
    const key: MateKey = mover ? (you ? 'foundYou' : 'foundOpp') : you ? 'allowsYou' : 'allowsOpp';
    mate.push(fill(tx.mateIn[key], { n: String(n) }));
  }
  if (facts.did) {
    const d = facts.did;
    if (d.kind === 'mate') say(mate, 'didMate');
    else if (d.kind === 'check') say(did, 'didCheck');
    else if (d.kind === 'capture') say(did, 'didCapture', { piece: piece(d.piece) });
    else say(did, 'didCastle');
  }

  (facts.found ?? []).forEach((t, i) => tactics.push(fill(pick(tx.tact.found[side][t.kind], seed + i), tacticVars(t))));
  if (facts.allowsTactic) {
    const { tactic, san } = facts.allowsTactic;
    allowedTactic.push(fill(pick(tx.tact.allows[side][tactic.kind], seed), { ...tacticVars(tactic), san: fmt(san) }));
  }

  const a = facts.allows;
  if (a) {
    const san = fmt(a.san);
    if (a.kind === 'mate') say(rest, you ? 'allowsMateYou' : 'allowsMateOpp', { san });
    else if (a.kind === 'capture')
      say(rest, you ? (a.ofMoved ? 'allowsCaptureMoved' : 'allowsCaptureYou') : 'allowsCaptureOpp', { san, piece: piece(a.piece) });
    else say(rest, you ? 'allowsCheckYou' : 'allowsCheckOpp', { san });
  }

  const m = facts.missed;
  const bad = o.quality === 'inaccuracy' || o.quality === 'mistake' || o.quality === 'blunder';
  if (bad && o.bestSan) {
    const best = fmt(o.bestSan);
    if (m?.kind === 'mate') say(rest, you ? 'missedMateYou' : 'missedMateOpp', { best });
    else if (m?.kind === 'capture') say(rest, you ? 'missedCaptureYou' : 'missedCaptureOpp', { best, piece: piece(m.piece) });
    else say(rest, you ? 'missedBestYou' : 'missedBestOpp', { best });
  }

  if (facts.plan && !facts.did && !facts.found) {
    const p = facts.plan;
    plan.push(fill(tx.plan[p.kind], { piece: def(p.piece), Piece: cap(def(p.piece)), from: p.from, to: p.to, move: o.move }));
  }
  return [...mate, ...tactics, ...allowedTactic, ...did, ...rest, ...plan].slice(0, 3);
}
