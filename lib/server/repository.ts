import 'server-only';
import type { z } from 'zod';
import type * as V from './validation';
import { splitAmount } from '../format';
import type { Acquisition, AcquisitionPnl, Item, Transaction, CurrentInventoryRow, SummaryStats, Evaluation, EvaluationMessage, FlippyProfile, ClosedItemRow, ItemStatus } from '../types';
import type { SqlClient } from './postgres';
import { HttpError } from './errors';

type TxWithItems = Transaction & { items: { item_id: number; item_name: string; direction: string }[] };
type Table = 'acquisition' | 'item' | 'transaction' | 'evaluation' | 'flippy_profile';
// SQL identifiers only originate from these internal allowlists, never request keys.
const columns = {
  acquisition: ['description', 'acquired_date', 'total_cost', 'source', 'source_type', 'deal_group', 'notes'],
  item: ['acquisition_id', 'name', 'category', 'cost_basis', 'condition', 'used_personally', 'notes', 'status', 'listed_price', 'pending_price', 'bundle_id', 'bundle_label'],
  transaction: ['type', 'transaction_date', 'cash_amount', 'platform', 'counterparty', 'notes'],
  evaluation: ['kind', 'title', 'listing_url', 'price', 'description', 'notes', 'item_id', 'score', 'verdict', 'estimated_resale_low', 'estimated_resale_high', 'reasoning', 'red_flags', 'suggested_offer', 'suggested_message', 'previous_evaluation_id', 'input_tokens', 'output_tokens', 'cost_usd'],
  flippy_profile: ['location', 'platforms', 'ships_items', 'style_notes'],
} as const;

export class Repository {
  constructor(private readonly client: SqlClient) {}
  private async rows<T>(sql: string, values: unknown[] = []): Promise<T[]> {
    return (await this.client.query(sql, values)).rows as T[];
  }
  private async one<T>(sql: string, values: unknown[] = []): Promise<T | null> { return (await this.rows<T>(sql, values))[0] ?? null; }
  private async insert<T>(table: Table, input: object): Promise<T> {
    const data = input as Record<string, unknown>;
    const keys = columns[table].filter(k => data[k] !== undefined);
    const values = keys.map(k => k === 'red_flags' ? JSON.stringify(data[k]) : data[k]);
    return (await this.one<T>(`INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`, values))!;
  }
  private async update<T>(table: Table, id: number, input: object): Promise<T> {
    const data = input as Record<string, unknown>;
    const keys = columns[table].filter(k => data[k] !== undefined);
    const result = await this.one<T>(`UPDATE "${table}" SET ${keys.map((k, i) => `"${k}" = $${i + 2}`).join(',')} WHERE id = $1 RETURNING *`, [id, ...keys.map(k => data[k])]);
    if (!result) throw new HttpError(404, 'Record not found');
    return result;
  }
  async getSummaryStats() { return (await this.one<SummaryStats>('SELECT * FROM summary_stats'))!; }
  getAcquisitionsPnl() { return this.rows<AcquisitionPnl>('SELECT * FROM acquisition_pnl ORDER BY acquired_date DESC'); }
  async getActiveAcquisitions() { return (await this.getAcquisitionsPnl()).filter(a => a.items_in_inventory > 0); }
  private async attachItems(transactions: Transaction[], acquisitionId?: number): Promise<TxWithItems[]> {
    if (!transactions.length) return [];
    const items = await this.rows<{ transaction_id: number; item_id: number; item_name: string; direction: string }>(
      `SELECT ti.transaction_id, ti.item_id, ti.direction, COALESCE(i.name, 'Unknown item') AS item_name
       FROM transaction_item ti LEFT JOIN item i ON i.id = ti.item_id
       WHERE ti.transaction_id = ANY($1::bigint[]) ${acquisitionId === undefined ? '' : 'AND i.acquisition_id = $2'} ORDER BY ti.id`,
      acquisitionId === undefined ? [transactions.map(t => t.id)] : [transactions.map(t => t.id), acquisitionId]);
    return transactions.map(t => ({ ...t, items: items.filter(i => i.transaction_id === t.id).map(({ item_id, item_name, direction }) => ({ item_id, item_name, direction })) }));
  }
  async getRecentTransactions(limitCount = 5) {
    return this.attachItems(await this.rows<Transaction>('SELECT * FROM "transaction" ORDER BY transaction_date DESC, created_at DESC LIMIT $1', [limitCount]));
  }
  async createAcquisitionWithItems(input: z.infer<typeof V.newDeal>) {
    const deal = await this.createAcquisition(input.deal);
    await this.createItems(input.items.map(i => ({ ...i, acquisition_id: deal.id })));
    return deal;
  }
  createAcquisition(input: z.infer<typeof V.acquisition>) { return this.insert<Acquisition>('acquisition', input); }
  async createItems(items: z.infer<typeof V.newItem>[]) {
    const results: Item[] = [];
    for (const item of items) results.push(await this.insert<Item>('item', item));
    return results;
  }
  async updateAcquisition(id: number, input: z.infer<typeof V.acquisition>) { await this.update('acquisition', id, input); }
  async splitItem(input: { id: number }, parts: { name: string; cost_basis: number }[]) {
    const item = await this.one<Item>('SELECT * FROM item WHERE id = $1 FOR UPDATE', [input.id]);
    if (!item || !['inventory', 'listed', 'pending'].includes(item.status)) throw new HttpError(409, 'Item cannot be split');
    const referenced = await this.rows('SELECT id FROM transaction_item WHERE item_id = $1', [item.id]);
    if (referenced.length) throw new HttpError(409, 'Items with transaction history cannot be split');
    if (parts.reduce((s, p) => s + Math.round(p.cost_basis * 100), 0) !== Math.round(item.cost_basis * 100)) throw new HttpError(409, 'Split costs must equal original cost');
    await this.createItems(parts.map(p => ({ acquisition_id: item.acquisition_id, name: p.name, cost_basis: p.cost_basis,
      category: item.category, condition: item.condition, used_personally: item.used_personally, notes: item.notes })));
    await this.client.query('DELETE FROM item WHERE id = $1', [item.id]);
  }
  getItem(id: number) { return this.one<Item>('SELECT * FROM item WHERE id = $1', [id]); }
  getAcquisition(id: number) { return this.one<Acquisition>('SELECT * FROM acquisition WHERE id = $1', [id]); }
  getAcquisitionPnl(id: number) { return this.one<AcquisitionPnl>('SELECT * FROM acquisition_pnl WHERE id = $1', [id]); }
  getItemsForAcquisition(id: number) { return this.rows<Item>('SELECT * FROM item WHERE acquisition_id = $1 ORDER BY created_at ASC', [id]); }
  async getTransactionsForAcquisition(id: number) {
    return this.attachItems(await this.rows<Transaction>(`SELECT t.* FROM "transaction" t WHERE EXISTS (
      SELECT 1 FROM transaction_item ti JOIN item i ON i.id = ti.item_id WHERE ti.transaction_id = t.id AND i.acquisition_id = $1)
      ORDER BY t.transaction_date DESC`, [id]), id);
  }
  async updateItemStatus(id: number, status: ItemStatus, notes?: string | null) { await this.update('item', id, { status, notes }); }
  async markItemListed(id: number, listed_price: number | null) { await this.update('item', id, { status: 'listed', listed_price }); }
  async markItemPending(id: number, pending_price: number | null) { await this.update('item', id, { status: 'pending', pending_price }); }
  private async lockItems(ids: number[], available = true) {
    const items = await this.rows<Item>('SELECT * FROM item WHERE id = ANY($1::bigint[]) ORDER BY id FOR UPDATE', [ids]);
    if (items.length !== ids.length || (available && items.some(i => !['inventory', 'listed', 'pending'].includes(i.status)))) throw new HttpError(409, 'Selected items are no longer available');
    return items;
  }
  async createBundleListing(input: { items: { id: number; cost_basis: number }[]; label: string | null; total_listed_price: number | null }) {
    const members = await this.lockItems(input.items.map(i => i.id));
    const bundleId = crypto.randomUUID();
    const shares = input.total_listed_price === null ? members.map(() => null) : splitAmount(input.total_listed_price, members.map(m => m.cost_basis));
    for (let i = 0; i < members.length; i++) await this.update('item', members[i].id, { bundle_id: bundleId, bundle_label: input.label, status: 'listed', listed_price: shares[i] });
    return bundleId;
  }
  getBundleMembers(id: string) { return this.rows<Item>('SELECT * FROM item WHERE bundle_id = $1 ORDER BY id', [id]); }
  async setBundlePending(id: string, total: number | null) {
    const members = await this.rows<Item>('SELECT * FROM item WHERE bundle_id = $1 ORDER BY id FOR UPDATE', [id]);
    if (members.some(i => !['inventory', 'listed', 'pending'].includes(i.status))) throw new HttpError(409, 'Bundle contains unavailable items');
    const shares = total === null ? members.map(() => null) : splitAmount(total, members.map(m => m.cost_basis));
    for (let i = 0; i < members.length; i++) await this.markItemPending(members[i].id, shares[i]);
  }
  async undoBundlePending(id: string) { await this.client.query("UPDATE item SET status = 'listed' WHERE bundle_id = $1 AND status = 'pending'", [id]); }
  async removeFromBundle(id: number) { await this.update('item', id, { bundle_id: null, bundle_label: null }); }
  getInventory() { return this.rows<CurrentInventoryRow>('SELECT * FROM current_inventory ORDER BY acquired_date DESC'); }
  getInventoryItems(id?: number) {
    return this.rows<Item>(`SELECT * FROM item WHERE status = ANY($1::text[]) ${id === undefined ? '' : 'AND acquisition_id = $2'} ORDER BY created_at ASC`, id === undefined ? [['inventory', 'listed', 'pending']] : [['inventory', 'listed', 'pending'], id]);
  }
  getAcquisitionsLite() { return this.rows<Pick<Acquisition, 'id' | 'description' | 'acquired_date'>>('SELECT id, description, acquired_date FROM acquisition ORDER BY acquired_date DESC'); }
  private async link(transactionId: number, itemId: number, direction: string) {
    await this.client.query('INSERT INTO transaction_item (transaction_id, item_id, direction) VALUES ($1, $2, $3)', [transactionId, itemId, direction]);
  }
  async createSaleOrBundleTransaction(input: z.infer<typeof V.sale>) {
    await this.lockItems(input.itemIds);
    const tx = await this.insert<Transaction>('transaction', { ...input, type: 'sale' });
    for (const id of input.itemIds) await this.link(tx.id, id, 'outbound');
    await this.client.query("UPDATE item SET status = 'sold' WHERE id = ANY($1::bigint[])", [input.itemIds]);
    return tx;
  }
  async createTradeTransaction(input: z.infer<typeof V.trade>) {
    await this.lockItems(input.outboundItemIds);
    const tx = await this.insert<Transaction>('transaction', { ...input, type: input.cash_amount > 0 ? 'partial_trade' : 'trade' });
    for (const id of input.outboundItemIds) await this.link(tx.id, id, 'outbound');
    await this.client.query("UPDATE item SET status = 'traded' WHERE id = ANY($1::bigint[])", [input.outboundItemIds]);
    const received = await this.insert<Item>('item', { acquisition_id: input.acquisitionId, name: input.receivedItemName, cost_basis: 0, status: 'inventory' });
    await this.link(tx.id, received.id, 'inbound');
    return tx;
  }
  async markItemKept(id: number, notes?: string | null) { await this.updateItemStatus(id, 'kept', notes ?? undefined); }
  async updateTransaction(id: number, input: z.infer<typeof V.transaction>) { await this.update('transaction', id, input); }
  async deleteTransaction(id: number) {
    await this.client.query('SELECT id FROM "transaction" WHERE id = $1 FOR UPDATE', [id]);
    const links = await this.rows<{ item_id: number; direction: string }>('SELECT item_id, direction FROM transaction_item WHERE transaction_id = $1', [id]);
    const inbound = links.filter(l => l.direction === 'inbound').map(l => l.item_id);
    const outbound = links.filter(l => l.direction === 'outbound').map(l => l.item_id);
    // A received item may have since been sold/traded. Refuse undo rather than corrupt its later history.
    if (inbound.length && (await this.rows('SELECT id FROM transaction_item WHERE item_id = ANY($1::bigint[]) AND transaction_id <> $2', [inbound, id])).length) throw new HttpError(409, 'Undo later transactions on received items first');
    if (outbound.length) await this.lockItems(outbound, false);
    // Remove inbound links before their items to respect the non-cascading item FK.
    await this.client.query('DELETE FROM "transaction" WHERE id = $1', [id]);
    if (outbound.length) await this.client.query("UPDATE item SET status = 'inventory' WHERE id = ANY($1::bigint[])", [outbound]);
    if (inbound.length) await this.client.query('DELETE FROM item WHERE id = ANY($1::bigint[])', [inbound]);
  }
  getClosedItemRows() { return this.rows<ClosedItemRow>(`SELECT ti.transaction_id, t.transaction_date, t.cash_amount,
    COALESCE(i.cost_basis, 0) AS cost_basis, a.acquired_date, COALESCE(i.name, 'Unknown item') AS item_name
    FROM transaction_item ti JOIN "transaction" t ON t.id = ti.transaction_id
    LEFT JOIN item i ON i.id = ti.item_id LEFT JOIN acquisition a ON a.id = i.acquisition_id WHERE ti.direction = $1`, ['outbound']); }
  async updateItemDetails(id: number, input: z.infer<typeof V.itemDetails>) { await this.update('item', id, input); }
  createEvaluation(input: z.infer<typeof V.evaluation>) { return this.insert<Evaluation>('evaluation', input); }
  getEvaluations() { return this.rows<Evaluation>('SELECT * FROM evaluation ORDER BY created_at DESC'); }
  getEvaluation(id: number) { return this.one<Evaluation>('SELECT * FROM evaluation WHERE id = $1', [id]); }
  updateEvaluationNotes(id: number, notes: string | null) { return this.update<Evaluation>('evaluation', id, { notes }); }
  async deleteEvaluation(id: number) { await this.client.query('DELETE FROM evaluation WHERE id = $1', [id]); }
  getEvaluationMessages(id: number) { return this.rows<EvaluationMessage>('SELECT * FROM evaluation_message WHERE evaluation_id = $1 ORDER BY created_at ASC, id ASC', [id]); }
  getFlippyProfile() { return this.one<FlippyProfile>('SELECT * FROM flippy_profile WHERE id = $1', [1]); }
  async saveFlippyProfile(input: z.infer<typeof V.profile>) {
    return (await this.one<FlippyProfile>(`INSERT INTO flippy_profile (id, location, platforms, ships_items, style_notes, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW()) ON CONFLICT (id) DO UPDATE SET location = EXCLUDED.location, platforms = EXCLUDED.platforms,
      ships_items = EXCLUDED.ships_items, style_notes = EXCLUDED.style_notes, updated_at = NOW() RETURNING *`, [1, input.location, input.platforms, input.ships_items, input.style_notes]))!;
  }
  async deleteAcquisition(id: number) {
    await this.client.query('SELECT id FROM acquisition WHERE id = $1 FOR UPDATE', [id]);
    const items = await this.rows<Item>('SELECT * FROM item WHERE acquisition_id = $1 ORDER BY id FOR UPDATE', [id]);
    const txs = await this.rows<{ transaction_id: number }>('SELECT DISTINCT transaction_id FROM transaction_item WHERE item_id = ANY($1::bigint[])', [items.map(i => i.id)]);
    const txIds = txs.map(t => t.transaction_id);
    if (txIds.length) {
      // Delete the whole deal's history together, regardless of trade/sale ordering.
      // Items on a cross-acquisition bundle sale also return to inventory.
      await this.client.query(`UPDATE item SET status = 'inventory' WHERE acquisition_id <> $1 AND id IN (
        SELECT item_id FROM transaction_item WHERE transaction_id = ANY($2::bigint[]) AND direction = $3)`, [id, txIds, 'outbound']);
      await this.client.query('DELETE FROM "transaction" WHERE id = ANY($1::bigint[])', [txIds]);
    }
    await this.client.query('DELETE FROM acquisition WHERE id = $1', [id]);
  }
  async saveChat(id: number, question: string, answer: string, inputTokens: number | null, outputTokens: number | null, cost: number | null) {
    await this.client.query(`INSERT INTO evaluation_message (evaluation_id, role, content, input_tokens, output_tokens, cost_usd)
      VALUES ($1, $2, $3, NULL, NULL, NULL), ($1, $4, $5, $6, $7, $8)`, [id, 'user', question, 'assistant', answer, inputTokens, outputTokens, cost]);
  }
}
