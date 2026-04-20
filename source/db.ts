import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import {mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import type {User} from './types.js';

const DB_PATH = join(process.cwd(), 'data', 'bbs.db');
const BCRYPT_ROUNDS = 10;

let db: Database.Database;

export function initDb(): void {
  mkdirSync(dirname(DB_PATH), {recursive: true});
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    )
  `);
}

export function createUser(
  username: string,
  password: string,
): {success: boolean; error?: string} {
  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  try {
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(
      username,
      hash,
    );
    return {success: true};
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
      return {success: false, error: 'Username already taken'};
    }
    return {success: false, error: 'Registration failed'};
  }
}

export function authenticateUser(
  username: string,
  password: string,
): {success: boolean; error?: string} {
  const row = db
    .prepare('SELECT password_hash FROM users WHERE username = ?')
    .get(username) as {password_hash: string} | undefined;

  if (!row) {
    return {success: false, error: 'User not found'};
  }

  if (!bcrypt.compareSync(password, row.password_hash)) {
    return {success: false, error: 'Invalid password'};
  }

  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = ?').run(
    username,
  );
  return {success: true};
}

export function getUser(username: string): User | null {
  const row = db
    .prepare('SELECT id, username, created_at, last_login FROM users WHERE username = ?')
    .get(username) as
    | {id: number; username: string; created_at: string; last_login: string | null}
    | undefined;

  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
}
