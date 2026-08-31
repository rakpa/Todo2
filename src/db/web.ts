import type { Settings, Task, TaskSource } from '../domain/types';
import type { Repositories, SettingsRepository, TaskRepository } from './types';

const TASKS_KEY = 'dayline.tasks.v1';
const SETTINGS_KEY = 'dayline.settings.v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private mode — keep going in memory.
  }
}

class WebTaskRepository implements TaskRepository {
  async getAll(): Promise<Task[]> {
    return readJson<Task[]>(TASKS_KEY, []);
  }

  async upsert(task: Task): Promise<void> {
    const tasks = readJson<Task[]>(TASKS_KEY, []).filter((item) => item.id !== task.id);
    tasks.push(task);
    writeJson(TASKS_KEY, tasks);
  }

  async delete(id: string): Promise<void> {
    writeJson(
      TASKS_KEY,
      readJson<Task[]>(TASKS_KEY, []).filter((item) => item.id !== id),
    );
  }

  async deleteBySource(source: TaskSource): Promise<void> {
    writeJson(
      TASKS_KEY,
      readJson<Task[]>(TASKS_KEY, []).filter((item) => item.source !== source),
    );
  }
}

class WebSettingsRepository implements SettingsRepository {
  async get(): Promise<Settings | null> {
    return readJson<Settings | null>(SETTINGS_KEY, null);
  }

  async set(settings: Settings): Promise<void> {
    writeJson(SETTINGS_KEY, settings);
  }
}

export function createWebRepositories(): Repositories {
  return {
    tasks: new WebTaskRepository(),
    settings: new WebSettingsRepository(),
  };
}
