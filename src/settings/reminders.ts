import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';

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

/**
 * Programa el recordatorio todos los días a `hour`:00. Pide permiso si hace falta.
 * Devuelve false si el usuario no dio permiso.
 */
export async function scheduleDailyReminder(hour: number): Promise<boolean> {
  if (Platform.OS === 'android') {
    // En Android, sin un canal creado no aparece el pedido de permiso.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorio diario',
      importance: AndroidImportance.DEFAULT,
    });
  }
  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;

  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora de practicar ajedrez',
      body: 'Una lección o un puzzle corto alcanza para mantener la racha.',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: CHANNEL_ID },
  });
  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
