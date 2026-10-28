"use client";

import { useDraft } from "@/lib/use-draft";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createSaleOrBundleTransaction,
  createTradeTransaction,
  getAcquisitionsLite,
  getInventoryItems,
  markItemKept,
} from "@/lib/db-client";
import type { Item } from "@/lib/types";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

type Kind = "sale" | "bundle" | "trade" | "kept";

const today = new Date().toISOString().slice(0, 10);

export function TransactionForm({
  initialAcquisitionId,
  initialItemIds,
  initialKind,
  initialCashAmount,
}: {
  initialAcquisitionId: number | null;
  initialItemIds: number[];
  initialKind: Kind;
  initialCashAmount?: string;
}) {
  const router = useRouter();
  const [acquisitions, setAcquisitions] = useState<{ id: number; description: string; acquired_date: string }[]>([]);
  const [acquisitionId, setAcquisitionId, clearAcquisitionId] = useDraft<number | null>(`transaction:${initialAcquisitionId}:${initialItemIds.join(",")}:${initialKind}:acquisitionId`, initialAcquisitionId);
  const [items, setItems] = useState<Item[]>([]);
  const [kind, setKind, clearKind] = useDraft<Kind>(`transaction:${initialAcquisitionId}:${initialItemIds.join(",")}:${initialKind}:kind`, initialKind);
  const [selectedIds, setSelectedIds, clearSelectedIds] = useDraft<number[]>(`transaction:${initialAcquisitionId}:${initialItemIds.join(",")}:${initialKind}:selectedIds`, initialItemIds);
  const [cashAmount, setCashAmount, clearCashAmount] = useDraft(`transaction:${initialAcquisitionId}:${initialItemIds.join(",")}:${initialKind}:cashAmount`, initialCashAmount ?? "");
  const [receivedItemName, setReceivedItemName, clearReceivedItemName] = useDraft(`transaction:${initialAcquisitionId}:${initialItemIds.join(",")}:${initialKind}:receivedItemName`, "");
  const [date, setDate, clearDate] = useDraft(`transaction:${initialAcquisitionId}:${initialItemIds.join(",")}:${initialKind}:date`, today);
  const [platform, setPlatform, clearPlatform] = useDraft(`transaction:${initialAcquisitionId}:${initialItemIds.join(",")}:${initialKind}:platform`, "");
  const [counterparty, setCounterparty, clearCounterparty] = useDraft(`transaction:${initialAcquisitionId}:${initialItemIds.join(",")}:${initialKind}:counterparty`, "");
  const [notes, setNotes, clearNotes] = useDraft(`transaction:${initialAcquisitionId}:${initialItemIds.join(",")}:${initialKind}:notes`, "");
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
      clearAcquisitionId(); clearKind(); clearSelectedIds(); clearCashAmount(); clearReceivedItemName(); clearDate(); clearPlatform(); clearCounterparty(); clearNotes();
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
    <div className="form-workspace"><form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-xs text-[#6B6A62]">Draft saved in this tab. <button type="button" className="min-h-11 underline" onClick={() => { clearAcquisitionId(); clearKind(); clearSelectedIds(); clearCashAmount(); clearReceivedItemName(); clearDate(); clearPlatform(); clearCounterparty(); clearNotes(); }}>Discard draft</button></p>
      {error && <p className="text-sm text-[#DC2626]">{error}</p>}

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
              kind === opt.value ? "bg-[#1A1A17] text-white" : "bg-[#F4F2EC] text-[#8C887D]"
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
        <p className="mb-1.5 text-sm font-medium text-[#1A1A17]">
          {kind === "bundle" ? "Select items (multiple)" : "Select item"}
        </p>
        {loading ? (
          <p className="text-sm text-[#8C887D]">Loading items...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[#8C887D]">No items available in inventory.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => {
              const selected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`flex min-h-12 items-center justify-between rounded-[12px] border px-3 py-2 text-left ${
                    selected ? "border-[#047857] bg-[#ECFDF5]" : "border-[#E3E0D7]"
                  }`}
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-[#8C887D]">{formatCurrency(item.cost_basis)}</span>
                </button>
              );
            })}
          </div>
        )}
        {selectedIds.length > 0 && (kind === "sale" || kind === "bundle") && (
          <p className="mt-2 text-xs text-[#8C887D]">
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
          className="font-mono"
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

      <Button type="submit" disabled={saving} className="mt-2 w-full">
        {saving
          ? "Saving..."
          : kind === "sale" || kind === "bundle"
            ? `Record sale${cashAmount ? ` · +${formatCurrency(parseFloat(cashAmount) || 0)}` : ""}`
            : "Save"}
      </Button>
    </form><aside className="form-summary" aria-label="Transaction summary">
      <h2 className="mb-3 font-bold">Transaction summary</h2>
      <p className="mb-2 capitalize">{kind === "kept" ? "Keep personally" : kind}</p>
      <p className="text-sm">{selectedIds.length} selected · cost {formatCurrency(total)}</p>
      {kind !== "kept" && <p className="mt-3 font-mono text-xl">Cash {formatCurrency(parseFloat(cashAmount) || 0)}</p>}
      {kind === "trade" && <p className="mt-3 break-words text-sm">Receiving: {receivedItemName || "Not entered"}</p>}
    </aside></div>
  );
}
