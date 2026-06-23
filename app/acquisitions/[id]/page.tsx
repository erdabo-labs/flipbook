"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getAcquisition,
  getAcquisitionPnl,
  getItemsForAcquisition,
  getTransactionsForAcquisition,
} from "@/lib/db";
import type { Acquisition, AcquisitionPnl, Item, Transaction } from "@/lib/types";
import { formatCurrency, formatDate, formatPnl, pnlColorClass } from "@/lib/format";
import { ItemRow } from "@/components/ItemRow";
import { LinkButton } from "@/components/ui/Button";
import { LoadingState, EmptyState } from "@/components/ui/Empty";
import { Badge } from "@/components/ui/Badge";

type RecentTx = Transaction & { items: { item_id: number; item_name: string; direction: string }[] };

export default function AcquisitionDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [acquisition, setAcquisition] = useState<Acquisition | null>(null);
  const [pnl, setPnl] = useState<AcquisitionPnl | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<RecentTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, p, i, t] = await Promise.all([
        getAcquisition(id),
        getAcquisitionPnl(id),
        getItemsForAcquisition(id),
        getTransactionsForAcquisition(id),
      ]);
      setAcquisition(a);
      setPnl(p);
      setItems(i);
      setTransactions(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!acquisition || !pnl) return <p className="p-6 text-sm text-zinc-500">Deal not found.</p>;

  const allocated = items.reduce((sum, i) => sum + i.cost_basis, 0);
  const allocationMismatch = Math.abs(allocated - acquisition.total_cost) > 0.01;
  const hasInventory = pnl.items_in_inventory > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{acquisition.description}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {formatDate(acquisition.acquired_date)}
          {acquisition.source && <> &middot; {acquisition.source}</>}
        </p>
        {acquisition.deal_group && (
          <Badge className="mt-2">{acquisition.deal_group}</Badge>
        )}
        {acquisition.notes && <p className="mt-2 text-sm text-zinc-600">{acquisition.notes}</p>}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Cost</span>
          <span className="font-medium">{formatCurrency(acquisition.total_cost)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-zinc-500">Cash received</span>
          <span className="font-medium">{formatCurrency(pnl.cash_received)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2">
          <span className="font-medium">Realized P&L</span>
          <span className={`text-lg font-semibold ${pnlColorClass(pnl.realized_pnl)}`}>
            {formatPnl(pnl.realized_pnl)}
          </span>
        </div>
        {hasInventory && (
          <p className="mt-2 text-xs text-amber-600">
            {pnl.items_in_inventory} item{pnl.items_in_inventory === 1 ? "" : "s"} still pending sale
          </p>
        )}
        {allocationMismatch && (
          <p className="mt-1 text-xs text-amber-600">
            Allocated cost basis ({formatCurrency(allocated)}) doesn&apos;t match total cost.
          </p>
        )}
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Items</h2>
        {items.length === 0 ? (
          <EmptyState title="No items yet" />
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} onChanged={load} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transactions</h2>
          <LinkButton href={`/transactions/new?acquisition_id=${id}`} variant="secondary">
            + Record
          </LinkButton>
        </div>
        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet" description="Record a sale, trade, or bundle sale." />
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((t) => (
              <div key={t.id} className="rounded-xl border border-zinc-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{t.type.replace("_", " ")}</span>
                  <span className={`text-sm font-semibold ${pnlColorClass(t.cash_amount)}`}>
                    {formatPnl(t.cash_amount)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{formatDate(t.transaction_date)}</p>
                <p className="mt-1 text-sm text-zinc-700">
                  {t.items.map((i) => `${i.direction === "outbound" ? "−" : "+"} ${i.item_name}`).join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
