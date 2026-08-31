import type { Task } from '../types';

function completeTask(task: Task, at: string): Task {
  return {
    ...task,
    isCompleted: true,
    completedAt: at,
  };
}

describe('completion', () => {
  test('completed tasks keep their start and duration so the day shape stays', () => {
    const original: Task = {
      id: 't1',
      title: 'Yoga',
      notes: '',
      iconKey: 'yoga',
      colorToken: 'mint',
      date: '2026-08-31',
      startMinutesFromMidnight: 7 * 60 + 15,
      durationMinutes: 30,
      isAllDay: false,
      isCompleted: false,
      completedAt: null,
      isInbox: false,
      parentInboxId: null,
      recurrenceRule: { kind: 'none' },
      occurrenceOverrides: {},
      subtasks: [
        { id: 's1', title: 'Mat', isCompleted: false },
        { id: 's2', title: 'Breath', isCompleted: true },
      ],
      reminders: [],
      source: 'user',
      sortOffset: 0,
      timeZone: null,
      location: null,
      updatedAt: '2026-08-31T00:00:00.000Z',
    };
    const done = completeTask(original, '2026-08-31T12:00:00.000Z');
    expect(done.isCompleted).toBe(true);
    expect(done.startMinutesFromMidnight).toBe(original.startMinutesFromMidnight);
    expect(done.durationMinutes).toBe(original.durationMinutes);
    expect(done.subtasks).toHaveLength(2);
  });
});
