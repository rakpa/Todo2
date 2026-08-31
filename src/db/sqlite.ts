import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { Settings, Task, TaskSource } from '../domain/types';
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';
import type { Repositories, SettingsRepository, TaskRepository } from './types';

class SqliteTaskRepository implements TaskRepository {
  constructor(private db: SQLiteDatabase) {}

  async getAll(): Promise<Task[]> {
    const rows = await this.db.getAllAsync<{ json: string }>('SELECT json FROM tasks');
    return rows.map((row) => JSON.parse(row.json) as Task);
  }

  async upsert(task: Task): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO tasks (id, json, date, is_inbox, source, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         json = excluded.json,
         date = excluded.date,
         is_inbox = excluded.is_inbox,
         source = excluded.source,
         updated_at = excluded.updated_at`,
      [task.id, JSON.stringify(task), task.date, task.isInbox ? 1 : 0, task.source, task.updatedAt],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
  }

  async deleteBySource(source: TaskSource): Promise<void> {
    await this.db.runAsync('DELETE FROM tasks WHERE source = ?', [source]);
  }
}

class SqliteSettingsRepository implements SettingsRepository {
  constructor(private db: SQLiteDatabase) {}

  async get(): Promise<Settings | null> {
    const row = await this.db.getFirstAsync<{ json: string }>('SELECT json FROM settings WHERE id = 1');
    return row ? (JSON.parse(row.json) as Settings) : null;
  }

  async set(settings: Settings): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO settings (id, json) VALUES (1, ?)
       ON CONFLICT(id) DO UPDATE SET json = excluded.json`,
      [JSON.stringify(settings)],
    );
  }
}

export async function createSqliteRepositories(): Promise<Repositories> {
  const db = await openDatabaseAsync('dayline.db');
  await db.execAsync(CREATE_TABLES_SQL);
  const versionRow = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', [
    'schema_version',
  ]);
  if (!versionRow) {
    await db.runAsync('INSERT INTO meta (key, value) VALUES (?, ?)', ['schema_version', String(SCHEMA_VERSION)]);
  }
  return {
    tasks: new SqliteTaskRepository(db),
    settings: new SqliteSettingsRepository(db),
  };
}
