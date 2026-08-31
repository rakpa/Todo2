import { suggestColorToken } from './colorTokens';
import { suggestIcon } from './icons';
import { createId } from './ids';
import type { CreateTaskInput } from './types';

interface SampleSpec {
  title: string;
  start: number;
  duration: number;
}

const SAMPLE_SPECS: SampleSpec[] = [
  { title: 'Wake up', start: 7 * 60, duration: 15 },
  { title: 'Yoga', start: 7 * 60 + 15, duration: 30 },
  { title: 'Shower', start: 7 * 60 + 50, duration: 20 },
  { title: 'Commute', start: 8 * 60 + 20, duration: 30 },
  { title: 'Deep work', start: 9 * 60, duration: 120 },
  { title: 'Lunch', start: 12 * 60, duration: 45 },
  { title: 'Admin', start: 13 * 60, duration: 45 },
  { title: 'Workout', start: 17 * 60 + 30, duration: 45 },
  { title: 'Wind down', start: 21 * 60, duration: 30 },
  { title: 'Sleep', start: 22 * 60 + 30, duration: 30 },
];

export function buildSampleDay(date: string): CreateTaskInput[] {
  return SAMPLE_SPECS.map((spec) => ({
    title: spec.title,
    date,
    startMinutesFromMidnight: spec.start,
    durationMinutes: spec.duration,
    isInbox: false,
    iconKey: suggestIcon(spec.title),
    colorToken: suggestColorToken(spec.title),
    source: 'sample',
    notes: '',
  }));
}

export function newSubtask(title: string) {
  return { id: createId(), title, isCompleted: false };
}
