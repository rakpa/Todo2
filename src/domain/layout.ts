import type { TimelineDensity, TimedOccurrence } from './types';
import { MINUTES_PER_DAY } from './types';

export const DENSITY_PIXELS_PER_MINUTE: Record<TimelineDensity, number> = {
  compact: 1.4,
  comfortable: 2,
  roomy: 2.75,
};

export const MIN_BLOCK_HEIGHT = 52;
export const TIME_RAIL_WIDTH = 50;
export const SPINE_WIDTH = 3;
export const SPINE_GUTTER = 0;
export const CAPSULE_MAX_RADIUS = 22;

export function pixelsPerMinute(density: TimelineDensity): number {
  return DENSITY_PIXELS_PER_MINUTE[density];
}

export function yForMinutes(minutes: number, density: TimelineDensity): number {
  return Math.max(0, minutes) * pixelsPerMinute(density);
}

export function heightForDuration(durationMinutes: number, density: TimelineDensity): number {
  const raw = Math.max(1, durationMinutes) * pixelsPerMinute(density);
  return Math.max(MIN_BLOCK_HEIGHT, raw);
}

export function minutesFromY(y: number, density: TimelineDensity): number {
  return y / pixelsPerMinute(density);
}

export function dayHeight(density: TimelineDensity): number {
  return MINUTES_PER_DAY * pixelsPerMinute(density);
}

export interface PositionedBlock {
  occurrence: TimedOccurrence;
  top: number;
  height: number;
  column: number;
  columnCount: number;
  indent: number;
}

export interface GapRegion {
  startMinutes: number;
  durationMinutes: number;
  top: number;
  height: number;
}

interface EventInterval {
  occurrence: TimedOccurrence;
  start: number;
  end: number;
}

function overlaps(a: EventInterval, b: EventInterval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function capsuleRadius(height: number): number {
  return Math.min(Math.max(12, height / 2), CAPSULE_MAX_RADIUS);
}

/**
 * Concurrent blocks share width so they stay on the spine instead of covering.
 */
export function layoutDay(
  occurrences: TimedOccurrence[],
  density: TimelineDensity,
): { blocks: PositionedBlock[]; gaps: GapRegion[] } {
  const events: EventInterval[] = occurrences
    .filter((item) => !item.task.isAllDay && item.durationMinutes > 0)
    .map((occurrence) => ({
      occurrence,
      start: occurrence.startMinutesFromMidnight,
      end: occurrence.startMinutesFromMidnight + occurrence.durationMinutes,
    }))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const columnAssignments = new Map<string, number>();
  const active: EventInterval[] = [];
  let cluster: EventInterval[] = [];
  let clusterMaxCol = 0;
  const clusterWidthFor = new Map<string, number>();

  const flushCluster = () => {
    const width = clusterMaxCol + 1;
    for (const item of cluster) {
      clusterWidthFor.set(item.occurrence.task.id + item.occurrence.occurrenceDate, width);
    }
    cluster = [];
    clusterMaxCol = 0;
  };

  for (const event of events) {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i].end <= event.start) active.splice(i, 1);
    }
    if (active.length === 0 && cluster.length > 0) {
      flushCluster();
    }
    const used = new Set(active.map((item) => columnAssignments.get(item.occurrence.task.id + item.occurrence.occurrenceDate) ?? 0));
    let column = 0;
    while (used.has(column)) column += 1;
    columnAssignments.set(event.occurrence.task.id + event.occurrence.occurrenceDate, column);
    active.push(event);
    cluster.push(event);
    clusterMaxCol = Math.max(clusterMaxCol, column);
  }
  if (cluster.length > 0) flushCluster();

  const blocks: PositionedBlock[] = events.map((event) => {
    const key = event.occurrence.task.id + event.occurrence.occurrenceDate;
    const column = columnAssignments.get(key) ?? 0;
    const columnCount = clusterWidthFor.get(key) ?? 1;
    return {
      occurrence: event.occurrence,
      top: yForMinutes(event.start, density),
      height: heightForDuration(event.occurrence.durationMinutes, density),
      column,
      columnCount,
      indent: column * 10,
    };
  });

  const gaps: GapRegion[] = [];
  let cursor = 0;
  const sorted = [...events].sort((a, b) => a.start - b.start);
  for (const event of sorted) {
    if (event.start - cursor >= 30) {
      const duration = event.start - cursor;
      gaps.push({
        startMinutes: cursor,
        durationMinutes: duration,
        top: yForMinutes(cursor, density),
        height: yForMinutes(duration, density),
      });
    }
    cursor = Math.max(cursor, event.end);
  }
  if (MINUTES_PER_DAY - cursor >= 45) {
    const duration = MINUTES_PER_DAY - cursor;
    gaps.push({
      startMinutes: cursor,
      durationMinutes: duration,
      top: yForMinutes(cursor, density),
      height: yForMinutes(duration, density),
    });
  }

  // Keep a reference so overlap helper stays available for tests.
  void overlaps;

  return { blocks, gaps };
}

export function tickMinutes(): number {
  return 60;
}

export function timeTicks(_density?: TimelineDensity): number[] {
  const step = tickMinutes();
  const ticks: number[] = [];
  for (let minute = 0; minute < MINUTES_PER_DAY; minute += step) {
    ticks.push(minute);
  }
  return ticks;
}
