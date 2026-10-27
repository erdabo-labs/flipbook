import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Pool } from 'pg';
import { inTransaction, parseBigint, parseNumeric, pgTypes, type SqlClient } from '../lib/server/postgres';
import { Repository } from '../lib/server/repository';
import { computeMonthlyPnl } from '../lib/metrics';
import { splitAmount } from '../lib/format';

function mock(handler: (sql: string, args: unknown[]) => object[] = () => []) {
  const calls: { sql: string; args: unknown[] }[] = [];
  let released = false;
  const client = { async query(sql: string, args: unknown[] = []) { calls.push({ sql, args }); return { rows: handler(sql, args) }; }, release() { released = true; } };
  const pool = { async connect() { return client; } } as unknown as Pool;
  return { calls, client: client as unknown as SqlClient, pool, released: () => released };
}
const sale = { itemIds: [1, 2], cash_amount: 120.01, transaction_date: '2026-10-26', platform: null, counterparty: null, notes: "buyer'; DROP TABLE item; --" };
const item = { id: 1, acquisition_id: 3, cost_basis: 50.01, name: 'Camera', status: 'inventory', category: null, condition: null, used_personally: false, notes: null };

test('sale locks available items and commits links and status on one connection', async () => {
  const m = mock(sql => sql.startsWith('SELECT * FROM item') ? [item, { ...item, id: 2 }] : sql.startsWith('INSERT INTO "transaction"') ? [{ id: 10 }] : []);
  await inTransaction(c => new Repository(c).createSaleOrBundleTransaction(sale), m.pool);
  assert.equal(m.calls[0].sql, 'BEGIN');
  assert.match(m.calls[1].sql, /FOR UPDATE/);
  assert.equal(m.calls.filter(c => c.sql.startsWith('INSERT INTO transaction_item')).length, 2);
  assert.equal(m.calls.at(-1)?.sql, 'COMMIT');
  assert.ok(m.released());
  assert.ok(!m.calls.some(c => c.sql.includes(sale.notes)));
  assert.ok(m.calls.some(c => c.args.includes(sale.notes)));
});

test('related writes roll back when sale linking fails', async () => {
  const m = mock(sql => {
    if (sql.startsWith('SELECT * FROM item')) return [item, { ...item, id: 2 }];
    if (sql.startsWith('INSERT INTO "transaction"')) return [{ id: 10 }];
    if (sql.startsWith('INSERT INTO transaction_item')) throw new Error('constraint');
    return [];
  });
  await assert.rejects(inTransaction(c => new Repository(c).createSaleOrBundleTransaction(sale), m.pool));
  assert.equal(m.calls.at(-1)?.sql, 'ROLLBACK');
  assert.ok(!m.calls.some(c => c.sql === 'COMMIT'));
  assert.ok(m.released());
});

test('a stale sale does not create a transaction', async () => {
  const m = mock(() => [{ ...item, status: 'sold' }, { ...item, id: 2 }]);
  await assert.rejects(inTransaction(c => new Repository(c).createSaleOrBundleTransaction(sale), m.pool), /no longer available/);
  assert.ok(!m.calls.some(c => c.sql.startsWith('INSERT')));
});

test('trade preserves cash type, zero cost received item, and inbound/outbound links', async () => {
  const m = mock(sql => sql.startsWith('SELECT * FROM item') ? [item] : sql.startsWith('INSERT INTO "transaction"') ? [{ id: 10 }] : sql.startsWith('INSERT INTO "item"') ? [{ id: 4 }] : []);
  await inTransaction(c => new Repository(c).createTradeTransaction({ ...sale, outboundItemIds: [1], acquisitionId: 3, receivedItemName: 'Drone' }), m.pool);
  const tx = m.calls.find(c => c.sql.startsWith('INSERT INTO "transaction"'))!;
  assert.equal(tx.args[0], 'partial_trade');
  assert.ok(m.calls.some(c => c.args.includes('outbound')));
  assert.ok(m.calls.some(c => c.args.includes('inbound')));
  assert.ok(m.calls.find(c => c.sql.startsWith('INSERT INTO "item"'))!.args.includes(0));
  assert.equal(m.calls.at(-1)?.sql, 'COMMIT');
});

test('trade undo deletes transaction links before received item', async () => {
  const m = mock(sql => sql.startsWith('SELECT item_id, direction') ? [{ item_id: 1, direction: 'outbound' }, { item_id: 4, direction: 'inbound' }] : sql.startsWith('SELECT * FROM item') ? [item] : []);
  await inTransaction(c => new Repository(c).deleteTransaction(10), m.pool);
  assert.ok(m.calls.findIndex(c => c.sql.startsWith('DELETE FROM "transaction"')) < m.calls.findIndex(c => c.sql.startsWith('DELETE FROM item')));
});

test('undo refuses received items with subsequent transaction history', async () => {
  const m = mock(sql => sql.startsWith('SELECT item_id, direction') ? [{ item_id: 4, direction: 'inbound' }] : sql.startsWith('SELECT id FROM transaction_item') ? [{ id: 99 }] : []);
  await assert.rejects(inTransaction(c => new Repository(c).deleteTransaction(10), m.pool), /later transactions/);
  assert.ok(!m.calls.some(c => c.sql.startsWith('DELETE')));
});

test('split reloads trusted item attributes and enforces total cost', async () => {
  const m = mock(sql => sql.startsWith('SELECT * FROM item') ? [item] : sql.startsWith('INSERT INTO "item"') ? [{ id: 8 }] : []);
  await inTransaction(c => new Repository(c).splitItem({ id: 1 }, [{ name: 'Body', cost_basis: 30 }, { name: 'Lens', cost_basis: 20.01 }]), m.pool);
  assert.equal(m.calls.filter(c => c.sql.startsWith('INSERT INTO "item"')).length, 2);
  assert.equal(m.calls.find(c => c.sql.startsWith('INSERT INTO "item"'))?.args[0], 3);
  await assert.rejects(new Repository(m.client).splitItem({ id: 1 }, [{ name: 'A', cost_basis: 1 }, { name: 'B', cost_basis: 1 }]), /equal original/);
});

test('new acquisition rolls back if any item fails', async () => {
  const m = mock(sql => {
    if (sql.startsWith('INSERT INTO "acquisition"')) return [{ id: 3 }];
    if (sql.startsWith('INSERT INTO "item"')) throw new Error('item failure');
    return [];
  });
  await assert.rejects(inTransaction(c => new Repository(c).createAcquisitionWithItems({ deal: { description: 'Lot', acquired_date: '2026-10-26', total_cost: 50.01, source: null, source_type: 'flip_purchase', deal_group: null, notes: null }, items: [{ name: 'Camera', cost_basis: 50.01, category: null, condition: null, used_personally: false, notes: null }] }), m.pool));
  assert.equal(m.calls.at(-1)?.sql, 'ROLLBACK');
});

test('bundle allocation uses locked database cost bases, not browser supplied weights', async () => {
  const m = mock(sql => sql.startsWith('SELECT * FROM item') ? [{ ...item, cost_basis: 10 }, { ...item, id: 2, cost_basis: 30 }] : sql.startsWith('UPDATE') ? [{ id: 1 }] : []);
  await inTransaction(c => new Repository(c).createBundleListing({ items: [{ id: 1, cost_basis: 999 }, { id: 2, cost_basis: 1 }], label: null, total_listed_price: 100 }), m.pool);
  const updates = m.calls.filter(c => c.sql.startsWith('UPDATE'));
  assert.ok(updates[0].args.includes(25)); assert.ok(updates[1].args.includes(75));
});

test('calendar dates, NUMERIC four decimal costs, safe bigint IDs and nulls remain compatible', () => {
  assert.equal(pgTypes.getTypeParser(1082)('2026-10-26'), '2026-10-26');
  assert.equal(parseNumeric('0.0123'), 0.0123);
  assert.equal(parseNumeric('99999999.99'), 99999999.99);
  assert.equal(parseBigint('42'), 42);
  assert.throws(() => parseBigint('9007199254740993'));
  assert.throws(() => parseNumeric('NaN'));
});

test('metrics count bundle cash once and sum each item cost', () => {
  const rows = [1, 2].map(id => ({ transaction_id: 10, transaction_date: '2026-10-26', cash_amount: 120, cost_basis: id === 1 ? 20 : 30, acquired_date: '2026-09-01', item_name: `item ${id}` }));
  assert.equal(computeMonthlyPnl(rows)[0].realized_pnl, 70);
  assert.equal(computeMonthlyPnl(rows)[0].deals_closed, 1);
  assert.deepEqual(splitAmount(10, [1, 1, 1]), [3.33, 3.33, 3.34]);
});

test('chat pair is parameterized in a single insert within a transaction', async () => {
  const m = mock();
  await inTransaction(c => new Repository(c).saveChat(1, "What's next?", 'List at $50', 100, 50, 0.0001), m.pool);
  assert.equal(m.calls.length, 3);
  assert.deepEqual(m.calls[1].args, [1, 'user', "What's next?", 'assistant', 'List at $50', 100, 50, 0.0001]);
});

test('deal deletion removes trade and later-sale history together before deleting its items', async () => {
  const m = mock(sql => sql.startsWith('SELECT * FROM item') ? [item] : sql.startsWith('SELECT DISTINCT transaction_id') ? [{ transaction_id: 10 }, { transaction_id: 11 }] : []);
  await inTransaction(c => new Repository(c).deleteAcquisition(3), m.pool);
  const deletedTx = m.calls.find(c => c.sql.startsWith('DELETE FROM "transaction"'))!;
  assert.deepEqual(deletedTx.args, [[10, 11]]);
  assert.ok(m.calls.indexOf(deletedTx) < m.calls.findIndex(c => c.sql.startsWith('DELETE FROM acquisition')));
  assert.equal(m.calls.at(-1)?.sql, 'COMMIT');
});
