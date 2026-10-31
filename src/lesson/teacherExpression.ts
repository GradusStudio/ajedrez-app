import type { BotExpression } from '../components/botFace';
import type { Step } from '../data/lessonTypes';

// Cara del profesor según lo que pasa en el paso (sin React Native, para poder probarla con npm test).
export function teacherExpression(stepType: Step['type'], status: 'idle' | 'correct' | 'wrong', guided: boolean): BotExpression {
  if (status === 'correct') return 'acierto';
  if (status === 'wrong') return 'pista';
  return stepType === 'explain' || guided ? 'explica' : 'piensa';
}
