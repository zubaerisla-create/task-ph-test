import { promises as fs } from 'fs';
import path from 'path';
import type { DB } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

let _cache: DB | null = null;
let _dirty = false;

export async function readDB(): Promise<DB> {
  if (_cache) return _cache;
  const raw = await fs.readFile(DB_PATH, 'utf-8');
  _cache = JSON.parse(raw) as DB;
  return _cache;
}

export async function writeDB(data: DB): Promise<void> {
  _cache = data;
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function invalidateCache(): void {
  _cache = null;
}
