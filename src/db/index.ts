import { Platform } from 'react-native';
import { createMemoryRepositories } from './memory';
import type { Repositories } from './types';
import { createWebRepositories } from './web';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Opening the local database timed out.')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function openRepositories(): Promise<Repositories> {
  if (Platform.OS === 'web') {
    return createWebRepositories();
  }
  try {
    const { createSqliteRepositories } = await import('./sqlite');
    return await withTimeout(createSqliteRepositories(), 4000);
  } catch {
    return createMemoryRepositories();
  }
}

export type { Repositories } from './types';
