/**
 * Development Adapter for Cloudflare D1 using Node.js built-in node:sqlite
 * Provides a 100% compatible D1Database interface for local Vite development
 * without needing external services or paid tools.
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export function createDevD1Database(dbPath?: string) {
  const resolvedPath = dbPath || path.resolve(process.cwd(), '.data', 'dev-d1.sqlite');
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(resolvedPath);

  // Enable WAL mode and foreign keys
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Apply migrations from migrations/0001_initial.sql
  const migrationPath = path.resolve(process.cwd(), 'migrations', '0001_initial.sql');
  if (fs.existsSync(migrationPath)) {
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    db.exec(migrationSql);
  }

  // Ensure email column exists on existing owners table
  try {
    const columns = db.prepare("PRAGMA table_info(owners)").all() as any[];
    const hasEmail = columns.some((c) => c.name === 'email');
    if (!hasEmail) {
      db.exec("ALTER TABLE owners ADD COLUMN email TEXT;");
    }
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_owners_email ON owners(email);");
  } catch (err) {
    // Ignore if already applied
  }

  // Helper to normalize values for SQLite
  function normalizeValues(values: any[]): any[] {
    return values.map((v) => {
      if (v === undefined || v === null) return null;
      if (typeof v === 'boolean') return v ? 1 : 0;
      return v;
    });
  }

  class DevD1PreparedStatement {
    private sql: string;
    private boundValues: any[];

    constructor(sql: string, boundValues: any[] = []) {
      this.sql = sql;
      this.boundValues = boundValues;
    }

    bind(...values: any[]) {
      return new DevD1PreparedStatement(this.sql, normalizeValues(values));
    }

    async first<T = any>(colName?: string): Promise<T | null> {
      try {
        const stmt = db.prepare(this.sql);
        const row = stmt.get(...this.boundValues) as any;
        if (!row) return null;
        if (colName) return row[colName] ?? null;
        return row as T;
      } catch (err) {
        console.error('D1 first() Error in query:', this.sql, err);
        throw err;
      }
    }

    async all<T = any>(): Promise<{ results: T[]; success: boolean; meta: any }> {
      try {
        const stmt = db.prepare(this.sql);
        const rows = stmt.all(...this.boundValues) as T[];
        return {
          results: rows,
          success: true,
          meta: { duration: 0, changes: 0, last_row_id: 0, served_by: 'local-node-sqlite' },
        };
      } catch (err) {
        console.error('D1 all() Error in query:', this.sql, err);
        throw err;
      }
    }

    async run<T = any>(): Promise<{ success: boolean; meta: any }> {
      try {
        const stmt = db.prepare(this.sql);
        const result = stmt.run(...this.boundValues);
        return {
          success: true,
          meta: {
            changes: result.changes,
            last_row_id: Number(result.lastInsertRowid),
            duration: 0,
            served_by: 'local-node-sqlite',
          },
        };
      } catch (err) {
        console.error('D1 run() Error in query:', this.sql, err);
        throw err;
      }
    }
  }

  const d1Database: any = {
    prepare(query: string) {
      return new DevD1PreparedStatement(query);
    },
    async batch(statements: DevD1PreparedStatement[]) {
      const results = [];
      for (const stmt of statements) {
        results.push(await stmt.run());
      }
      return results;
    },
    async exec(query: string) {
      db.exec(query);
      return { count: 0, duration: 0 };
    },
  };

  return d1Database;
}
