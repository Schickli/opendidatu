import path from 'node:path'
import { mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from '@/lib/server/schema'
import { seedSampleDataIfNeeded } from '@/lib/server/seed'

let sqlite: Database.Database | null = null
let db: BetterSQLite3Database<typeof schema> | null = null

export function resolveDatabasePath() {
  const configuredPath = process.env.DATABASE_PATH

  if (configuredPath) {
    return path.resolve(configuredPath)
  }

  return path.join(process.cwd(), 'data', 'opendidatu.sqlite')
}

function ensureSchema(connection: Database.Database) {
  connection.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS posten (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      easting INTEGER NOT NULL,
      northing INTEGER NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS message_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      min_per_hour INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS message_type_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      message_type_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      max_digits INTEGER NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (message_type_id) REFERENCES message_types(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meldungen (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      posten_id INTEGER NOT NULL,
      type_id INTEGER NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_valid INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (posten_id) REFERENCES posten(id) ON DELETE CASCADE,
      FOREIGN KEY (type_id) REFERENCES message_types(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS meldung_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      meldung_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      category_name TEXT NOT NULL,
      value TEXT NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (meldung_id) REFERENCES meldungen(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_message_type_categories_type_id
      ON message_type_categories(message_type_id, position);

    CREATE INDEX IF NOT EXISTS idx_meldungen_posten_id
      ON meldungen(posten_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_meldungen_type_id
      ON meldungen(type_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_meldung_values_meldung_id
      ON meldung_values(meldung_id, position);
  `)
}

export function getDb() {
  if (db) {
    return db
  }

  const databasePath = resolveDatabasePath()
  mkdirSync(path.dirname(databasePath), { recursive: true })

  sqlite = new Database(databasePath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  ensureSchema(sqlite)

  db = drizzle(sqlite, { schema })
  seedSampleDataIfNeeded(db)
  return db
}