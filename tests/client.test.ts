import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getInventoryItems, updateItemStatus } from '../lib/db-client';

test('browser transport preserves omitted optional arguments and explicit null notes', async () => {
  const bodies: unknown[] = [];
  globalThis.fetch = async (_url, init) => {
    bodies.push(JSON.parse(init?.body as string));
    return Response.json({ data: [] });
  };
  await getInventoryItems(undefined);
  await updateItemStatus(1, 'inventory', undefined);
  await updateItemStatus(1, 'inventory', null);
  assert.deepEqual(bodies, [{ args: [] }, { args: [1, 'inventory'] }, { args: [1, 'inventory', null] }]);
});
