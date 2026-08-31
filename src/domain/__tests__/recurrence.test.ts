import { expandTasksForDate, recurrenceAppliesToDate } from '../recurrence';
import type { Task } from '../types';

function task(partial: Partial<Task> & Pick<Task, 'id'>): Task {
  return {
    title: 'Deep work',
    notes: '',
    iconKey: 'laptop',
    colorToken: 'sage',
    date: '2026-08-31',
    startMinutesFromMidnight: 9 * 60,
    durationMinutes: 60,
    isAllDay: false,
    isCompleted: false,
    completedAt: null,
    isInbox: false,
    parentInboxId: null,
    recurrenceRule: { kind: 'none' },
    occurrenceOverrides: {},
    subtasks: [],
    reminders: [],
    source: 'user',
    sortOffset: 0,
    timeZone: null,
    location: null,
    updatedAt: '2026-08-31T00:00:00.000Z',
    ...partial,
  };
}

describe('recurrence expansion', () => {
  test('weekdays rule skips Saturday', () => {
    expect(recurrenceAppliesToDate({ kind: 'weekdays' }, '2026-08-31', '2026-08-31')).toBe(true);
    expect(recurrenceAppliesToDate({ kind: 'weekdays' }, '2026-08-31', '2026-09-05')).toBe(false);
  });

  test('daily series appears on later days and honors skipped overrides', () => {
    const series = task({
      id: 'series',
      recurrenceRule: { kind: 'daily' },
      occurrenceOverrides: { '2026-09-01': { skipped: true } },
    });
    expect(expandTasksForDate([series], '2026-08-31')).toHaveLength(1);
    expect(expandTasksForDate([series], '2026-09-01')).toHaveLength(0);
    expect(expandTasksForDate([series], '2026-09-02')[0]?.isRecurring).toBe(true);
  });

  test('overnight task paints the next morning', () => {
    const overnight = task({
      id: 'night',
      startMinutesFromMidnight: 23 * 60 + 30,
      durationMinutes: 90,
    });
    const next = expandTasksForDate([overnight], '2026-09-01');
    expect(next).toHaveLength(1);
    expect(next[0].startMinutesFromMidnight).toBe(0);
    expect(next[0].durationMinutes).toBe(60);
  });
});
