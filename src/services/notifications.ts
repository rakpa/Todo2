import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Task } from '../domain/types';
import { formatClock } from '../domain/time';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Notifications are unavailable in some test/web environments.
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

function fireDate(date: string, minutes: number): Date {
  const [year, month, day] = date.split('-').map((part) => parseInt(part, 10));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return new Date(year, month - 1, day, hours, mins, 0, 0);
}

export async function scheduleTaskNotifications(task: Task, timeFormat: 'h12' | 'h24'): Promise<void> {
  if (Platform.OS === 'web' || task.isInbox || !task.date || task.startMinutesFromMidnight == null) return;
  for (const reminder of task.reminders) {
    if (reminder.kind === 'off') continue;
    const offset = reminder.kind === 'minutes_before' ? reminder.minutesBefore ?? 10 : 0;
    const when = fireDate(task.date, task.startMinutesFromMidnight - offset);
    if (when.getTime() <= Date.now()) continue;
    const start = formatClock(task.startMinutesFromMidnight, timeFormat);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: task.title,
        body: offset > 0 ? `Starts in ${offset} min · ${start}` : `Starting now · ${start}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
      },
    });
  }
}

export async function scheduleFocusTicker(title: string, remainingSeconds: number): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Focus · ${title}`,
      body: remainingSeconds > 0 ? 'Timer running' : 'Focus session complete',
      sticky: remainingSeconds > 0,
    },
    trigger: null,
  });
}
