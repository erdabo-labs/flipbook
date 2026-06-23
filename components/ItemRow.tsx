"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Item, ItemCondition } from "@/lib/types";
import { CATEGORIES, CONDITIONS } from "@/lib/types";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { markItemKept, updateItemDetails } from "@/lib/db";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
  parts: "Parts",
};

export function ItemRow({ item, onChanged }: { item: Item; onChanged: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState(false);
  const [name, setName] = useState(item.name);
  const [costBasis, setCostBasis] = useState(String(item.cost_basis));
  const [category, setCategory] = useState(item.category ?? "");
  const [condition, setCondition] = useState<ItemCondition | "">(item.condition ?? "");
  const [error, setError] = useState<string | null>(null);
  const isActionable = item.status === "inventory" || item.status === "listed";

  async function handleMarkKept() {
    setWorking(true);
    try {
      await markItemKept(item.id);
      onChanged();
    } finally {
      setWorking(false);
      setOpen(false);
    }
  }

  function goToTransaction(itemId: number) {
    router.push(`/transactions/new?acquisition_id=${item.acquisition_id}&item_id=${itemId}`);
    setOpen(false);
  }

  function startEdit() {
    setName(item.name);
    setCostBasis(String(item.cost_basis));
    setCategory(item.category ?? "");
    setCondition(item.condition ?? "");
    setError(null);
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      await updateItemDetails(item.id, {
        name: name.trim(),
        cost_basis: parseFloat(costBasis) || 0,
        category: category || null,
        condition: condition || null,
      });
      onChanged();
      setEditing(false);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left active:bg-zinc-50"
      >
        <div className="min-w-0">
          <p className="truncate font-medium">{item.name}</p>
          <p className="text-sm text-zinc-500">
            {formatCurrency(item.cost_basis)}
            {item.condition && <> &middot; {CONDITION_LABELS[item.condition]}</>}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => {
            setOpen(false);
            setEditing(false);
          }}
        >
          <div
            className="w-full rounded-t-2xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            {editing ? (
              <div className="flex flex-col gap-3">
                <p className="px-2 font-medium">Edit item</p>
                {error && <p className="px-2 text-sm text-red-600">{error}</p>}
                <Input label="Item name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input
                  label="Cost basis"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={costBasis}
                  onChange={(e) => setCostBasis(e.target.value)}
                />
                <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ItemCondition)}
                >
                  <option value="">Select condition</option>
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
                <div className="mt-1 flex gap-2">
                  <Button variant="secondary" type="button" onClick={() => setEditing(false)} className="flex-1">
                    Back
                  </Button>
                  <Button type="button" onClick={handleSaveEdit} disabled={working} className="flex-1">
                    {working ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-3 px-2 font-medium">{item.name}</p>
                <div className="flex flex-col gap-1">
                  <SheetAction label="Edit details" onClick={startEdit} />
                  {isActionable && (
                    <>
                      <SheetAction label="Mark sold" onClick={() => goToTransaction(item.id)} />
                      <SheetAction label="Mark as part of bundle sale" onClick={() => goToTransaction(item.id)} />
                      <SheetAction
                        label="Mark traded"
                        onClick={() => router.push(`/transactions/new?acquisition_id=${item.acquisition_id}&item_id=${item.id}&type=trade`)}
                      />
                      <SheetAction label="Mark kept" onClick={handleMarkKept} disabled={working} />
                    </>
                  )}
                  <SheetAction label="Cancel" onClick={() => setOpen(false)} muted />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SheetAction({
  label,
  onClick,
  disabled,
  muted,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-12 rounded-lg px-3 text-left text-base ${
        muted ? "text-zinc-400" : "text-zinc-900 active:bg-zinc-100"
      }`}
    >
      {label}
    </button>
  );
}
