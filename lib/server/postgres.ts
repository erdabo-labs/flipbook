import 'server-only';
import { Pool, types, type PoolClient } from 'pg';

// Scoped parsers: DATE must remain a calendar date, not a timezone-shifted Date.
export function parseNumeric(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) > Number.MAX_SAFE_INTEGER / 10000) throw new Error('Numeric value outside supported range');
  return n;
}
export function parseBigint(value: string): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error('Integer outside supported range');
  return n;
}
export const pgTypes = { getTypeParser(oid: number, format?: 'text' | 'binary') {
  if (format !== 'binary') {
    if (oid === 1700) return parseNumeric;
    if (oid === 20) return parseBigint;
    if (oid === 1082 || oid === 1184) return (value: string) => value;
  }
  return types.getTypeParser(oid, format);
} };
const globalPool = globalThis as typeof globalThis & { flipbookPool?: Pool };
export function getPool(): Pool {
  if (!globalPool.flipbookPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Database configuration missing');
    globalPool.flipbookPool = new Pool({ connectionString, max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000,
      statement_timeout: 30000, options: '-c search_path=public', types: pgTypes });
    // Never print driver errors: they can contain connection details or row values.
    globalPool.flipbookPool.on('error', () => { console.error('Database pool connection error'); });
  }
  return globalPool.flipbookPool;
}
export type SqlClient = Pick<PoolClient, 'query'>;
export async function inTransaction<T>(work: (client: SqlClient) => Promise<T>, pool = getPool()): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
