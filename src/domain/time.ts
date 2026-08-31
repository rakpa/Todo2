import {
  addDays,
  format,
  parseISO,
  startOfWeek as dfStartOfWeek,
  getDay,
  isValid,
} from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import {
  MINUTES_PER_DAY,
  type SnapGridMinutes,
  type TimeFormat,
  type WeekStart,
} from './types';

export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function nowInZone(timeZone: string = getDeviceTimeZone()): Date {
  return toZonedTime(new Date(), timeZone);
}

export function dateKey(date: Date, timeZone: string = getDeviceTimeZone()): string {
  return formatInTimeZone(fromZonedTime(date, timeZone), timeZone, 'yyyy-MM-dd');
}

export function todayKey(timeZone: string = getDeviceTimeZone()): string {
  return formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');
}

export function parseDateKey(key: string): Date {
  const parsed = parseISO(`${key}T12:00:00`);
  if (!isValid(parsed)) {
    return new Date();
  }
  return parsed;
}

export function addDaysKey(key: string, amount: number): string {
  return format(addDays(parseDateKey(key), amount), 'yyyy-MM-dd');
}

export function minutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function nowMinutesFromMidnight(timeZone: string = getDeviceTimeZone()): number {
  const zoned = nowInZone(timeZone);
  return zoned.getHours() * 60 + zoned.getMinutes();
}

export function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MINUTES_PER_DAY - 1, Math.max(0, Math.round(value)));
}

export function snapToGrid(minutes: number, grid: SnapGridMinutes): number {
  const safeGrid = grid > 0 ? grid : 15;
  return clampMinutes(Math.round(minutes / safeGrid) * safeGrid);
}

export function nextQuarterHour(fromMinutes: number): number {
  const snapped = Math.ceil(fromMinutes / 15) * 15;
  if (snapped >= MINUTES_PER_DAY) return MINUTES_PER_DAY - 15;
  return snapped;
}

export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  if (safe < 60) return `${safe} min`;
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (rest === 0) {
    return hours === 1 ? '1 hr' : `${hours} hr`;
  }
  const hourLabel = hours === 1 ? '1 hr' : `${hours} hr`;
  return `${hourLabel} ${rest} min`;
}

export function formatRemaining(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  if (safe <= 0) return 'Done';
  return `${formatDuration(safe)} remaining`;
}

export function formatClock(minutes: number, timeFormat: TimeFormat): string {
  const clamped = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours24 = Math.floor(clamped / 60);
  const mins = clamped % 60;
  const mm = mins.toString().padStart(2, '0');
  if (timeFormat === 'h24') {
    return `${hours24.toString().padStart(2, '0')}:${mm}`;
  }
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${mm} ${period}`;
}

export function formatTimeRange(
  startMinutes: number,
  durationMinutes: number,
  timeFormat: TimeFormat,
): string {
  const end = startMinutes + durationMinutes;
  const startLabel = formatClock(startMinutes, timeFormat);
  const endLabel = formatClock(end, timeFormat);
  return `${startLabel}–${endLabel} (${formatDuration(durationMinutes)})`;
}

export function formatMonthYear(dateKeyValue: string): string {
  return format(parseDateKey(dateKeyValue), 'MMMM yyyy');
}

export function formatFriendlyDate(dateKeyValue: string): string {
  return format(parseDateKey(dateKeyValue), 'EEEE, MMMM d');
}

export function weekdayIndex(dateKeyValue: string): number {
  return getDay(parseDateKey(dateKeyValue));
}

export function startOfWeekKey(dateKeyValue: string, weekStart: WeekStart): string {
  const start = dfStartOfWeek(parseDateKey(dateKeyValue), { weekStartsOn: weekStart });
  return format(start, 'yyyy-MM-dd');
}

export function weekDateKeys(dateKeyValue: string, weekStart: WeekStart): string[] {
  const start = startOfWeekKey(dateKeyValue, weekStart);
  return Array.from({ length: 7 }, (_, index) => addDaysKey(start, index));
}

export function weekdayLabels(weekStart: WeekStart): string[] {
  const sunFirst = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (weekStart === 0) return sunFirst;
  return [...sunFirst.slice(1), sunFirst[0]];
}

export interface DaySegment {
  date: string;
  startMinutesFromMidnight: number;
  durationMinutes: number;
  continuesFromPrev: boolean;
  continuesToNext: boolean;
}

export function splitAcrossDays(
  date: string,
  startMinutes: number,
  durationMinutes: number,
): DaySegment[] {
  if (durationMinutes <= 0) return [];
  const segments: DaySegment[] = [];
  let remaining = durationMinutes;
  let currentDate = date;
  let currentStart = clampMinutes(startMinutes);
  let guard = 0;
  while (remaining > 0 && guard < 14) {
    const room = MINUTES_PER_DAY - currentStart;
    const take = Math.min(room, remaining);
    segments.push({
      date: currentDate,
      startMinutesFromMidnight: currentStart,
      durationMinutes: take,
      continuesFromPrev: guard > 0,
      continuesToNext: remaining - take > 0,
    });
    remaining -= take;
    currentDate = addDaysKey(currentDate, 1);
    currentStart = 0;
    guard += 1;
  }
  return segments;
}

export interface TimedLike {
  startMinutesFromMidnight: number | null;
  durationMinutes: number;
  isAllDay?: boolean;
  isInbox?: boolean;
}

export function nextFreeSlot(
  items: TimedLike[],
  fromMinutes: number,
  durationMinutes: number,
  dayEnd = MINUTES_PER_DAY,
): number {
  const duration = Math.max(1, durationMinutes);
  const busy = items
    .filter(
      (item) =>
        !item.isInbox &&
        !item.isAllDay &&
        item.startMinutesFromMidnight != null,
    )
    .map((item) => {
      const start = item.startMinutesFromMidnight as number;
      return { start, end: start + Math.max(1, item.durationMinutes) };
    })
    .sort((a, b) => a.start - b.start);

  let cursor = Math.max(0, fromMinutes);
  for (const block of busy) {
    if (block.end <= cursor) continue;
    if (block.start >= cursor + duration) {
      return clampMinutes(cursor);
    }
    cursor = Math.max(cursor, block.end);
  }
  if (cursor + duration <= dayEnd) return clampMinutes(cursor);
  return clampMinutes(Math.max(0, dayEnd - duration));
}

export function assertPositiveDuration(durationMinutes: number): number {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error('Duration must be greater than zero.');
  }
  return Math.round(durationMinutes);
}

export function sanitizeTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed.length === 0 ? 'Untitled block' : trimmed;
}
