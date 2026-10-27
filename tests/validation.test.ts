import { test } from 'node:test';
import assert from 'node:assert/strict';
import { money, date, ids, evaluateRequest, evaluationResult, operationArgs } from '../lib/server/validation';

test('reject invalid money, precision, duplicate IDs and calendar dates', () => {
  for (const n of [NaN, Infinity, 1.001, 100000000]) assert.equal(money.safeParse(n).success, false);
  assert.ok(money.safeParse(0.1 + 0.2).success);
  assert.equal(ids.safeParse([1, 1]).success, false);
  assert.equal(ids.safeParse([]).success, false);
  assert.equal(date.safeParse('2026-02-30').success, false);
  assert.ok(date.safeParse('2024-02-29').success);
  assert.ok(operationArgs.getInventoryItems.safeParse([]).success);
  assert.ok(operationArgs.getRecentTransactions.safeParse([]).success);
});

test('all five evaluation modes validate with their required context', () => {
  for (const kind of ['listing', 'offer', 'grade', 'grade_deal', 'sale']) {
    assert.ok(evaluateRequest.safeParse({ kind, title: 'Camera', price: 50, item_id: 1, acquisition_id: 2 }).success);
  }
  assert.equal(evaluateRequest.safeParse({ kind: 'grade', title: 'Camera', price: 50 }).success, false);
  assert.equal(evaluateRequest.safeParse({ kind: 'grade_deal', title: 'Lot', price: 50 }).success, false);
  assert.equal(evaluateRequest.safeParse({ kind: 'unknown', title: 'Camera', price: 50 }).success, false);
  assert.equal(evaluationResult.safeParse({ score: 100 }).success, false);
});
