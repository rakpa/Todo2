import { collectOverdueIncomplete, replanOverdue } from '../replan';
import type { Task, TimedOccurrence } from '../types';

function occ(id: string, date: string, start: number, duration: number, completed = false): TimedOccurrence {
  return {
    task: { id } as Task,
    occurrenceDate: date,
    startMinutesFromMidnight: start,
    durationMinutes: duration,
    isCompleted: completed,
    completedAt: null,
    title: id,
    isRecurring: false,
    isOverride: false,
  };
}

describe('replan gap filling', () => {
  test('collects incomplete blocks whose end is in the past', () => {
    const overdue = collectOverdueIncomplete(
      [
        occ('done', '2026-08-31', 8 * 60, 30, true),
        occ('late', '2026-08-31', 8 * 60, 30, false),
        occ('later', '2026-08-31', 18 * 60, 30, false),
      ],
      10 * 60,
      '2026-08-31',
    );
    expect(overdue.map((item) => item.title)).toEqual(['late']);
  });

  test('shifts overdue work into remaining gaps, then tomorrow', () => {
    const overdue = [
      occ('a', '2026-08-31', 8 * 60, 30),
      occ('b', '2026-08-31', 8 * 60 + 30, 180),
    ];
    const draft = replanOverdue({
      overdue,
      remainingToday: [{ startMinutesFromMidnight: 13 * 60 + 30, durationMinutes: 10 * 60 }],
      nowMinutes: 13 * 60,
      today: '2026-08-31',
      tomorrow: '2026-09-01',
    });
    expect(draft.moves.length).toBeGreaterThan(0);
    expect(draft.moves[0].toDate).toBe('2026-08-31');
    expect(draft.moves[0].toStart).toBeGreaterThanOrEqual(13 * 60);
    const tomorrowMoves = draft.moves.filter((move) => move.toDate === '2026-09-01');
    expect(tomorrowMoves.length).toBeGreaterThan(0);
  });
});
