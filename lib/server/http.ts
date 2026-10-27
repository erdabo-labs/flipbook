import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { HttpError } from './errors';
export { HttpError } from './errors';
export function assertOrigin(request: Request) {
  const configured = process.env.APP_ORIGIN;
  if (!configured) throw new Error('Application origin configuration missing');
  if (request.headers.get('origin') !== new URL(configured).origin) throw new HttpError(403, 'Invalid request origin');
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'JSON required');
}
export async function readJson(request: Request): Promise<unknown> {
  // Bound bodies even when Content-Length is absent or untrusted.
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Request body required');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 1024 * 1024) { await reader.cancel(); throw new HttpError(413, 'Request too large'); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError(400, 'Invalid JSON'); }
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError) return json({ error: 'Invalid input', issues: error.issues.map(i => ({ path: i.path, message: i.message })) }, 400);
  // Never return/log raw SQL, connection, provider, or input errors.
  return json({ error: 'Operation failed. Check configuration and try again.' }, 500);
}
