import { getDay } from 'date-fns';
import type { RecurrenceRule, Task, TimedOccurrence } from './types';
import { addDaysKey, parseDateKey, splitAcrossDays } from './time';

export function recurrenceAppliesToDate(rule: RecurrenceRule, seriesStart: string, date: string): boolean {
  if (rule.kind === 'none') return date === seriesStart;
  if (date < seriesStart) return false;
  const start = parseDateKey(seriesStart);
  const current = parseDateKey(date);
  const day = getDay(current);

  if (rule.kind === 'daily') return true;
  if (rule.kind === 'weekdays') return day >= 1 && day <= 5;
  if (rule.kind === 'weekly') return rule.days.includes(day);
  if (rule.kind === 'custom') {
    const diffMs = current.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
    if (rule.unit === 'day') {
      return diffDays % Math.max(1, rule.interval) === 0;
    }
    return diffDays % (Math.max(1, rule.interval) * 7) === 0 && getDay(current) === getDay(start);
  }
  return false;
}

export function isRecurring(rule: RecurrenceRule): boolean {
  return rule.kind !== 'none';
}

export function expandTasksForDate(tasks: Task[], date: string): TimedOccurrence[] {
  const occurrences: TimedOccurrence[] = [];

  for (const task of tasks) {
    if (task.isInbox) continue;

    if (isRecurring(task.recurrenceRule)) {
      if (!task.date) continue;
      if (!recurrenceAppliesToDate(task.recurrenceRule, task.date, date)) continue;
      const override = task.occurrenceOverrides[date];
      if (override?.skipped) continue;
      const start = override?.startMinutesFromMidnight ?? task.startMinutesFromMidnight;
      const duration = override?.durationMinutes ?? task.durationMinutes;
      if (start == null || duration <= 0) continue;
      const segments = splitAcrossDays(date, start, duration).filter((segment) => segment.date === date);
      for (const segment of segments) {
        occurrences.push({
          task,
          occurrenceDate: date,
          startMinutesFromMidnight: segment.startMinutesFromMidnight,
          durationMinutes: segment.durationMinutes,
          isCompleted: override?.isCompleted ?? false,
          completedAt: override?.completedAt ?? null,
          title: override?.title ?? task.title,
          isRecurring: true,
          isOverride: Boolean(override),
        });
      }
      continue;
    }

    if (!task.date || task.startMinutesFromMidnight == null) continue;
    const segments = splitAcrossDays(task.date, task.startMinutesFromMidnight, task.durationMinutes);
    for (const segment of segments) {
      if (segment.date !== date) continue;
      occurrences.push({
        task,
        occurrenceDate: date,
        startMinutesFromMidnight: segment.startMinutesFromMidnight,
        durationMinutes: segment.durationMinutes,
        isCompleted: task.isCompleted,
        completedAt: task.completedAt,
        title: task.title,
        isRecurring: false,
        isOverride: false,
      });
    }
  }

  return occurrences.sort((a, b) => a.startMinutesFromMidnight - b.startMinutesFromMidnight);
}

export function expandRange(tasks: Task[], fromDate: string, toDate: string): Record<string, TimedOccurrence[]> {
  const result: Record<string, TimedOccurrence[]> = {};
  let cursor = fromDate;
  let guard = 0;
  while (cursor <= toDate && guard < 400) {
    result[cursor] = expandTasksForDate(tasks, cursor);
    cursor = addDaysKey(cursor, 1);
    guard += 1;
  }
  return result;
}

export function allDayTasksForDate(tasks: Task[], date: string): Task[] {
  return tasks.filter((task) => {
    if (task.isInbox || !task.isAllDay) return false;
    if (isRecurring(task.recurrenceRule) && task.date) {
      return recurrenceAppliesToDate(task.recurrenceRule, task.date, date);
    }
    return task.date === date;
  });
}
