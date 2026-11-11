import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import type { Bot } from '../data/bots';
import type { Streak } from '../progress/streak';
import { planReminders } from './reminderPlan';
import type { ReminderSupport } from './reminderSupport';
import { createSerializer } from './serialize';

// Recordatorio diario (notificación local; funciona en Expo Go). Ajustes > Recordatorio diario.

/** En el celular hay notificaciones locales; en la web (reminders.web.ts) se usa Web Push. */
export const REMINDER_SUPPORT: ReminderSupport = 'supported';
export const REMINDERS_SUPPORTED = REMINDER_SUPPORT === 'supported';

const CHANNEL_ID = 'recordatorio';

// Programar y cancelar pasan por una sola cola: dos operaciones nunca se pisan.
const enqueue = createSerializer();

// Con la app abierta, el recordatorio también se muestra.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureChannel(channelName: string): Promise<void> {
  if (Platform.OS === 'android') {
    // En Android, sin un canal creado no aparece el pedido de permiso.
    // Si crear el canal falla (en Expo Go con Android 15, setNotificationChannelAsync lanza una
    // NullPointerException nativa), no es fatal: sin el canal propio, expo-notifications publica el
    // aviso en su canal de respaldo. El recordatorio no debe quedar bloqueado por esto.
    try {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: channelName,
        importance: AndroidImportance.DEFAULT,
      });
    } catch {
      // Se sigue sin canal propio.
    }
  }
}

/** Pide permiso de notificaciones si hace falta. Devuelve false si el usuario no lo dio. */
export async function ensureReminderPermission(channelName: string): Promise<boolean> {
  await ensureChannel(channelName);
  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
  return granted;
}

/** En el celular las notificaciones locales siempre están disponibles: el permiso se pide al activar. */
export async function reminderIsUsable(): Promise<boolean> {
  return true;
}

/**
 * Reprograma los avisos de los próximos días según la racha. Cancela todo primero, lo que también
 * borra el aviso diario fijo de versiones anteriores. Sin permiso, no programa nada.
 * Los textos llegan ya en el idioma elegido: `bots` traducidos y el nombre del canal.
 */
export function syncReminders(s: Streak, hour: number, bots: Bot[], channelName: string): Promise<void> {
  return enqueue(() => doSync(s, hour, bots, channelName));
}

async function doSync(s: Streak, hour: number, bots: Bot[], channelName: string): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  await ensureChannel(channelName);
  for (const r of planReminders(s, hour, new Date(), bots)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.date, channelId: CHANNEL_ID },
    });
  }
}

export function cancelDailyReminder(): Promise<void> {
  return enqueue(() => Notifications.cancelAllScheduledNotificationsAsync());
}
