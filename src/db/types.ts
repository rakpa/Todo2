import type { Settings, Task, TaskSource } from '../domain/types';

export interface TaskRepository {
  getAll(): Promise<Task[]>;
  upsert(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
  deleteBySource(source: TaskSource): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<Settings | null>;
  set(settings: Settings): Promise<void>;
}

export interface Repositories {
  tasks: TaskRepository;
  settings: SettingsRepository;
}
