"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createSaleOrBundleTransaction,
  createTradeTransaction,
  getAcquisitionsLite,
  getInventoryItems,
  markItemKept,
} from "@/lib/db";
import type { Item } from "@/lib/types";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

type Kind = "sale" | "bundle" | "trade" | "kept";

const today = new Date().toISOString().slice(0, 10);

export function TransactionForm({
  initialAcquisitionId,
  initialItemId,
  initialKind,
  initialCashAmount,
}: {
  initialAcquisitionId: number | null;
  initialItemId: number | null;
  initialKind: Kind;
  initialCashAmount?: string;
}) {
  const router = useRouter();
  const [acquisitions, setAcquisitions] = useState<{ id: number; description: string; acquired_date: string }[]>([]);
  const [acquisitionId, setAcquisitionId] = useState<number | null>(initialAcquisitionId);
  const [items, setItems] = useState<Item[]>([]);
  const [kind, setKind] = useState<Kind>(initialKind);
  const [selectedIds, setSelectedIds] = useState<number[]>(initialItemId ? [initialItemId] : []);
  const [cashAmount, setCashAmount] = useState(initialCashAmount ?? "");
  const [receivedItemName, setReceivedItemName] = useState("");
  const [date, setDate] = useState(today);
  const [platform, setPlatform] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAcquisitionsLite()
      .then(setAcquisitions)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount/dependency-change
    setLoading(true);
    getInventoryItems(acquisitionId ?? undefined)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [acquisitionId]);

  function toggleItem(itemId: number) {
    if (kind === "bundle") {
      setSelectedIds((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
    } else {
      setSelectedIds([itemId]);
    }
  }

  function handleKindChange(next: Kind) {
    setKind(next);
    if (next !== "bundle" && selectedIds.length > 1) {
      setSelectedIds(selectedIds.slice(0, 1));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedIds.length === 0) {
      setError("Select at least one item.");
      return;
    }

    const invalidItems = selectedIds.filter((id) => {
      const item = items.find((i) => i.id === id);
      return !item || (item.status !== "inventory" && item.status !== "listed" && item.status !== "pending");
    });
    if (invalidItems.length > 0) {
      setError("One or more selected items are no longer available.");
      return;
    }

    setSaving(true);
    try {
      if (kind === "sale" || kind === "bundle") {
        await createSaleOrBundleTransaction({
          itemIds: selectedIds,
          cash_amount: parseFloat(cashAmount) || 0,
          transaction_date: date,
          platform: platform || null,
          counterparty: counterparty || null,
          notes: notes.trim() || null,
        });
      } else if (kind === "trade") {
        if (!acquisitionId) {
          setError("Select an acquisition for the traded item.");
          setSaving(false);
          return;
        }
        if (!receivedItemName.trim()) {
          setError("Describe what you received in the trade.");
          setSaving(false);
          return;
        }
        await createTradeTransaction({
          outboundItemIds: selectedIds,
          acquisitionId,
          cash_amount: parseFloat(cashAmount) || 0,
          receivedItemName: receivedItemName.trim(),
          transaction_date: date,
          platform: platform || null,
          counterparty: counterparty || null,
          notes: notes.trim() || null,
        });
      } else if (kind === "kept") {
        await markItemKept(selectedIds[0], notes.trim() || null);
      }
      const dest = acquisitionId ? `/acquisitions/${acquisitionId}` : "/inventory";
      router.push(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const total = selectedIds.reduce((sum, id) => {
    const item = items.find((i) => i.id === id);
    return sum + (item?.cost_basis ?? 0);
  }, 0);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        {(
          [
            { value: "sale", label: "Sale" },
            { value: "bundle", label: "Bundle sale" },
            { value: "trade", label: "Trade" },
            { value: "kept", label: "Mark kept" },
          ] as { value: Kind; label: string }[]
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleKindChange(opt.value)}
            className={`min-h-9 flex-1 rounded-full px-2 text-xs font-medium ${
              kind === opt.value ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Select
        label="Acquisition"
        value={acquisitionId ?? ""}
        onChange={(e) => {
          setAcquisitionId(e.target.value ? Number(e.target.value) : null);
          setSelectedIds([]);
        }}
      >
        <option value="">All acquisitions</option>
        {acquisitions.map((a) => (
          <option key={a.id} value={a.id}>
            {a.description}
          </option>
        ))}
      </Select>

      <div>
        <p className="mb-1.5 text-sm font-medium text-zinc-700">
          {kind === "bundle" ? "Select items (multiple)" : "Select item"}
        </p>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading items...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500">No items available in inventory.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => {
              const selected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`flex min-h-12 items-center justify-between rounded-lg border px-3 py-2 text-left ${
                    selected ? "border-zinc-900 bg-zinc-50" : "border-zinc-300"
                  }`}
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-zinc-500">{formatCurrency(item.cost_basis)}</span>
                </button>
              );
            })}
          </div>
        )}
        {selectedIds.length > 0 && (kind === "sale" || kind === "bundle") && (
          <p className="mt-2 text-xs text-zinc-500">
            Cost basis of selected items: {formatCurrency(total)}
          </p>
        )}
      </div>

      {(kind === "sale" || kind === "bundle") && (
        <Input
          label={kind === "bundle" ? "Total sale price" : "Sale price"}
          type="number"
          inputMode="decimal"
          step="0.01"
          value={cashAmount}
          onChange={(e) => setCashAmount(e.target.value)}
          placeholder="0.00"
        />
      )}

      {kind === "trade" && (
        <>
          <Input
            label="Cash received (0 if pure trade)"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="What did you receive?"
            value={receivedItemName}
            onChange={(e) => setReceivedItemName(e.target.value)}
            placeholder="e.g. DJI Mini 3 drone"
          />
        </>
      )}

      {kind !== "kept" && (
        <>
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input
            label="Platform (optional)"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="e.g. FB Marketplace"
          />
          <Input
            label="Counterparty (optional)"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            placeholder="Who you dealt with"
          />
        </>
      )}

      <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <Button type="submit" disabled={saving} className="mt-2">
        {saving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
