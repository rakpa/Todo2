import { capsuleRadius, heightForDuration, layoutDay, timeTicks, yForMinutes } from '../layout';
import type { Task, TimedOccurrence } from '../types';

function occ(partial: Partial<TimedOccurrence> & { start: number; duration: number; id: string }): TimedOccurrence {
  const task = {
    id: partial.id,
    title: partial.title ?? partial.id,
    isAllDay: false,
  } as Task;
  return {
    task,
    occurrenceDate: '2026-08-31',
    startMinutesFromMidnight: partial.start,
    durationMinutes: partial.duration,
    isCompleted: false,
    completedAt: null,
    title: task.title,
    isRecurring: false,
    isOverride: false,
  };
}

describe('timeline layout', () => {
  test('height is proportional to duration with a tap-target floor', () => {
    const short = heightForDuration(15, 'comfortable');
    const long = heightForDuration(120, 'comfortable');
    expect(long).toBeGreaterThan(short * 3);
    expect(short).toBeGreaterThanOrEqual(52);
  });

  test('y position is deterministic from start + zoom', () => {
    expect(yForMinutes(60, 'compact')).toBe(60 * 1.4);
    expect(yForMinutes(60, 'comfortable')).toBe(60 * 2);
    expect(yForMinutes(60, 'roomy')).toBe(60 * 2.75);
  });

  test('hour rail is hourly, not a calendar grid of 15/30 minute ticks', () => {
    expect(timeTicks('comfortable')).toEqual(timeTicks('compact'));
    expect(timeTicks('comfortable')[0]).toBe(0);
    expect(timeTicks('comfortable')[1]).toBe(60);
    expect(timeTicks('comfortable')).toHaveLength(24);
  });

  test('short blocks are pills and tall blocks keep a capsule radius', () => {
    expect(capsuleRadius(52)).toBe(22);
    expect(capsuleRadius(240)).toBe(22);
    expect(capsuleRadius(20)).toBe(12);
  });

  test('overlapping blocks get separate columns instead of covering', () => {
    const { blocks } = layoutDay(
      [
        occ({ id: 'a', start: 9 * 60, duration: 60 }),
        occ({ id: 'b', start: 9 * 60 + 15, duration: 60 }),
      ],
      'comfortable',
    );
    const columns = new Set(blocks.map((block) => block.column));
    expect(columns.size).toBe(2);
    expect(blocks.every((block) => block.columnCount === 2)).toBe(true);
  });

  test('large empty gaps are visible regions', () => {
    const { gaps } = layoutDay([occ({ id: 'a', start: 10 * 60, duration: 30 })], 'comfortable');
    expect(gaps.some((gap) => gap.durationMinutes >= 30)).toBe(true);
  });
});
