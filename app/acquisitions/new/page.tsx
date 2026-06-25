"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAcquisition, createItems } from "@/lib/db";
import { CATEGORIES, CONDITIONS, SOURCES } from "@/lib/types";
import type { ItemCondition, SourceType } from "@/lib/types";
import { Input, Select, Textarea, Toggle } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency, splitAmount } from "@/lib/format";

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
  quantity: string;
}

const today = new Date().toISOString().slice(0, 10);

function emptyItem(): DraftItem {
  return {
    name: "",
    category: "",
    cost_basis: "",
    condition: "",
    used_personally: false,
    notes: "",
    quantity: "1",
  };
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
  const othersCost = items.slice(1).reduce((sum, i) => sum + (parseFloat(i.cost_basis) || 0), 0);
  const firstItemCost = totalCostNum - othersCost;

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
      const rows = items
        .map((i, idx) => ({ i, cost: idx === 0 ? firstItemCost : parseFloat(i.cost_basis) || 0 }))
        .filter(({ i }) => i.name.trim())
        .flatMap(({ i, cost }) => {
          const qty = Math.max(1, parseInt(i.quantity, 10) || 1);
          const shares = qty > 1 ? splitAmount(cost, Array(qty).fill(1)) : [cost];
          return shares.map((share, share_idx) => ({
            acquisition_id: acquisitionId,
            name: qty > 1 ? `${i.name.trim()} (${share_idx + 1}/${qty})` : i.name.trim(),
            category: i.category || null,
            cost_basis: share,
            condition: i.condition || null,
            used_personally: i.used_personally,
            notes: i.notes.trim() || null,
          }));
        });
      await createItems(rows);
      router.push(`/acquisitions/${acquisitionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="text-sm font-medium text-[#8C887D]">
          Cancel
        </button>
        <h1 className="text-[14px] font-bold">Log a deal</h1>
        <span className="w-12" />
      </div>
      <p className="mb-6 text-sm text-[#8C887D]">Step {step} of 2 — {step === 1 ? "Deal info" : "Items"}</p>

      {error && <p className="mb-4 text-sm text-[#DC2626]">{error}</p>}

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
          <div className="rounded-lg bg-[#F4F2EC] px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span>Item 1 cost (auto)</span>
              <span className="font-medium">{formatCurrency(firstItemCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total cost</span>
              <span className="font-medium">{formatCurrency(totalCostNum)}</span>
            </div>
            {firstItemCost < -0.01 && (
              <p className="mt-1 text-xs text-amber-600">
                Other items add up to {formatCurrency(-firstItemCost)} more than the total cost.
              </p>
            )}
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-3 rounded-[14px] border border-[#ECEAE3] bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#8C887D]">Item {idx + 1}</span>
                {!singleItem && idx > 0 && (
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-sm text-[#DC2626]"
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
              {idx === 0 ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[#1A1A17]">Cost basis (auto)</span>
                  <div className="min-h-11 w-full rounded-lg border border-[#ECEAE3] bg-[#FAF9F6] px-3 py-2 text-base text-[#1A1A17]">
                    {formatCurrency(firstItemCost)}
                  </div>
                </div>
              ) : (
                <Input
                  label="Cost basis (optional)"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={item.cost_basis}
                  onChange={(e) => updateItem(idx, { cost_basis: e.target.value })}
                  placeholder="0.00 — leave blank for $0"
                />
              )}
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
              <Input
                label="Quantity (identical units)"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={item.quantity}
                onChange={(e) => updateItem(idx, { quantity: e.target.value })}
              />
              {Math.max(1, parseInt(item.quantity, 10) || 1) > 1 && (
                <p className="text-xs text-[#8C887D]">
                  Will create {Math.max(1, parseInt(item.quantity, 10) || 1)} separate items, cost split evenly,
                  so each can be sold one at a time.
                </p>
              )}
              <Textarea
                label="Notes (optional)"
                value={item.notes}
                onChange={(e) => updateItem(idx, { notes: e.target.value })}
              />
            </div>
          ))}

          {!singleItem && (
            <button
              type="button"
              onClick={addItem}
              className="flex min-h-11 items-center justify-center rounded-[12px] border border-dashed border-[#E3E0D7] px-4 text-sm font-semibold text-[#047857]"
            >
              + Add item
            </button>
          )}

          <Button type="button" onClick={handleItemsSubmit} disabled={saving} className="mt-2 w-full">
            {saving ? "Saving..." : "Save deal"}
          </Button>
        </div>
      )}
    </div>
  );
}
