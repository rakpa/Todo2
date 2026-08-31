import {
  assertPositiveDuration,
  clampMinutes,
  formatDuration,
  formatTimeRange,
  nextFreeSlot,
  nextQuarterHour,
  snapToGrid,
  splitAcrossDays,
  todayKey,
  weekDateKeys,
} from '../time';

describe('time math', () => {
  test('rejects zero and negative duration', () => {
    expect(() => assertPositiveDuration(0)).toThrow(/greater than zero/);
    expect(() => assertPositiveDuration(-15)).toThrow(/greater than zero/);
    expect(assertPositiveDuration(45)).toBe(45);
  });

  test('snaps to 5/10/15 minute grids', () => {
    expect(snapToGrid(8, 5)).toBe(10);
    expect(snapToGrid(12, 10)).toBe(10);
    expect(snapToGrid(22, 15)).toBe(15);
    expect(snapToGrid(7, 15)).toBe(0);
  });

  test('next quarter-hour never returns midnight wrap as 1440', () => {
    expect(nextQuarterHour(0)).toBe(0);
    expect(nextQuarterHour(1)).toBe(15);
    expect(nextQuarterHour(1439)).toBe(1425);
  });

  test('formats 12-hour ranges with duration', () => {
    expect(formatTimeRange(7 * 60, 15, 'h12')).toBe('7:00 AM–7:15 AM (15 min)');
    expect(formatDuration(120)).toBe('2 hr');
  });

  test('formats 24-hour clocks', () => {
    expect(formatTimeRange(13 * 60 + 30, 45, 'h24')).toContain('13:30–14:15');
  });

  test('splits overnight tasks across midnight', () => {
    const segments = splitAcrossDays('2026-08-31', 23 * 60, 90);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ date: '2026-08-31', durationMinutes: 60 });
    expect(segments[1]).toMatchObject({ date: '2026-09-01', startMinutesFromMidnight: 0, durationMinutes: 30 });
  });

  test('finds the next free slot after busy blocks', () => {
    const slot = nextFreeSlot(
      [
        { startMinutesFromMidnight: 9 * 60, durationMinutes: 60 },
        { startMinutesFromMidnight: 11 * 60, durationMinutes: 30 },
      ],
      9 * 60,
      45,
    );
    expect(slot).toBe(10 * 60);
  });

  test('week keys honor Monday start', () => {
    const keys = weekDateKeys('2026-09-02', 1);
    expect(keys[0]).toBe('2026-08-31');
    expect(keys[6]).toBe('2026-09-06');
  });

  test('clamp handles NaN and DST-safe minute math', () => {
    expect(clampMinutes(Number.NaN)).toBe(0);
    expect(clampMinutes(2000)).toBe(1439);
  });

  test('todayKey is a calendar date', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
