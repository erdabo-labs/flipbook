"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getAcquisition,
  getAcquisitionPnl,
  getItemsForAcquisition,
  getTransactionsForAcquisition,
  updateAcquisition,
} from "@/lib/db";
import type { Acquisition, AcquisitionPnl, Item, SourceType, Transaction } from "@/lib/types";
import { SOURCES } from "@/lib/types";
import { formatCurrency, formatDate, formatPnl, pnlColorClass } from "@/lib/format";
import { ItemRow } from "@/components/ItemRow";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [form, setForm] = useState({
    description: "",
    acquired_date: "",
    total_cost: "",
    source: "",
    source_type: "flip_purchase" as SourceType,
    deal_group: "",
    notes: "",
  });

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

  function startEdit() {
    if (!acquisition) return;
    setForm({
      description: acquisition.description,
      acquired_date: acquisition.acquired_date,
      total_cost: String(acquisition.total_cost),
      source: acquisition.source ?? "",
      source_type: acquisition.source_type,
      deal_group: acquisition.deal_group ?? "",
      notes: acquisition.notes ?? "",
    });
    setEditError(null);
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!acquisition) return;
    if (!form.description.trim() || !form.total_cost) {
      setEditError("Description and total cost are required.");
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      await updateAcquisition(acquisition.id, {
        description: form.description.trim(),
        acquired_date: form.acquired_date,
        total_cost: parseFloat(form.total_cost) || 0,
        source: form.source || null,
        source_type: form.source_type,
        deal_group: form.deal_group.trim() || null,
        notes: form.notes.trim() || null,
      });
      await load();
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!acquisition || !pnl) return <p className="p-6 text-sm text-zinc-500">Deal not found.</p>;

  const allocated = items.reduce((sum, i) => sum + i.cost_basis, 0);
  const allocationMismatch = Math.abs(allocated - acquisition.total_cost) > 0.01;
  const hasInventory = pnl.items_in_inventory > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {editing ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <p className="font-medium">Edit deal</p>
          {editError && <p className="text-sm text-red-600">{editError}</p>}
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Date"
            type="date"
            value={form.acquired_date}
            onChange={(e) => setForm({ ...form, acquired_date: e.target.value })}
          />
          <Input
            label="Total cost"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.total_cost}
            onChange={(e) => setForm({ ...form, total_cost: e.target.value })}
          />
          <Select
            label="Source"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            label="Source type"
            value={form.source_type}
            onChange={(e) => setForm({ ...form, source_type: e.target.value as SourceType })}
          >
            <option value="flip_purchase">Flip purchase</option>
            <option value="personal_item">Personal item</option>
          </Select>
          <Input
            label="Deal group (optional)"
            value={form.deal_group}
            onChange={(e) => setForm({ ...form, deal_group: e.target.value })}
          />
          <Textarea
            label="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="mt-1 flex gap-2">
            <Button variant="secondary" type="button" onClick={() => setEditing(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{acquisition.description}</h1>
            <button type="button" onClick={startEdit} className="mt-1 shrink-0 text-sm text-zinc-500 underline">
              Edit
            </button>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {formatDate(acquisition.acquired_date)}
            {acquisition.source && <> &middot; {acquisition.source}</>}
          </p>
          {acquisition.deal_group && (
            <Badge className="mt-2">{acquisition.deal_group}</Badge>
          )}
          {acquisition.notes && <p className="mt-2 text-sm text-zinc-600">{acquisition.notes}</p>}
        </div>
      )}

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
