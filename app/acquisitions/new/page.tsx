"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAcquisition, createItems } from "@/lib/db";
import { CATEGORIES, CONDITIONS, SOURCES } from "@/lib/types";
import type { ItemCondition, SourceType } from "@/lib/types";
import { Input, Select, Textarea, Toggle } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

interface DealInfo {
  description: string;
  acquired_date: string;
  total_cost: string;
  source: string;
  source_type: SourceType;
  deal_group: string;
  notes: string;
}

interface DraftItem {
  name: string;
  category: string;
  cost_basis: string;
  condition: ItemCondition | "";
  used_personally: boolean;
  notes: string;
}

const today = new Date().toISOString().slice(0, 10);

function emptyItem(): DraftItem {
  return { name: "", category: "", cost_basis: "", condition: "", used_personally: false, notes: "" };
}

export default function NewAcquisitionPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acquisitionId, setAcquisitionId] = useState<number | null>(null);
  const [singleItem, setSingleItem] = useState(false);

  const [deal, setDeal] = useState<DealInfo>({
    description: "",
    acquired_date: today,
    total_cost: "",
    source: SOURCES[0],
    source_type: "flip_purchase",
    deal_group: "",
    notes: "",
  });

  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);

  const totalCostNum = parseFloat(deal.total_cost) || 0;
  const allocated = items.reduce((sum, i) => sum + (parseFloat(i.cost_basis) || 0), 0);
  const diff = totalCostNum - allocated;

  async function handleDealSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!deal.description.trim() || !deal.total_cost) {
      setError("Description and total cost are required.");
      return;
    }
    setSaving(true);
    try {
      const acquisition = await createAcquisition({
        description: deal.description.trim(),
        acquired_date: deal.acquired_date,
        total_cost: parseFloat(deal.total_cost),
        source: deal.source || null,
        source_type: deal.source_type,
        deal_group: deal.deal_group.trim() || null,
        notes: deal.notes.trim() || null,
      });
      setAcquisitionId(acquisition.id);
      if (singleItem) {
        setItems([
          {
            ...emptyItem(),
            name: deal.description.trim(),
            cost_basis: deal.total_cost,
          },
        ]);
      }
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function updateItem(idx: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleItemsSubmit() {
    if (!acquisitionId) return;
    setError(null);
    const validItems = items.filter((i) => i.name.trim());
    if (validItems.length === 0) {
      setError("Add at least one item.");
      return;
    }
    setSaving(true);
    try {
      const blankCount = validItems.filter((i) => !i.cost_basis.trim()).length;
      const explicitSum = validItems.reduce((sum, i) => sum + (parseFloat(i.cost_basis) || 0), 0);
      const splitCost = blankCount > 0 ? (totalCostNum - explicitSum) / blankCount : 0;

      await createItems(
        validItems.map((i) => ({
          acquisition_id: acquisitionId,
          name: i.name.trim(),
          category: i.category || null,
          cost_basis: i.cost_basis.trim() ? parseFloat(i.cost_basis) || 0 : splitCost,
          condition: i.condition || null,
          used_personally: i.used_personally,
          notes: i.notes.trim() || null,
        }))
      );
      router.push(`/acquisitions/${acquisitionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold">Log new deal</h1>
      <p className="mb-6 text-sm text-zinc-500">Step {step} of 2 — {step === 1 ? "Deal info" : "Items"}</p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {step === 1 && (
        <form onSubmit={handleDealSubmit} className="flex flex-col gap-4">
          <Input
            label="Description"
            required
            value={deal.description}
            onChange={(e) => setDeal({ ...deal, description: e.target.value })}
            placeholder="e.g. Bambu P2S bundle"
          />
          <Input
            label="Date"
            type="date"
            required
            value={deal.acquired_date}
            onChange={(e) => setDeal({ ...deal, acquired_date: e.target.value })}
          />
          <Input
            label="Total cost"
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            value={deal.total_cost}
            onChange={(e) => setDeal({ ...deal, total_cost: e.target.value })}
            placeholder="0.00"
          />
          <Select
            label="Source"
            value={deal.source}
            onChange={(e) => setDeal({ ...deal, source: e.target.value })}
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            label="Source type"
            value={deal.source_type}
            onChange={(e) => setDeal({ ...deal, source_type: e.target.value as SourceType })}
          >
            <option value="flip_purchase">Flip purchase</option>
            <option value="personal_item">Personal item</option>
          </Select>
          <Input
            label="Deal group (optional)"
            value={deal.deal_group}
            onChange={(e) => setDeal({ ...deal, deal_group: e.target.value })}
            placeholder="e.g. apple-haul-jan25"
          />
          <Textarea
            label="Notes (optional)"
            value={deal.notes}
            onChange={(e) => setDeal({ ...deal, notes: e.target.value })}
          />
          <Toggle
            label="Just one item (skip retyping name/cost)"
            checked={singleItem}
            onChange={setSingleItem}
          />
          <Button type="submit" disabled={saving} className="mt-2">
            {saving ? "Saving..." : "Next: Add items"}
          </Button>
        </form>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-zinc-100 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span>Allocated</span>
              <span className="font-medium">{formatCurrency(allocated)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total cost</span>
              <span className="font-medium">{formatCurrency(totalCostNum)}</span>
            </div>
            {Math.abs(diff) > 0.01 && (
              <p className="mt-1 text-xs text-amber-600">
                {diff > 0
                  ? `${formatCurrency(diff)} unallocated`
                  : `Over-allocated by ${formatCurrency(-diff)}`}
              </p>
            )}
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-500">Item {idx + 1}</span>
                {!singleItem && items.length > 1 && (
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-sm text-red-600"
                    type="button"
                  >
                    Remove
                  </button>
                )}
              </div>
              <Input
                label="Item name"
                value={item.name}
                onChange={(e) => updateItem(idx, { name: e.target.value })}
                placeholder="e.g. Bambu P2S printer"
              />
              <Select
                label="Category"
                value={item.category}
                onChange={(e) => updateItem(idx, { category: e.target.value })}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Input
                label="Cost basis"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={item.cost_basis}
                onChange={(e) => updateItem(idx, { cost_basis: e.target.value })}
                placeholder="0.00"
              />
              <Select
                label="Condition"
                value={item.condition}
                onChange={(e) => updateItem(idx, { condition: e.target.value as ItemCondition })}
              >
                <option value="">Select condition</option>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
              <Toggle
                label="Used personally"
                checked={item.used_personally}
                onChange={(v) => updateItem(idx, { used_personally: v })}
              />
              <Textarea
                label="Notes (optional)"
                value={item.notes}
                onChange={(e) => updateItem(idx, { notes: e.target.value })}
              />
            </div>
          ))}

          {!singleItem && (
            <Button variant="secondary" type="button" onClick={addItem}>
              + Add another item
            </Button>
          )}

          <Button type="button" onClick={handleItemsSubmit} disabled={saving} className="mt-2">
            {saving ? "Saving..." : "Done"}
          </Button>
        </div>
      )}
    </div>
  );
}
