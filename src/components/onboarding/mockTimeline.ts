import type { Task, TimedOccurrence } from '../../domain/types';

function mockTask(partial: Partial<Task> & Pick<Task, 'id' | 'title' | 'colorToken' | 'iconKey'>): Task {
  return {
    notes: '',
    date: '2026-08-31',
    startMinutesFromMidnight: 8 * 60,
    durationMinutes: 30,
    isAllDay: false,
    isCompleted: false,
    completedAt: null,
    isInbox: false,
    parentInboxId: null,
    recurrenceRule: { kind: 'none' },
    occurrenceOverrides: {},
    subtasks: [],
    reminders: [],
    source: 'sample',
    sortOffset: 0,
    timeZone: null,
    location: null,
    updatedAt: '2026-08-31T00:00:00.000Z',
    ...partial,
  };
}

export function mockTimelineOccurrences(): TimedOccurrence[] {
  const specs: Array<[string, string, string, number, number, boolean]> = [
    ['wake', 'Wake up', 'alarm', 7 * 60, 15, true],
    ['yoga', 'Yoga', 'yoga', 7 * 60 + 20, 30, false],
    ['deep', 'Deep work', 'laptop', 9 * 60, 120, false],
    ['lunch', 'Lunch', 'meal', 12 * 60, 45, false],
  ];
  return specs.map(([id, title, icon, start, duration, done]) => {
    const token =
      icon === 'alarm' ? 'apricot' : icon === 'yoga' ? 'mint' : icon === 'laptop' ? 'sage' : 'sand';
    const task = mockTask({
      id,
      title,
      iconKey: icon,
      colorToken: token as Task['colorToken'],
      startMinutesFromMidnight: start,
      durationMinutes: duration,
      isCompleted: done,
      recurrenceRule: icon === 'alarm' ? { kind: 'daily' } : { kind: 'none' },
      subtasks: icon === 'laptop' ? [{ id: 's1', title: 'Outline', isCompleted: false }, { id: 's2', title: 'Draft', isCompleted: false }] : [],
    });
    return {
      task,
      occurrenceDate: '2026-08-31',
      startMinutesFromMidnight: start,
      durationMinutes: duration,
      isCompleted: done,
      completedAt: done ? '2026-08-31T12:00:00.000Z' : null,
      title,
      isRecurring: task.recurrenceRule.kind !== 'none',
      isOverride: false,
    };
  });
}
