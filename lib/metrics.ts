import type { ClosedItemRow } from "./db";

export interface DealSummary {
  transaction_id: number;
  date: string;
  pnl: number;
  items: string[];
}

export interface MonthlyPnl {
  month: string;
  realized_pnl: number;
  deals_closed: number;
  deals: DealSummary[];
}

export function computeMonthlyPnl(rows: ClosedItemRow[]): MonthlyPnl[] {
  const byTransaction = new Map<
    number,
    { date: string; cash_amount: number; cost_basis: number; items: string[] }
  >();
  for (const row of rows) {
    const existing = byTransaction.get(row.transaction_id);
    if (existing) {
      existing.cost_basis += row.cost_basis;
      existing.items.push(row.item_name);
    } else {
      byTransaction.set(row.transaction_id, {
        date: row.transaction_date,
        cash_amount: row.cash_amount,
        cost_basis: row.cost_basis,
        items: [row.item_name],
      });
    }
  }

  const byMonth = new Map<string, { pnl: number; deals: DealSummary[] }>();
  for (const [transactionId, tx] of byTransaction) {
    const month = tx.date.slice(0, 7);
    const pnl = tx.cash_amount - tx.cost_basis;
    const deal: DealSummary = { transaction_id: transactionId, date: tx.date, pnl, items: tx.items };
    const existing = byMonth.get(month);
    if (existing) {
      existing.pnl += pnl;
      existing.deals.push(deal);
    } else {
      byMonth.set(month, { pnl, deals: [deal] });
    }
  }

  return Array.from(byMonth.entries())
    .map(([month, { pnl, deals }]) => ({
      month,
      realized_pnl: pnl,
      deals_closed: deals.length,
      deals: deals.sort((a, b) => (a.date < b.date ? 1 : -1)),
    }))
    .sort((a, b) => (a.month < b.month ? 1 : -1));
}

export function computeAvgDaysToSell(rows: ClosedItemRow[]): number | null {
  const days = rows
    .filter((r) => r.acquired_date)
    .map((r) => {
      const acquired = new Date(`${r.acquired_date}T00:00:00`).getTime();
      const sold = new Date(`${r.transaction_date}T00:00:00`).getTime();
      return Math.round((sold - acquired) / (1000 * 60 * 60 * 24));
    });
  if (days.length === 0) return null;
  return Math.round(days.reduce((sum, d) => sum + d, 0) / days.length);
}
