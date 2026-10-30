import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import type { Streak } from '../progress/streak';
import { planReminders } from './reminderPlan';

// Recordatorio diario (notificación local; funciona en Expo Go). Ajustes > Recordatorio diario.

const CHANNEL_ID = 'recordatorio';

// Con la app abierta, el recordatorio también se muestra.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    // En Android, sin un canal creado no aparece el pedido de permiso.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorio diario',
      importance: AndroidImportance.DEFAULT,
    });
  }
}

/** Pide permiso de notificaciones si hace falta. Devuelve false si el usuario no lo dio. */
export async function ensureReminderPermission(): Promise<boolean> {
  await ensureChannel();
  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
  return granted;
}

/**
 * Reprograma los avisos de los próximos días según la racha. Cancela todo primero, lo que también
 * borra el aviso diario fijo de versiones anteriores. Sin permiso, no programa nada.
 */
export async function syncReminders(s: Streak, hour: number): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  await ensureChannel();
  for (const r of planReminders(s, hour, new Date())) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.date, channelId: CHANNEL_ID },
    });
  }
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
