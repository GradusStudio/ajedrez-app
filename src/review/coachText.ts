import type { BotStyle } from '../data/bots';
import de from './coach/de.json';
import en from './coach/en.json';
import es from './coach/es.json';
import fr from './coach/fr.json';
import it from './coach/it.json';
import type { LineFacts } from './lines';
import type { PlanKind } from './plans';
import type { TacticKind } from './tactics';
import type { Facts, MoveQuality, PieceKind } from './types';

// Voz del comentarista. Las opiniones salen de plantillas por estilo del personaje; los hechos
// (qué capturó, qué permite, qué se dejó pasar) vienen ya verificados con el tablero (build.ts):
// aquí solo se ponen en palabras. Los textos de cada idioma están en `coach/<idioma>.json`
// (de, it y fr traducidos con IA, sin revisión de nativos; las claves de `frame`, `opp`, `line` e
// `intent` están por ahora en inglés en esos tres idiomas). Sin React Native.

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
/** Situación de la explicación: el rival erró (exploit), el error es propio (allows) o la jugada no es mala (good). */
type Situation = 'exploit' | 'allows' | 'good';
/** Texto de una línea del motor: la usa quien explota el error (exploit), quien lo sufre (allows) o la oportunidad perdida (missed). */
type LineSituation = 'exploit' | 'allows' | 'missed';
type IntentKind = Extract<PlanKind, 'develop' | 'center' | 'rookFile' | 'pawnBreak' | 'pawnAdvance' | 'kingActive' | 'retreat'>;

/** Largo máximo (en caracteres) del párrafo de la explicación. */
export const EXPLANATION_CAP = 220;

// Convención: las tácticas (tact.*) son listas de variantes elegidas con la semilla; mateIn y plan
// son una sola frase. En plan, {piece} va en minúscula con artículo ("el caballo") y {Piece} con
// la primera letra en mayúscula, para empezar frase. `frame` es el marco del estilo (lead y tail
// del párrafo; el tail solo existe cuando hay error), `line` dice la línea del motor ({first} y
// {finish} son la primera y la tercera jugada, {seq} la secuencia, {n} los puntos de material) e
// `intent` dice, solo en jugadas malas, qué buscaba el plan; no depende de quién jugó.
type Texts = {
  you: Record<BotStyle, Record<VoiceKey, string[]>>;
  opp: Record<BotStyle, Record<OppKey, string[]>>;
  frame: Record<BotStyle, { exploit: { lead: string[]; tail: string[] }; allows: { lead: string[]; tail: string[] }; good: { lead: string[] } }>;
  line: { removeDefender: Record<LineSituation, string[]>; material: Record<LineSituation, string[]> };
  intent: Record<IntentKind, string[]>;
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
  return fill(pick(tx.opp[o.style][k], o.seed), { move: o.move });
}

const INTENT_KINDS: PlanKind[] = ['develop', 'center', 'rookFile', 'pawnBreak', 'pawnAdvance', 'kingActive', 'retreat'];
// Cuántas variantes distintas se prueban, como mucho, para que el párrafo entre en el tope.
const VARIANT_TRIES = 4;

/** Un trozo del párrafo: `len` es cuántas jugadas de la secuencia se muestran y `k` cuánto se corre la variante elegida. */
type Part = (len: number, k: number) => string;

/**
 * La explicación de una jugada en la voz del bot: un único párrafo con un lead del estilo, como mucho
 * dos hechos verificados, la intención del plan (solo en jugadas malas) y una cola del estilo (solo en
 * errores). Los hechos salen de una escalera de prioridad: mate, eliminar al defensor, otras tácticas,
 * material de la línea del motor, lo que hizo la jugada y lo permitido o perdido; el plan de una jugada
 * buena entra al final como un hecho más. Si el párrafo pasa de `EXPLANATION_CAP`, primero se acorta la
 * secuencia (3, 2, 1 jugadas), luego se prueban otras variantes y, si no alcanza, se quita la cola, después
 * la intención y por último el segundo hecho. Devuelve `[]` si no hay ningún hecho que decir.
 * `fmt` pasa una jugada de notación inglesa a la del usuario; `seed` elige entre las variantes.
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
  style: BotStyle;
}): string[] {
  const { facts, fmt } = o;
  const tx = TEXTS[o.lang];
  const seed = o.seed ?? 0;
  const you = o.subject === 'you';
  const side = you ? 'you' : 'opp';
  const bad = o.quality === 'inaccuracy' || o.quality === 'mistake' || o.quality === 'blunder';
  const situation: Situation = bad ? (you ? 'allows' : 'exploit') : 'good';
  const mate: Part[] = [];
  const removeDefender: Part[] = [];
  const tactics: Part[] = [];
  const allowedTactic: Part[] = [];
  const material: Part[] = [];
  const did: Part[] = [];
  const rest: Part[] = [];
  const plan: Part[] = [];

  const fixed = (s: string): Part => () => s;
  const variant = (list: string[], salt: number, vars: (len: number) => Record<string, string> = () => ({})): Part =>
    (len, k) => fill(pick(list, seed + salt + k), { move: o.move, ...vars(len) });
  const say = (to: Part[], key: ExplKey, v: Record<string, string> = {}) => to.push(fixed(fill(tx.expl[key], { move: o.move, ...v })));
  const piece = (k: PieceKind) => tx.pieces[k];
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  const def = (k: PieceKind) => tx.pieceDef[k];
  const list = (ks: PieceKind[], table: Record<PieceKind, string>) => {
    const names = [...new Set(ks)].map((k) => table[k]);
    return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} ${tx.and} ${names[names.length - 1]}`;
  };
  const tacticVars = (t: { attacker: PieceKind; targets: PieceKind[] }) => ({ attacker: def(t.attacker), targets: list(t.targets, tx.pieceObj), targetsDef: list(t.targets, tx.pieceDef) });
  // Datos comunes de una línea del motor; `seq` muestra como mucho `len` jugadas (y nunca más de 3).
  const lineVars = (l: LineFacts) => (len: number) => ({
    first: fmt(l.sans[0]),
    finish: l.sans[2] ? fmt(l.sans[2]) : '',
    seq: l.sans.slice(0, Math.min(len, 3)).map(fmt).join(' '),
    n: String(l.material),
  });

  if (facts.mateIn) {
    const { n, mover } = facts.mateIn;
    const key: MateKey = mover ? (you ? 'foundYou' : 'foundOpp') : you ? 'allowsYou' : 'allowsOpp';
    mate.push(fixed(fill(tx.mateIn[key], { n: String(n) })));
  }
  if (facts.did) {
    const d = facts.did;
    if (d.kind === 'mate') say(mate, 'didMate');
    else if (d.kind === 'check') say(did, 'didCheck');
    else if (d.kind === 'capture') say(did, 'didCapture', { piece: piece(d.piece) });
    else say(did, 'didCastle');
  }

  // La línea del motor solo se usa en jugadas malas; la de la oportunidad perdida, solo para el error propio.
  const line = bad ? facts.line : undefined;
  const missedLine = bad && you ? facts.missedLine : undefined;
  const lineKey: LineSituation = you ? 'allows' : 'exploit';
  const rdSource: [LineFacts, LineSituation] | undefined =
    line?.removeDefender && line.sans.length >= 3
      ? [line, lineKey]
      : missedLine?.removeDefender && missedLine.sans.length >= 3
        ? [missedLine, 'missed']
        : undefined;
  if (rdSource) {
    const [l, key] = rdSource;
    const rd = l.removeDefender!;
    const vars = lineVars(l);
    removeDefender.push(
      variant(tx.line.removeDefender[key], 2, (len) => ({
        ...vars(len),
        capturer: def(rd.capturer),
        removed: def(rd.removed),
        target: def(rd.target),
        targetSq: rd.targetSq,
      })),
    );
  }

  (facts.found ?? []).forEach((t, i) => tactics.push(variant(tx.tact.found[side][t.kind], i, () => tacticVars(t))));
  if (facts.allowsTactic) {
    const { tactic, san } = facts.allowsTactic;
    allowedTactic.push(variant(tx.tact.allows[side][tactic.kind], 0, () => ({ ...tacticVars(tactic), san: fmt(san) })));
  }

  // Material de la línea del motor (el concepto de eliminar al defensor ya lo dice por su cuenta).
  if (line && !line.removeDefender && line.material >= 2) material.push(variant(tx.line.material[lineKey], 2, lineVars(line)));
  if (missedLine && !missedLine.removeDefender && missedLine.material >= 2) material.push(variant(tx.line.material.missed, 3, lineVars(missedLine)));
  // Los textos de la oportunidad perdida ya nombran la mejor jugada: no hace falta repetirla.
  const saysBest = rdSource?.[1] === 'missed' || (missedLine && missedLine.material >= 2 && !missedLine.removeDefender);

  // Con la línea del motor, su primera jugada ya dice la captura o el jaque permitidos: no se repiten.
  const a = facts.allows;
  if (a) {
    const san = fmt(a.san);
    if (a.kind === 'mate') say(rest, you ? 'allowsMateYou' : 'allowsMateOpp', { san });
    else if (!line) {
      if (a.kind === 'capture') say(rest, you ? (a.ofMoved ? 'allowsCaptureMoved' : 'allowsCaptureYou') : 'allowsCaptureOpp', { san, piece: piece(a.piece) });
      else say(rest, you ? 'allowsCheckYou' : 'allowsCheckOpp', { san });
    }
  }

  const m = facts.missed;
  if (bad && o.bestSan) {
    const best = fmt(o.bestSan);
    if (m?.kind === 'mate') say(rest, you ? 'missedMateYou' : 'missedMateOpp', { best });
    else if (m?.kind === 'capture') say(rest, you ? 'missedCaptureYou' : 'missedCaptureOpp', { best, piece: piece(m.piece) });
    else if (!saysBest) say(rest, you ? 'missedBestYou' : 'missedBestOpp', { best });
  }

  // El plan de una jugada buena es un mérito más; el de una jugada mala solo se dice como intención.
  const p = facts.plan && !facts.did && !facts.found ? facts.plan : undefined;
  const planVars = (x: NonNullable<typeof p>) => ({ piece: def(x.piece), Piece: cap(def(x.piece)), from: x.from, to: x.to });
  if (p && !bad) plan.push(fixed(fill(tx.plan[p.kind], { ...planVars(p), move: o.move })));
  const intent: Part | undefined =
    p && bad && INTENT_KINDS.includes(p.kind) ? variant(tx.intent[p.kind as IntentKind], 2, () => planVars(p)) : undefined;

  const chosen = [...mate, ...removeDefender, ...tactics, ...allowedTactic, ...material, ...did, ...rest, ...plan].slice(0, 2);
  if (chosen.length === 0) return [];

  const frame = tx.frame[o.style][situation];
  const lead: Part = variant(frame.lead, 0);
  const tail: Part | undefined = situation === 'good' ? undefined : variant((frame as { tail: string[] }).tail, 1);

  type Layout = { facts: number; intent: boolean; tail: boolean };
  // Lo que se quita primero va al final: la cola, luego la intención y por último el segundo hecho.
  const layouts: Layout[] = [{ facts: chosen.length, intent: !!intent, tail: !!tail }];
  if (tail) layouts.push({ facts: chosen.length, intent: !!intent, tail: false });
  if (intent) layouts.push({ facts: chosen.length, intent: false, tail: false });
  if (chosen.length > 1) layouts.push({ facts: 1, intent: false, tail: false });
  const render = (l: Layout, len: number, k: number) =>
    [lead(len, k), ...chosen.slice(0, l.facts).map((f) => f(len, k)), l.intent && intent ? intent(len, k) : '', l.tail && tail ? tail(len, k) : '']
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

  for (const l of layouts)
    for (let k = 0; k < VARIANT_TRIES; k++)
      for (let len = 3; len >= 1; len--) {
        const text = render(l, len, k);
        if (text.length <= EXPLANATION_CAP) return [text];
      }
  // Ni siquiera el primer hecho con una sola jugada entra: se queda el más corto, con el concepto.
  const last = layouts[layouts.length - 1];
  const shortest = Array.from({ length: VARIANT_TRIES }, (_, k) => render(last, 1, k)).reduce((x, y) => (y.length < x.length ? y : x));
  return [shortest];
}
