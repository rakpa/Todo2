import { createMemoryRepositories } from './memory';
import { createSqliteRepositories } from './sqlite';
import type { Repositories } from './types';

export async function openRepositories(): Promise<Repositories> {
  try {
    return await createSqliteRepositories();
  } catch {
    return createMemoryRepositories();
  }
}

export type { Repositories } from './types';
