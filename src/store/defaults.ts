import type { Settings } from '../domain/types';

export const DEFAULT_SETTINGS: Settings = {
  appearance: 'system',
  weekStart: 1,
  timeFormat: 'h12',
  dyslexiaFont: false,
  notificationsEnabled: false,
  notificationsAsked: false,
  calendarAccessEnabled: false,
  hideAiEntry: false,
  timelineDensity: 'comfortable',
  defaultDurationMinutes: 30,
  defaultReminder: { kind: 'at_start' },
  snapGridMinutes: 15,
  hasCompletedOnboarding: false,
  hasSeenSplash: false,
  lastOnboardingScreen: 0,
  hasLoadedSampleDay: false,
  suggestionHistoryHidden: false,
  hiddenSmartIcons: [],
};

export function mergeSettings(stored: Partial<Settings> | null | undefined): Settings {
  return { ...DEFAULT_SETTINGS, ...stored };
}
