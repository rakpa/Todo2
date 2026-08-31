import type { CreateTaskInput, TimedOccurrence } from './types';
import { suggestColorToken } from './colorTokens';
import { suggestIcon } from './icons';
import { parseNaturalLanguage } from './nlp';
import { nextFreeSlot, nextQuarterHour } from './time';

export interface PlannerDraftItem extends CreateTaskInput {
  reason: string;
}

export interface PlannerService {
  plan(prompt: string, context: PlannerContext): Promise<PlannerDraftItem[]>;
}

export interface PlannerContext {
  date: string;
  nowMinutes: number;
  existing: TimedOccurrence[];
  unfinishedTitles: string[];
}

function occupying(existing: TimedOccurrence[]) {
  return existing.map((item) => ({
    startMinutesFromMidnight: item.startMinutesFromMidnight,
    durationMinutes: item.durationMinutes,
  }));
}

function block(
  title: string,
  date: string,
  start: number,
  duration: number,
  reason: string,
): PlannerDraftItem {
  return {
    title,
    date,
    startMinutesFromMidnight: start,
    durationMinutes: duration,
    isInbox: false,
    iconKey: suggestIcon(title),
    colorToken: suggestColorToken(title),
    source: 'ai',
    reason,
  };
}

export class HeuristicPlanner implements PlannerService {
  async plan(prompt: string, context: PlannerContext): Promise<PlannerDraftItem[]> {
    const text = prompt.trim().toLowerCase();
    if (text.includes('unfinished') || text.includes('tomorrow') && text.includes('reschedule')) {
      return context.unfinishedTitles.map((title, index) =>
        block(title, context.date, 9 * 60 + index * 60, 45, 'Moved unfinished work into an open slot.'),
      );
    }
    if (text.includes('deep') || text.includes('morning')) {
      return [
        block('Deep work', context.date, 9 * 60, 120, 'Protected morning focus block.'),
        block('Short break', context.date, 11 * 60, 15, 'Breathing room after focus.'),
      ];
    }
    const lines = prompt
      .split(/\n|,|;/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length > 1) {
      const busy = occupying(context.existing);
      let cursor = nextQuarterHour(Math.max(context.nowMinutes, 8 * 60));
      return lines.map((line) => {
        const parsed = parseNaturalLanguage(line, cursor);
        const duration = parsed.durationMinutes ?? 45;
        const start = parsed.startMinutesFromMidnight ?? nextFreeSlot(busy, cursor, duration);
        busy.push({ startMinutesFromMidnight: start, durationMinutes: duration });
        cursor = start + duration;
        return block(parsed.title, context.date, start, duration, 'Parsed from your list.');
      });
    }
    const parsed = parseNaturalLanguage(prompt, context.nowMinutes);
    const duration = parsed.durationMinutes ?? 45;
    const start =
      parsed.startMinutesFromMidnight ??
      nextFreeSlot(occupying(context.existing), nextQuarterHour(context.nowMinutes), duration);
    return [block(parsed.title || 'Focus block', context.date, start, duration, 'Drafted from your prompt.')];
  }
}

export const plannerService: PlannerService = new HeuristicPlanner();
