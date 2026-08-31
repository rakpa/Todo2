import { create } from 'zustand';
import { createMemoryRepositories } from '../db/memory';
import type { Repositories } from '../db/types';
import { suggestColorToken } from '../domain/colorTokens';
import { createId } from '../domain/ids';
import { suggestIcon } from '../domain/icons';
import { isRecurring } from '../domain/recurrence';
import { buildSampleDay } from '../domain/sampleDay';
import {
  assertPositiveDuration,
  sanitizeTitle,
  todayKey,
} from '../domain/time';
import type {
  CreateTaskInput,
  Settings,
  Task,
  TimedOccurrence,
} from '../domain/types';
import { DEFAULT_SETTINGS, mergeSettings } from './defaults';

export interface AppState {
  hydrated: boolean;
  hydrateError: string | null;
  settings: Settings;
  tasks: Task[];
  selectedDate: string;
  sessionSplashConsumed: boolean;
  focusTaskId: string | null;
  consumeSessionSplash: () => void;
  configure: (repositories: Repositories) => void;
  hydrate: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  setOnboardingScreen: (index: number) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  replayOnboarding: () => Promise<void>;
  markSplashSeen: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<Task>;
  toggleComplete: (occurrence: TimedOccurrence) => Promise<void>;
  moveOccurrence: (occurrence: TimedOccurrence, date: string, startMinutes: number) => Promise<void>;
  moveToInbox: (id: string) => Promise<void>;
  scheduleFromInbox: (id: string, date: string, startMinutes: number, durationMinutes: number) => Promise<void>;
  loadSampleDay: (date?: string) => Promise<void>;
  removeSampleDay: () => Promise<void>;
  setFocusTask: (id: string | null) => void;
}

let repos: Repositories = createMemoryRepositories();

function stamp(task: Omit<Task, 'updatedAt'>): Task {
  return { ...task, updatedAt: new Date().toISOString() };
}

function buildTask(input: CreateTaskInput): Task {
  const durationMinutes = assertPositiveDuration(input.durationMinutes);
  const isInbox = input.isInbox ?? input.startMinutesFromMidnight == null;
  return stamp({
    id: createId(),
    title: sanitizeTitle(input.title),
    notes: input.notes ?? '',
    iconKey: input.iconKey ?? suggestIcon(input.title),
    colorToken: input.colorToken ?? suggestColorToken(input.title),
    date: isInbox ? null : (input.date ?? todayKey()),
    startMinutesFromMidnight: isInbox ? null : (input.startMinutesFromMidnight ?? null),
    durationMinutes,
    isAllDay: input.isAllDay ?? false,
    isCompleted: false,
    completedAt: null,
    isInbox,
    parentInboxId: null,
    recurrenceRule: input.recurrenceRule ?? { kind: 'none' },
    occurrenceOverrides: {},
    subtasks: input.subtasks ?? [],
    reminders: input.reminders ?? [],
    source: input.source ?? 'user',
    sortOffset: 0,
    timeZone: input.timeZone ?? null,
    location: input.location ?? null,
  });
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  hydrateError: null,
  settings: DEFAULT_SETTINGS,
  tasks: [],
  selectedDate: todayKey(),
  sessionSplashConsumed: false,
  focusTaskId: null,

  consumeSessionSplash: () => set({ sessionSplashConsumed: true }),

  configure: (repositories) => {
    repos = repositories;
  },

  hydrate: async () => {
    try {
      const [storedSettings, tasks] = await Promise.all([repos.settings.get(), repos.tasks.getAll()]);
      set({
        settings: mergeSettings(storedSettings ?? undefined),
        tasks,
        hydrated: true,
        hydrateError: null,
        selectedDate: get().selectedDate || todayKey(),
      });
    } catch (error) {
      set({
        hydrated: true,
        hydrateError: error instanceof Error ? error.message : 'Could not open the local database.',
      });
    }
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  updateSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await repos.settings.set(settings);
  },

  setOnboardingScreen: async (index) => {
    await get().updateSettings({ lastOnboardingScreen: Math.max(0, Math.min(7, index)) });
  },

  skipOnboarding: async () => {
    await get().updateSettings({
      hasCompletedOnboarding: true,
      hasSeenSplash: true,
      lastOnboardingScreen: 7,
    });
  },

  completeOnboarding: async () => {
    await get().updateSettings({
      hasCompletedOnboarding: true,
      hasSeenSplash: true,
      lastOnboardingScreen: 7,
    });
  },

  replayOnboarding: async () => {
    await get().updateSettings({
      hasCompletedOnboarding: false,
      lastOnboardingScreen: 0,
    });
  },

  markSplashSeen: async () => {
    await get().updateSettings({ hasSeenSplash: true });
  },

  createTask: async (input) => {
    const task = buildTask(input);
    await repos.tasks.upsert(task);
    set({ tasks: [...get().tasks, task] });
    return task;
  },

  updateTask: async (id, patch) => {
    const existing = get().tasks.find((item) => item.id === id);
    if (!existing) throw new Error('Task not found');
    if (patch.durationMinutes != null) assertPositiveDuration(patch.durationMinutes);
    const task = stamp({ ...existing, ...patch, id: existing.id });
    await repos.tasks.upsert(task);
    set({ tasks: get().tasks.map((item) => (item.id === id ? task : item)) });
    return task;
  },

  deleteTask: async (id) => {
    await repos.tasks.delete(id);
    set({ tasks: get().tasks.filter((item) => item.id !== id) });
  },

  duplicateTask: async (id) => {
    const existing = get().tasks.find((item) => item.id === id);
    if (!existing) throw new Error('Task not found');
    const copy = stamp({
      ...existing,
      id: createId(),
      title: `${existing.title} copy`,
      isCompleted: false,
      completedAt: null,
    });
    await repos.tasks.upsert(copy);
    set({ tasks: [...get().tasks, copy] });
    return copy;
  },

  toggleComplete: async (occurrence) => {
    const task = get().tasks.find((item) => item.id === occurrence.task.id);
    if (!task) return;
    const nextCompleted = !occurrence.isCompleted;
    const completedAt = nextCompleted ? new Date().toISOString() : null;
    if (isRecurring(task.recurrenceRule)) {
      const occurrenceOverrides = {
        ...task.occurrenceOverrides,
        [occurrence.occurrenceDate]: {
          ...task.occurrenceOverrides[occurrence.occurrenceDate],
          isCompleted: nextCompleted,
          completedAt,
        },
      };
      await get().updateTask(task.id, { occurrenceOverrides });
      return;
    }
    await get().updateTask(task.id, { isCompleted: nextCompleted, completedAt });
  },

  moveOccurrence: async (occurrence, date, startMinutes) => {
    const task = get().tasks.find((item) => item.id === occurrence.task.id);
    if (!task) return;
    if (isRecurring(task.recurrenceRule)) {
      const occurrenceOverrides = {
        ...task.occurrenceOverrides,
        [occurrence.occurrenceDate]: {
          ...task.occurrenceOverrides[occurrence.occurrenceDate],
          startMinutesFromMidnight: startMinutes,
        },
      };
      if (date !== occurrence.occurrenceDate) {
        occurrenceOverrides[occurrence.occurrenceDate] = {
          ...occurrenceOverrides[occurrence.occurrenceDate],
          skipped: true,
        };
        occurrenceOverrides[date] = {
          ...occurrenceOverrides[date],
          startMinutesFromMidnight: startMinutes,
          skipped: false,
        };
      }
      await get().updateTask(task.id, { occurrenceOverrides });
      return;
    }
    await get().updateTask(task.id, {
      date,
      startMinutesFromMidnight: startMinutes,
      isInbox: false,
    });
  },

  moveToInbox: async (id) => {
    await get().updateTask(id, {
      isInbox: true,
      date: null,
      startMinutesFromMidnight: null,
      isCompleted: false,
    });
  },

  scheduleFromInbox: async (id, date, startMinutes, durationMinutes) => {
    assertPositiveDuration(durationMinutes);
    await get().updateTask(id, {
      isInbox: false,
      date,
      startMinutesFromMidnight: startMinutes,
      durationMinutes,
    });
  },

  loadSampleDay: async (date) => {
    const target = date ?? get().selectedDate;
    const specs = buildSampleDay(target);
    const created: Task[] = [];
    for (const spec of specs) {
      created.push(await get().createTask(spec));
    }
    await get().updateSettings({ hasLoadedSampleDay: true });
    void created;
  },

  removeSampleDay: async () => {
    await repos.tasks.deleteBySource('sample');
    const tasks = await repos.tasks.getAll();
    set({ tasks });
    await get().updateSettings({ hasLoadedSampleDay: false });
  },

  setFocusTask: (id) => set({ focusTaskId: id }),
}));

export async function resetStore(repositories = createMemoryRepositories()): Promise<void> {
  repos = repositories;
  useAppStore.setState({
    hydrated: false,
    hydrateError: null,
    settings: DEFAULT_SETTINGS,
    tasks: [],
    selectedDate: todayKey(),
    sessionSplashConsumed: false,
    focusTaskId: null,
  });
  await useAppStore.getState().hydrate();
}
