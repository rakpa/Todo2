export type ColorToken =
  | 'sage'
  | 'sky'
  | 'apricot'
  | 'lilac'
  | 'rose'
  | 'sand'
  | 'slate'
  | 'mint';

export const COLOR_TOKENS: ColorToken[] = [
  'sage',
  'sky',
  'apricot',
  'lilac',
  'rose',
  'sand',
  'slate',
  'mint',
];

export type TaskSource = 'user' | 'calendar' | 'ai' | 'sample';

export type RecurrenceKind = 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom';

export type RecurrenceRule =
  | { kind: 'none' }
  | { kind: 'daily' }
  | { kind: 'weekdays' }
  | { kind: 'weekly'; days: number[] }
  | { kind: 'custom'; interval: number; unit: 'day' | 'week' };

export type ReminderKind = 'off' | 'at_start' | 'minutes_before';

export interface Reminder {
  id: string;
  kind: ReminderKind;
  minutesBefore?: number;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface OccurrenceOverride {
  isCompleted?: boolean;
  completedAt?: string | null;
  startMinutesFromMidnight?: number;
  durationMinutes?: number;
  skipped?: boolean;
  title?: string;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  iconKey: string;
  colorToken: ColorToken;
  /** Local calendar date YYYY-MM-DD. Null when the item lives in Inbox. */
  date: string | null;
  startMinutesFromMidnight: number | null;
  durationMinutes: number;
  isAllDay: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  isInbox: boolean;
  parentInboxId: string | null;
  recurrenceRule: RecurrenceRule;
  occurrenceOverrides: Record<string, OccurrenceOverride>;
  subtasks: Subtask[];
  reminders: Reminder[];
  source: TaskSource;
  sortOffset: number;
  timeZone: string | null;
  location: string | null;
  updatedAt: string;
}

export type AppearancePreference = 'system' | 'light' | 'dark';
export type TimeFormat = 'h12' | 'h24';
export type WeekStart = 0 | 1;
export type TimelineDensity = 'compact' | 'comfortable' | 'roomy';
export type SnapGridMinutes = 5 | 10 | 15;

export interface DefaultReminder {
  kind: ReminderKind;
  minutesBefore?: number;
}

export interface Settings {
  appearance: AppearancePreference;
  weekStart: WeekStart;
  timeFormat: TimeFormat;
  dyslexiaFont: boolean;
  notificationsEnabled: boolean;
  notificationsAsked: boolean;
  calendarAccessEnabled: boolean;
  hideAiEntry: boolean;
  timelineDensity: TimelineDensity;
  defaultDurationMinutes: number;
  defaultReminder: DefaultReminder;
  snapGridMinutes: SnapGridMinutes;
  hasCompletedOnboarding: boolean;
  hasSeenSplash: boolean;
  lastOnboardingScreen: number;
  hasLoadedSampleDay: boolean;
  suggestionHistoryHidden: boolean;
  hiddenSmartIcons: string[];
}

export interface CreateTaskInput {
  title: string;
  notes?: string;
  iconKey?: string;
  colorToken?: ColorToken;
  date?: string | null;
  startMinutesFromMidnight?: number | null;
  durationMinutes: number;
  isAllDay?: boolean;
  isInbox?: boolean;
  recurrenceRule?: RecurrenceRule;
  subtasks?: Subtask[];
  reminders?: Reminder[];
  source?: TaskSource;
  location?: string | null;
  timeZone?: string | null;
}

export interface TimedOccurrence {
  task: Task;
  occurrenceDate: string;
  startMinutesFromMidnight: number;
  durationMinutes: number;
  isCompleted: boolean;
  completedAt: string | null;
  title: string;
  isRecurring: boolean;
  isOverride: boolean;
}

export const MINUTES_PER_DAY = 24 * 60;
export const ONBOARDING_SCREEN_COUNT = 8;
export const APP_NAME = 'Dayline';
export const APP_TAGLINE = 'Your day on one timeline.';

export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180] as const;
export const ONBOARDING_DURATION_PRESETS = [15, 30, 45, 60] as const;

export const SAMPLE_TITLES = [
  'Wake up',
  'Yoga',
  'Shower',
  'Commute',
  'Deep work',
  'Lunch',
  'Admin',
  'Workout',
  'Wind down',
  'Sleep',
] as const;
