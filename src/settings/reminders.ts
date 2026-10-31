import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import type { Bot } from '../data/bots';
import type { Streak } from '../progress/streak';
import { planReminders } from './reminderPlan';
import { createSerializer } from './serialize';

// Recordatorio diario (notificación local; funciona en Expo Go). Ajustes > Recordatorio diario.

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
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: channelName,
      importance: AndroidImportance.DEFAULT,
    });
  }
}

/** Pide permiso de notificaciones si hace falta. Devuelve false si el usuario no lo dio. */
export async function ensureReminderPermission(channelName: string): Promise<boolean> {
  await ensureChannel(channelName);
  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
  return granted;
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
