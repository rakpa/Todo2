import type { Settings, Task, TaskSource } from '../domain/types';
import type { Repositories, SettingsRepository, TaskRepository } from './types';

export class MemoryTaskRepository implements TaskRepository {
  private tasks = new Map<string, Task>();

  async getAll(): Promise<Task[]> {
    return [...this.tasks.values()].map((task) => structuredClone(task));
  }

  async upsert(task: Task): Promise<void> {
    this.tasks.set(task.id, structuredClone(task));
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  async deleteBySource(source: TaskSource): Promise<void> {
    for (const [id, task] of this.tasks) {
      if (task.source === source) this.tasks.delete(id);
    }
  }
}

export class MemorySettingsRepository implements SettingsRepository {
  private value: Settings | null = null;

  async get(): Promise<Settings | null> {
    return this.value ? structuredClone(this.value) : null;
  }

  async set(settings: Settings): Promise<void> {
    this.value = structuredClone(settings);
  }
}

export function createMemoryRepositories(): Repositories {
  return {
    tasks: new MemoryTaskRepository(),
    settings: new MemorySettingsRepository(),
  };
}
