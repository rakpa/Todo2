import type { TimedOccurrence } from './types';
import { MINUTES_PER_DAY } from './types';
import { nextFreeSlot } from './time';

export interface ReplanMove {
  taskId: string;
  title: string;
  fromDate: string;
  fromStart: number;
  toDate: string;
  toStart: number;
  durationMinutes: number;
}

export interface ReplanDraft {
  moves: ReplanMove[];
  leftover: ReplanMove[];
}

export function collectOverdueIncomplete(
  occurrences: TimedOccurrence[],
  nowMinutes: number,
  today: string,
): TimedOccurrence[] {
  return occurrences.filter((item) => {
    if (item.isCompleted) return false;
    if (item.occurrenceDate < today) return true;
    if (item.occurrenceDate > today) return false;
    return item.startMinutesFromMidnight + item.durationMinutes <= nowMinutes;
  });
}

function toMove(item: TimedOccurrence, toDate: string, toStart: number): ReplanMove {
  return {
    taskId: item.task.id,
    title: item.title,
    fromDate: item.occurrenceDate,
    fromStart: item.startMinutesFromMidnight,
    toDate,
    toStart,
    durationMinutes: item.durationMinutes,
  };
}

export function packIntoGaps(
  overdue: TimedOccurrence[],
  occupying: Array<{ startMinutesFromMidnight: number | null; durationMinutes: number }>,
  fromMinutes: number,
  targetDate: string,
  dayEnd = MINUTES_PER_DAY,
): ReplanDraft {
  const moves: ReplanMove[] = [];
  const leftover: ReplanMove[] = [];
  const busy = occupying.map((item) => ({
    startMinutesFromMidnight: item.startMinutesFromMidnight,
    durationMinutes: item.durationMinutes,
  }));

  const overlapsBusy = (start: number, duration: number) =>
    busy.some((block) => {
      if (block.startMinutesFromMidnight == null) return false;
      const end = start + duration;
      const blockEnd = block.startMinutesFromMidnight + block.durationMinutes;
      return start < blockEnd && block.startMinutesFromMidnight < end;
    });

  let cursor = fromMinutes;
  for (const item of overdue) {
    const start = nextFreeSlot(busy, cursor, item.durationMinutes, dayEnd);
    const fits =
      start >= fromMinutes - 1 &&
      start + item.durationMinutes <= dayEnd &&
      !overlapsBusy(start, item.durationMinutes);
    if (!fits) {
      leftover.push(toMove(item, targetDate, start));
      continue;
    }
    moves.push(toMove(item, targetDate, start));
    busy.push({ startMinutesFromMidnight: start, durationMinutes: item.durationMinutes });
    cursor = start + item.durationMinutes;
  }

  return { moves, leftover };
}

export function replanOverdue(options: {
  overdue: TimedOccurrence[];
  remainingToday: Array<{ startMinutesFromMidnight: number | null; durationMinutes: number }>;
  nowMinutes: number;
  today: string;
  tomorrow: string;
}): ReplanDraft {
  const todayPack = packIntoGaps(
    options.overdue,
    options.remainingToday,
    options.nowMinutes,
    options.today,
  );
  if (todayPack.leftover.length === 0) return todayPack;

  const leftoverIds = new Set(todayPack.leftover.map((move) => move.taskId));
  const leftoverOcc = options.overdue.filter((item) => leftoverIds.has(item.task.id));
  const tomorrowPack = packIntoGaps(leftoverOcc, [], 8 * 60, options.tomorrow);

  return {
    moves: [...todayPack.moves, ...tomorrowPack.moves],
    leftover: tomorrowPack.leftover,
  };
}
