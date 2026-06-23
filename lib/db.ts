import { supabase } from "./supabase";
import type {
  Acquisition,
  AcquisitionPnl,
  CurrentInventoryRow,
  Item,
  ItemCondition,
  ItemStatus,
  SourceType,
  SummaryStats,
  Transaction,
  TransactionItem,
  TransactionType,
} from "./types";

interface TransactionItemWithName {
  transaction_id: number;
  item_id: number;
  direction: string;
  item: { name: string } | null;
}

export async function getSummaryStats(): Promise<SummaryStats> {
  const { data, error } = await supabase
    .from("summary_stats")
    .select("*")
    .single();
  if (error) throw error;
  return data as SummaryStats;
}

export async function getAcquisitionsPnl(): Promise<AcquisitionPnl[]> {
  const { data, error } = await supabase
    .from("acquisition_pnl")
    .select("*")
    .order("acquired_date", { ascending: false });
  if (error) throw error;
  return data as AcquisitionPnl[];
}

export async function getActiveAcquisitions(): Promise<AcquisitionPnl[]> {
  const all = await getAcquisitionsPnl();
  return all.filter((a) => a.items_in_inventory > 0);
}

export async function getRecentTransactions(limitCount = 5): Promise<
  (Transaction & { items: { item_id: number; item_name: string; direction: string }[] })[]
> {
  const { data: transactions, error } = await supabase
    .from("transaction")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limitCount);
  if (error) throw error;
  if (!transactions || transactions.length === 0) return [];

  const ids = transactions.map((t) => t.id);
  const { data: tis, error: tiError } = await supabase
    .from("transaction_item")
    .select("transaction_id, item_id, direction, item(name)")
    .in("transaction_id", ids);
  if (tiError) throw tiError;

  const typedTis = (tis || []) as unknown as TransactionItemWithName[];

  return transactions.map((t) => ({
    ...t,
    items: typedTis
      .filter((ti) => ti.transaction_id === t.id)
      .map((ti) => ({
        item_id: ti.item_id,
        item_name: ti.item?.name ?? "Unknown item",
        direction: ti.direction,
      })),
  }));
}

export async function createAcquisition(input: {
  description: string;
  acquired_date: string;
  total_cost: number;
  source: string | null;
  source_type: SourceType;
  deal_group: string | null;
  notes: string | null;
}): Promise<Acquisition> {
  const { data, error } = await supabase
    .from("acquisition")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Acquisition;
}

export async function createItems(
  items: {
    acquisition_id: number;
    name: string;
    category: string | null;
    cost_basis: number;
    condition: ItemCondition | null;
    used_personally: boolean;
    notes: string | null;
  }[]
): Promise<Item[]> {
  if (items.length === 0) return [];
  const { data, error } = await supabase.from("item").insert(items).select();
  if (error) throw error;
  return data as Item[];
}

export async function getAcquisition(id: number): Promise<Acquisition | null> {
  const { data, error } = await supabase
    .from("acquisition")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Acquisition;
}

export async function getAcquisitionPnl(id: number): Promise<AcquisitionPnl | null> {
  const { data, error } = await supabase
    .from("acquisition_pnl")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as AcquisitionPnl;
}

export async function getItemsForAcquisition(acquisitionId: number): Promise<Item[]> {
  const { data, error } = await supabase
    .from("item")
    .select("*")
    .eq("acquisition_id", acquisitionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Item[];
}

export async function getTransactionsForAcquisition(
  acquisitionId: number
): Promise<
  (Transaction & { items: { item_id: number; item_name: string; direction: string }[] })[]
> {
  const items = await getItemsForAcquisition(acquisitionId);
  const itemIds = items.map((i) => i.id);
  if (itemIds.length === 0) return [];

  const { data: tis, error: tiError } = await supabase
    .from("transaction_item")
    .select("transaction_id, item_id, direction, item(name)")
    .in("item_id", itemIds);
  if (tiError) throw tiError;
  if (!tis || tis.length === 0) return [];

  const typedTis = tis as unknown as TransactionItemWithName[];
  const txIds = Array.from(new Set(typedTis.map((ti) => ti.transaction_id)));

  const { data: transactions, error } = await supabase
    .from("transaction")
    .select("*")
    .in("id", txIds)
    .order("transaction_date", { ascending: false });
  if (error) throw error;

  return (transactions || []).map((t) => ({
    ...t,
    items: typedTis
      .filter((ti) => ti.transaction_id === t.id)
      .map((ti) => ({
        item_id: ti.item_id,
        item_name: ti.item?.name ?? "Unknown item",
        direction: ti.direction,
      })),
  }));
}

export async function updateItemStatus(
  itemId: number,
  status: ItemStatus,
  notes?: string | null
): Promise<void> {
  const update: { status: ItemStatus; notes?: string | null } = { status };
  if (notes !== undefined) update.notes = notes;
  const { error } = await supabase.from("item").update(update).eq("id", itemId);
  if (error) throw error;
}

export async function getInventory(): Promise<CurrentInventoryRow[]> {
  const { data, error } = await supabase
    .from("current_inventory")
    .select("*")
    .order("acquired_date", { ascending: false });
  if (error) throw error;
  return data as CurrentInventoryRow[];
}

export async function getInventoryItems(acquisitionId?: number): Promise<Item[]> {
  let query = supabase
    .from("item")
    .select("*")
    .in("status", ["inventory", "listed"])
    .order("created_at", { ascending: true });
  if (acquisitionId) {
    query = query.eq("acquisition_id", acquisitionId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Item[];
}

export async function getAcquisitionsLite(): Promise<
  { id: number; description: string; acquired_date: string }[]
> {
  const { data, error } = await supabase
    .from("acquisition")
    .select("id, description, acquired_date")
    .order("acquired_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createSaleOrBundleTransaction(input: {
  itemIds: number[];
  cash_amount: number;
  transaction_date: string;
  platform: string | null;
  counterparty: string | null;
  notes: string | null;
}): Promise<Transaction> {
  const isBundle = input.itemIds.length > 1;

  const { data: tx, error: txError } = await supabase
    .from("transaction")
    .insert({
      type: "sale",
      transaction_date: input.transaction_date,
      cash_amount: input.cash_amount,
      platform: input.platform,
      counterparty: input.counterparty,
      notes: input.notes,
    })
    .select()
    .single();
  if (txError) throw txError;

  const tiRows: Omit<TransactionItem, "id">[] = input.itemIds.map((itemId) => ({
    transaction_id: tx.id,
    item_id: itemId,
    direction: "outbound" as const,
  }));
  const { error: tiError } = await supabase.from("transaction_item").insert(tiRows);
  if (tiError) throw tiError;

  if (isBundle) {
    const { error: statusError } = await supabase
      .from("item")
      .update({ status: "bundled" })
      .in("id", input.itemIds);
    if (statusError) throw statusError;
  }
  const { error: soldError } = await supabase
    .from("item")
    .update({ status: "sold" })
    .in("id", input.itemIds);
  if (soldError) throw soldError;

  return tx as Transaction;
}

export async function createTradeTransaction(input: {
  outboundItemIds: number[];
  acquisitionId: number;
  cash_amount: number;
  receivedItemName: string;
  transaction_date: string;
  platform: string | null;
  counterparty: string | null;
  notes: string | null;
}): Promise<Transaction> {
  const type: TransactionType = input.cash_amount > 0 ? "partial_trade" : "trade";

  const { data: tx, error: txError } = await supabase
    .from("transaction")
    .insert({
      type,
      transaction_date: input.transaction_date,
      cash_amount: input.cash_amount,
      platform: input.platform,
      counterparty: input.counterparty,
      notes: input.notes,
    })
    .select()
    .single();
  if (txError) throw txError;

  const outboundRows: Omit<TransactionItem, "id">[] = input.outboundItemIds.map(
    (itemId) => ({
      transaction_id: tx.id,
      item_id: itemId,
      direction: "outbound" as const,
    })
  );
  const { error: outError } = await supabase
    .from("transaction_item")
    .insert(outboundRows);
  if (outError) throw outError;

  const { error: statusError } = await supabase
    .from("item")
    .update({ status: "traded" })
    .in("id", input.outboundItemIds);
  if (statusError) throw statusError;

  const { data: newItem, error: itemError } = await supabase
    .from("item")
    .insert({
      acquisition_id: input.acquisitionId,
      name: input.receivedItemName,
      cost_basis: 0,
      status: "inventory",
    })
    .select()
    .single();
  if (itemError) throw itemError;

  const { error: inError } = await supabase.from("transaction_item").insert({
    transaction_id: tx.id,
    item_id: newItem.id,
    direction: "inbound",
  });
  if (inError) throw inError;

  return tx as Transaction;
}

export async function markItemKept(itemId: number, notes?: string | null): Promise<void> {
  await updateItemStatus(itemId, "kept", notes ?? undefined);
}
