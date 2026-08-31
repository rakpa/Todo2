import { createMemoryRepositories } from '../../db/memory';
import { resetStore, useAppStore } from '../appStore';

describe('onboarding persistence', () => {
  beforeEach(async () => {
    await resetStore(createMemoryRepositories());
  });

  test('skip marks onboarding complete without creating tasks', async () => {
    await useAppStore.getState().skipOnboarding();
    const { settings, tasks } = useAppStore.getState();
    expect(settings.hasCompletedOnboarding).toBe(true);
    expect(settings.hasSeenSplash).toBe(true);
    expect(tasks).toHaveLength(0);
  });

  test('force-quit resume stores the last unfinished screen', async () => {
    await useAppStore.getState().setOnboardingScreen(3);
    expect(useAppStore.getState().settings.lastOnboardingScreen).toBe(3);
    const repos = createMemoryRepositories();
    await repos.settings.set(useAppStore.getState().settings);
    await resetStore(repos);
    expect(useAppStore.getState().settings.lastOnboardingScreen).toBe(3);
    expect(useAppStore.getState().settings.hasCompletedOnboarding).toBe(false);
  });

  test('first-task screen writes a real timed task', async () => {
    const task = await useAppStore.getState().createTask({
      title: 'Wake up',
      durationMinutes: 15,
      startMinutesFromMidnight: 7 * 60,
      date: '2026-08-31',
      isInbox: false,
    });
    expect(task.title).toBe('Wake up');
    expect(task.isInbox).toBe(false);
    expect(useAppStore.getState().tasks).toHaveLength(1);
  });

  test('replay tutorial does not wipe tasks', async () => {
    await useAppStore.getState().createTask({
      title: 'Deep work',
      durationMinutes: 45,
      startMinutesFromMidnight: 9 * 60,
      date: '2026-08-31',
    });
    await useAppStore.getState().completeOnboarding();
    await useAppStore.getState().replayOnboarding();
    expect(useAppStore.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(useAppStore.getState().tasks).toHaveLength(1);
  });

  test('sample day can be removed in one action', async () => {
    await useAppStore.getState().loadSampleDay('2026-08-31');
    expect(useAppStore.getState().tasks.some((task) => task.source === 'sample')).toBe(true);
    await useAppStore.getState().removeSampleDay();
    expect(useAppStore.getState().tasks).toHaveLength(0);
    expect(useAppStore.getState().settings.hasLoadedSampleDay).toBe(false);
  });

  test('empty title and zero duration do not crash', async () => {
    const task = await useAppStore.getState().createTask({
      title: '   ',
      durationMinutes: 15,
      startMinutesFromMidnight: 8 * 60,
      date: '2026-08-31',
    });
    expect(task.title).toBe('Untitled block');
    await expect(
      useAppStore.getState().createTask({
        title: 'Nope',
        durationMinutes: 0,
        startMinutesFromMidnight: 8 * 60,
        date: '2026-08-31',
      }),
    ).rejects.toThrow(/greater than zero/);
  });
});
