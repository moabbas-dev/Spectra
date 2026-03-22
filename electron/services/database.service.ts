import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { app } from 'electron';
import { logger } from '../utils/logger.util';

let dbInstance: Database.Database | null = null;

function migrationsDir(): string {
  return path.join(__dirname, '..', 'db', 'migrations');
}

function listMigrationFiles(): string[] {
  const dir = migrationsDir();
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function ensureMigrationsTable(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL
    );
  `);
}

function applyMigrations(database: Database.Database): void {
  ensureMigrationsTable(database);
  const migrationRows = database
    .prepare<[], { name: string }>('SELECT name FROM schema_migrations')
    .all();
  const applied = new Set(migrationRows.map((r) => r.name));

  for (const file of listMigrationFiles()) {
    if (applied.has(file)) continue;
    const full = path.join(migrationsDir(), file);
    const sql = fs.readFileSync(full, 'utf8');
    const applyOne = database.transaction((name: string, sqlText: string) => {
      database.exec(sqlText);
      database
        .prepare<[string, number], unknown>(
          'INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)',
        )
        .run(name, Date.now());
    });
    applyOne(file, sql);
    logger.info(`Applied migration: ${file}`);
  }
}

export function getDatabasePath(): string {
  const dir = path.join(app.getPath('userData'), 'spectra-data');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'spectra.db');
}

export function getDatabase(): Database.Database {
  if (dbInstance) return dbInstance;
  const dbPath = getDatabasePath();
  logger.info(`Opening database at ${dbPath}`);
  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');
  applyMigrations(dbInstance);
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
