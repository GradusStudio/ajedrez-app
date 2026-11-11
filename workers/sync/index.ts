import { createD1Store } from './d1Store';
import { handle } from './handler';
import { createD1ReminderStore, type D1Like } from '../reminders/d1Store';
import { handleReminders, type ReminderLimiter } from '../reminders/handler';
import { createPushSender } from '../reminders/push';
import { sendDueReminders } from '../reminders/scheduler';

export type Env = {
  DB: D1Like;
  CREATE_LIMITER?: ReminderLimiter;
  VAPID_SUBJECT: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
};

type ScheduledEvent = { scheduledTime: number };
type ScheduledContext = { waitUntil(promise: Promise<unknown>): void };

export default {
  fetch: (req: Request, env: Env) => {
    // Los recordatorios se atienden antes que el handler de sincronización, que responde 404 a cualquier otra ruta.
    if (new URL(req.url).pathname.startsWith('/v1/reminders')) {
      return handleReminders(req, createD1ReminderStore(env.DB), undefined, env.CREATE_LIMITER);
    }
    return handle(req, createD1Store(env.DB), undefined, env.CREATE_LIMITER);
  },
  scheduled: (event: ScheduledEvent, env: Env, ctx: ScheduledContext) =>
    ctx.waitUntil(
      sendDueReminders(createD1ReminderStore(env.DB), createPushSender(fetch, env), new Date(event.scheduledTime)).then(
        ({ sent, gone, dropped }) => {
          // Solo los contadores: ni los avisos ni las suscripciones van a los logs.
          console.log('reminders: envío programado', { sent, gone, dropped });
        }
      )
    ),
};
