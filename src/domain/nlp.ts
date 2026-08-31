import type { RecurrenceRule } from './types';
import { assertPositiveDuration, clampMinutes, nextQuarterHour } from './time';

export interface ParsedScheduleHint {
  title: string;
  startMinutesFromMidnight?: number;
  durationMinutes?: number;
  recurrenceRule?: RecurrenceRule;
  dateOffsetDays?: number;
}

const DURATION_PATTERNS: Array<{ regex: RegExp; minutes: (match: RegExpMatchArray) => number }> = [
  { regex: /\b(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr|h)\b/i, minutes: (m) => Math.round(parseFloat(m[1]) * 60) },
  { regex: /\b(\d+)\s*(?:minutes|minute|mins|min|m)\b/i, minutes: (m) => parseInt(m[1], 10) },
  { regex: /\b(\d+)\s*h(?:ours?)?\s*(\d+)\s*m/i, minutes: (m) => parseInt(m[1], 10) * 60 + parseInt(m[2], 10) },
];

const TIME_PATTERNS: RegExp[] = [
  /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
  /\b(\d{1,2})(?::(\d{2}))\s*(am|pm)\b/i,
  /\b(\d{1,2})\s*(am|pm)\b/i,
];

function parseClock(hourRaw: string, minuteRaw: string | undefined, periodRaw: string | undefined): number {
  let hour = parseInt(hourRaw, 10);
  const minute = minuteRaw ? parseInt(minuteRaw, 10) : 0;
  const period = periodRaw?.toLowerCase();
  if (period === 'pm' && hour < 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;
  if (!period && hour === 24) hour = 0;
  return clampMinutes(hour * 60 + minute);
}

export function parseNaturalLanguage(
  input: string,
  nowMinutes: number = nextQuarterHour(8 * 60),
): ParsedScheduleHint {
  let remaining = input.trim();
  const result: ParsedScheduleHint = { title: remaining };

  for (const pattern of DURATION_PATTERNS) {
    const match = remaining.match(pattern.regex);
    if (match) {
      try {
        result.durationMinutes = assertPositiveDuration(pattern.minutes(match));
        remaining = remaining.replace(match[0], ' ');
        break;
      } catch {
        break;
      }
    }
  }

  for (const pattern of TIME_PATTERNS) {
    const match = remaining.match(pattern);
    if (match) {
      if (match[3] || match[2]) {
        result.startMinutesFromMidnight = parseClock(match[1], match[2], match[3]);
      } else if (match[2] && /am|pm/i.test(match[2])) {
        result.startMinutesFromMidnight = parseClock(match[1], undefined, match[2]);
      } else {
        result.startMinutesFromMidnight = parseClock(match[1], match[2], match[3]);
      }
      remaining = remaining.replace(match[0], ' ');
      break;
    }
  }

  if (/\bevery weekday|weekdays\b/i.test(remaining)) {
    result.recurrenceRule = { kind: 'weekdays' };
    remaining = remaining.replace(/\bevery weekday|weekdays\b/gi, ' ');
  } else if (/\bdaily|every day\b/i.test(remaining)) {
    result.recurrenceRule = { kind: 'daily' };
    remaining = remaining.replace(/\bdaily|every day\b/gi, ' ');
  } else if (/\bweekly\b/i.test(remaining)) {
    result.recurrenceRule = { kind: 'weekly', days: [] };
    remaining = remaining.replace(/\bweekly\b/gi, ' ');
  }

  if (/\btomorrow\b/i.test(remaining)) {
    result.dateOffsetDays = 1;
    remaining = remaining.replace(/\btomorrow\b/gi, ' ');
  }

  result.title = remaining.replace(/\s+/g, ' ').trim() || input.trim();
  if (!result.startMinutesFromMidnight && /now/i.test(input)) {
    result.startMinutesFromMidnight = nowMinutes;
  }
  return result;
}
