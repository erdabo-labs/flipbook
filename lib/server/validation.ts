import { z } from 'zod';

export const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const text = z.string().max(20000);
export const name = text.trim().min(1).max(1000);
export const nullableText = text.nullable();
export const money = z.number().finite().min(-99999999.99).max(99999999.99)
  .refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001, 'Use at most two decimal places');
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, 'Invalid date');
export const condition = z.enum(['new', 'like_new', 'good', 'fair', 'parts']).nullable();
export const status = z.enum(['inventory', 'listed', 'pending', 'sold', 'traded', 'kept', 'bundled']);
export const kind = z.enum(['listing', 'offer', 'grade', 'grade_deal', 'sale']);
export const ids = z.array(id).min(1).max(1000).refine(v => new Set(v).size === v.length, 'Duplicate items');
export const acquisition = z.object({ description: name, acquired_date: date, total_cost: money, source: nullableText,
  source_type: z.enum(['flip_purchase', 'personal_item', 'trade_received']), deal_group: nullableText, notes: nullableText }).strict();
export const itemDetails = z.object({ name, cost_basis: money, category: nullableText, condition }).strict();
export const newItem = itemDetails.extend({ acquisition_id: id, used_personally: z.boolean(), notes: nullableText }).strict();
export const newDeal = z.object({ deal: acquisition, items: z.array(newItem.omit({ acquisition_id: true })).min(1).max(1000) }).strict();
export const transaction = z.object({ transaction_date: date, cash_amount: money, platform: nullableText, counterparty: nullableText, notes: nullableText }).strict();
export const sale = transaction.extend({ itemIds: ids }).strict();
export const trade = transaction.extend({ outboundItemIds: ids, acquisitionId: id, receivedItemName: name }).strict();
export const profile = z.object({ location: nullableText, platforms: nullableText, ships_items: z.boolean(), style_notes: nullableText }).strict();
export const evaluationResult = z.object({ score: z.number().int().min(1).max(10), verdict: name, estimated_resale_low: money,
  estimated_resale_high: money, reasoning: text.trim().min(1), red_flags: z.array(text).max(100), suggested_offer: money.nullable(), suggested_message: nullableText });
export const evaluation = evaluationResult.extend({ kind, title: name, listing_url: nullableText, price: money,
  description: nullableText, notes: nullableText, item_id: id.nullable(), previous_evaluation_id: id.nullable(),
  input_tokens: z.number().int().nonnegative().nullable(), output_tokens: z.number().int().nonnegative().nullable(),
  cost_usd: z.number().finite().nonnegative().max(999999).nullable() });
export const evaluateRequest = z.object({ kind: kind.default('listing'), title: name, price: money,
  description: text.optional(), notes: text.optional(), listing_url: text.optional(), item_id: id.nullish(), acquisition_id: id.nullish(),
  previous_evaluation_id: id.nullish(), sale_cost_basis: money.nullish(), sale_category: nullableText.optional(), sale_condition: nullableText.optional(),
  sale_platform: nullableText.optional(), sale_counterparty: nullableText.optional(), sale_transaction_date: date.nullish(), sale_acquired_date: date.nullish()
}).superRefine((v, ctx) => {
  if ((v.kind === 'offer' || v.kind === 'grade') && !v.item_id) ctx.addIssue({ code: 'custom', message: 'Item required' });
  if (v.kind === 'grade_deal' && !v.acquisition_id) ctx.addIssue({ code: 'custom', message: 'Acquisition required' });
});
const noArgs = z.tuple([]);
export const operationArgs = {
  getSummaryStats: noArgs, getAcquisitionsPnl: noArgs, getActiveAcquisitions: noArgs,
  getRecentTransactions: z.tuple([z.number().int().min(1).max(1000).optional()]),
  createAcquisitionWithItems: z.tuple([newDeal]), createAcquisition: z.tuple([acquisition]), createItems: z.tuple([z.array(newItem).max(1000)]),
  updateAcquisition: z.tuple([id, acquisition]), splitItem: z.tuple([z.object({ id }).passthrough(), z.array(z.object({ name, cost_basis: money }).strict()).min(2).max(1000)]),
  getAcquisition: z.tuple([id]), getAcquisitionPnl: z.tuple([id]), getItemsForAcquisition: z.tuple([id]), getTransactionsForAcquisition: z.tuple([id]),
  updateItemStatus: z.tuple([id, status, nullableText.optional()]), markItemListed: z.tuple([id, money.nullable()]), markItemPending: z.tuple([id, money.nullable()]),
  createBundleListing: z.tuple([z.object({ items: z.array(z.object({ id, cost_basis: money }).strict()).min(2).max(1000).refine(v => new Set(v.map(i => i.id)).size === v.length), label: nullableText, total_listed_price: money.nullable() }).strict()]),
  getBundleMembers: z.tuple([name]), setBundlePending: z.tuple([name, money.nullable()]), undoBundlePending: z.tuple([name]), removeFromBundle: z.tuple([id]),
  getInventory: noArgs, getInventoryItems: z.tuple([id.optional()]), getAcquisitionsLite: noArgs,
  createSaleOrBundleTransaction: z.tuple([sale]), createTradeTransaction: z.tuple([trade]), markItemKept: z.tuple([id, nullableText.optional()]),
  updateTransaction: z.tuple([id, transaction]), deleteTransaction: z.tuple([id]), getClosedItemRows: noArgs,
  updateItemDetails: z.tuple([id, itemDetails]),
  getEvaluations: noArgs, getEvaluation: z.tuple([id]), updateEvaluationNotes: z.tuple([id, nullableText]), deleteEvaluation: z.tuple([id]),
  getEvaluationMessages: z.tuple([id]), getFlippyProfile: noArgs, saveFlippyProfile: z.tuple([profile]), deleteAcquisition: z.tuple([id]),
};
