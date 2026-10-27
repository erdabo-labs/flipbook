import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST as data } from '../app/api/data/[operation]/route';
import { POST as evaluate } from '../app/api/evaluate/route';
import { POST as chat } from '../app/api/evaluations/[id]/chat/route';
import { operationArgs } from '../lib/server/validation';

process.env.APP_ORIGIN = 'http://localhost:3000';
// Any accidental real provider access must fail locally.
globalThis.fetch = async () => { throw new Error('Network forbidden during tests'); };
let queries = 0;
(globalThis as Record<string, unknown>).flipbookPool = { async query() { queries++; return { rows: [{ id: 1, description: 'mock deal' }] }; }, async connect() { throw new Error('Unexpected transaction'); } };
function request(args: unknown = { args: [] }, origin = process.env.APP_ORIGIN!) {
  return new Request('http://localhost:3000/api/test', { method: 'POST', headers: { 'Content-Type': 'application/json', origin }, body: JSON.stringify(args) });
}
function context(operation: string) { return { params: Promise.resolve({ operation }) }; }

test('every exposed data operation and both AI routes reject cross-origin calls before database/provider access', async () => {
  for (const operation of Object.keys(operationArgs)) assert.equal((await data(request(undefined, 'http://evil.test'), context(operation))).status, 403, operation);
  assert.equal((await evaluate(request({ title: 'Camera', price: 50 }, 'http://evil.test'))).status, 403);
  assert.equal((await chat(request({ message: 'hello' }, 'http://evil.test'), { params: Promise.resolve({ id: '1' }) })).status, 403);
  assert.equal(queries, 0);
});

test('reads work without credentials; invalid input and unknown operations fail closed', async () => {
  assert.equal((await data(request({ args: [] }), context('getAcquisitionsLite'))).status, 200);
  assert.equal(queries, 1);
  assert.equal((await data(request({ args: ['1 OR 1=1'] }), context('getAcquisition'))).status, 400);
  assert.equal((await data(request({ args: [] }), context('createEvaluation'))).status, 404);
  assert.equal((await data(request({ args: [] }), context('constructor'))).status, 404);
  assert.equal((await data(request({ args: [] }, 'http://evil.test'), context('getAcquisitionsLite'))).status, 403);
  assert.equal(queries, 1);
});

test('JSON content type, malformed JSON, body limits, and missing origin are enforced without credentials', async () => {
  const before = queries;
  for (const [headers, body, status] of [
    [{ origin: process.env.APP_ORIGIN!, 'Content-Type': 'text/plain' }, '{}', 415],
    [{ origin: process.env.APP_ORIGIN!, 'Content-Type': 'application/json' }, '{', 400],
    [{ origin: process.env.APP_ORIGIN!, 'Content-Type': 'application/json' }, 'x'.repeat(1024 * 1024 + 1), 413],
    [{ 'Content-Type': 'application/json' }, '{}', 403],
  ] as [Record<string, string>, string, number][]) {
    const response = await data(new Request('http://localhost:3000/api/test', { method: 'POST', headers, body }), context('getAcquisitionsLite'));
    assert.equal(response.status, status);
    assert.equal(response.headers.has('set-cookie'), false);
  }
  assert.equal(queries, before);
});

test('all five AI evaluation routes and follow-up chat preserve context and persist via mock transactions', async () => {
  process.env.OPENAI_API_KEY = 'test-only-not-a-real-api-key';
  const result = { score: 8, verdict: 'Good deal', estimated_resale_low: 70, estimated_resale_high: 100, reasoning: 'Useful resale margin', red_flags: [], suggested_offer: null, suggested_message: null };
  const providerRequests: Record<string, unknown>[] = [];
  const writes: string[] = [];
  let saved: Record<string, unknown> = {};
  const query = async (sql: string, args: unknown[] = []) => {
    if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK' || sql.startsWith('INSERT')) writes.push(sql);
    if (sql.startsWith('INSERT INTO "evaluation"')) { saved = { ...result, id: 501, kind: args[0], title: args[1], price: 50, description: null, notes: null }; return { rows: [saved] }; }
    if (sql.startsWith('SELECT * FROM item')) return { rows: [{ id: 1, acquisition_id: 2, name: 'Camera', cost_basis: 50, listed_price: 90, category: 'Cameras', condition: 'good', status: 'listed' }] };
    if (sql.startsWith('SELECT * FROM acquisition WHERE')) return { rows: [{ id: 2, description: 'Camera lot', acquired_date: '2026-10-01', total_cost: 50, source: 'Local', notes: null }] };
    if (sql.startsWith('SELECT * FROM acquisition_pnl')) return { rows: [{ id: 2, cash_received: 0, realized_pnl: 0, items_in_inventory: 1, total_items: 1 }] };
    if (sql.startsWith('SELECT * FROM evaluation WHERE')) return { rows: [saved] };
    if (sql.startsWith('SELECT * FROM evaluation_message')) return { rows: [{ role: 'user', content: 'Earlier question' }, { role: 'assistant', content: 'Earlier advice' }] };
    return { rows: [] };
  };
  (globalThis as Record<string, unknown>).flipbookPool = { query, async connect() { return { query, release() {} }; } };
  globalThis.fetch = async (_url, init) => {
    const payload = JSON.parse(init?.body as string);
    providerRequests.push(payload);
    return Response.json({ id: 'resp_mock', object: 'response', created_at: 1, status: 'completed', model: 'gpt-5-mini',
      output: [{ type: 'message', id: 'msg_mock', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: JSON.stringify(result), annotations: [] }] }],
      usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 } });
  };
  try {
    for (const kind of ['listing', 'offer', 'grade', 'grade_deal', 'sale']) {
      const response = await evaluate(request({ kind, title: 'Camera', price: 50, item_id: 1, acquisition_id: 2 }));
      assert.equal(response.status, 200, kind);
      assert.equal((await response.json()).kind, kind);
    }
    assert.ok(String(providerRequests[1].input).includes('Original cost basis: $50'));
    assert.ok(String(providerRequests[2].input).includes('Cost basis (what they paid): $50'));
    assert.ok(String(providerRequests[3].input).includes('Cash received so far: $0'));
    assert.ok(providerRequests.slice(0, 5).every(p => (p.tools as { type: string }[])[0].type === 'web_search'));
    const response = await chat(request({ message: 'What should I ask?' }), { params: Promise.resolve({ id: '501' }) });
    assert.equal(response.status, 200);
    assert.ok(String(providerRequests.at(-1)?.input).includes('Earlier question'));
    assert.ok(String(providerRequests.at(-1)?.input).includes('Earlier advice'));
    assert.equal(writes.filter(sql => sql === 'BEGIN').length, 6);
    assert.equal(writes.filter(sql => sql === 'COMMIT').length, 6);
    assert.ok(writes.some(sql => sql.startsWith('INSERT INTO evaluation_message')));
  } finally {
    globalThis.fetch = async () => { throw new Error('Network forbidden during tests'); };
  }
});
