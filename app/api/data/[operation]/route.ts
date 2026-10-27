import * as db from '@/lib/db';
import { operationArgs } from '@/lib/server/validation';
import { assertOrigin, failure, HttpError, json, readJson } from '@/lib/server/http';
import { z } from 'zod';
export const runtime = 'nodejs';
export async function POST(request: Request, { params }: { params: Promise<{ operation: string }> }) {
  try {
    assertOrigin(request);
    const { operation } = await params;
    if (!Object.hasOwn(operationArgs, operation)) throw new HttpError(404, 'Unknown operation');
    const key = operation as keyof typeof operationArgs;
    const { args } = z.object({ args: z.array(z.unknown()).max(3) }).strict().parse(await readJson(request));
    const parsed = operationArgs[key].parse(args);
    // Only this explicit validation allowlist is callable; server-only AI writes are excluded.
    const call = db[key] as (...args: unknown[]) => Promise<unknown>;
    return json({ data: (await call(...parsed)) ?? null });
  } catch (error) { return failure(error); }
}
