"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Item, ItemCondition } from "@/lib/types";
import { CATEGORIES, CONDITIONS } from "@/lib/types";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, saleHref } from "@/lib/format";
import {
  createBundleListing,
  getItemsForAcquisition,
  markItemKept,
  markItemListed,
  markItemPending,
  removeFromBundle,
  setBundlePending,
  splitItem,
  undoBundlePending,
  updateItemDetails,
  updateItemStatus,
} from "@/lib/db";
import { Input, Select, Toggle } from "@/components/ui/Input";
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
  const [splitting, setSplitting] = useState(false);
  const [listing, setListing] = useState(false);
  const [listedPrice, setListedPrice] = useState("");
  const [markingPending, setMarkingPending] = useState(false);
  const [pendingPrice, setPendingPrice] = useState("");
  const [pendingBundle, setPendingBundle] = useState(false);
  const [bundling, setBundling] = useState(false);
  const [bundleCandidates, setBundleCandidates] = useState<Item[]>([]);
  const [bundleSelectedIds, setBundleSelectedIds] = useState<number[]>([]);
  const [bundleLabel, setBundleLabel] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [working, setWorking] = useState(false);
  const [name, setName] = useState(item.name);
  const [costBasis, setCostBasis] = useState(String(item.cost_basis));
  const [category, setCategory] = useState(item.category ?? "");
  const [condition, setCondition] = useState<ItemCondition | "">(item.condition ?? "");
  const [error, setError] = useState<string | null>(null);
  const [splitName1, setSplitName1] = useState("");
  const [splitCost1, setSplitCost1] = useState("");
  const [splitName2, setSplitName2] = useState("");
  const [splitCost2, setSplitCost2] = useState("");
  const isActionable = item.status === "inventory" || item.status === "listed" || item.status === "pending";

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

  async function handleUndoKept() {
    setWorking(true);
    try {
      await updateItemStatus(item.id, "inventory");
      onChanged();
    } finally {
      setWorking(false);
      setOpen(false);
    }
  }

  function startListing() {
    setListedPrice(item.listed_price != null ? String(item.listed_price) : "");
    setError(null);
    setListing(true);
  }

  async function handleSaveListing() {
    setWorking(true);
    setError(null);
    try {
      await markItemListed(item.id, listedPrice.trim() ? parseFloat(listedPrice) || 0 : null);
      onChanged();
      setListing(false);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setWorking(false);
    }
  }

  async function startPending() {
    setError(null);
    if (item.bundle_id) {
      setWorking(true);
      try {
        const siblings = await getItemsForAcquisition(item.acquisition_id);
        const members = siblings.filter((i) => i.bundle_id === item.bundle_id);
        const currentTotal = members.reduce((sum, m) => sum + (m.listed_price ?? 0), 0);
        setPendingPrice(currentTotal ? String(currentTotal) : "");
        setPendingBundle(true);
        setMarkingPending(true);
      } finally {
        setWorking(false);
      }
      return;
    }
    setPendingBundle(false);
    setPendingPrice(
      item.pending_price != null ? String(item.pending_price) : item.listed_price != null ? String(item.listed_price) : ""
    );
    setMarkingPending(true);
  }

  async function handleSavePending() {
    setWorking(true);
    setError(null);
    try {
      const price = pendingPrice.trim() ? parseFloat(pendingPrice) || 0 : null;
      if (pendingBundle && item.bundle_id) {
        await setBundlePending(item.bundle_id, price);
      } else {
        await markItemPending(item.id, price);
      }
      onChanged();
      setMarkingPending(false);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setWorking(false);
    }
  }

  async function handleUndoPending() {
    setWorking(true);
    try {
      if (item.bundle_id) {
        await undoBundlePending(item.bundle_id);
      } else {
        await updateItemStatus(item.id, "listed");
      }
      onChanged();
    } finally {
      setWorking(false);
      setOpen(false);
    }
  }

  async function goSell() {
    if (item.bundle_id) {
      setWorking(true);
      try {
        const siblings = await getItemsForAcquisition(item.acquisition_id);
        const members = siblings.filter(
          (i) =>
            i.bundle_id === item.bundle_id &&
            (i.status === "inventory" || i.status === "listed" || i.status === "pending")
        );
        const total = members.reduce((sum, m) => sum + (m.pending_price ?? m.listed_price ?? 0), 0);
        router.push(saleHref({ acquisitionId: item.acquisition_id, itemIds: members.map((m) => m.id), cashAmount: total || null }));
      } finally {
        setWorking(false);
      }
    } else {
      const price = item.pending_price ?? item.listed_price;
      router.push(saleHref({ acquisitionId: item.acquisition_id, itemIds: [item.id], cashAmount: price }));
    }
    setOpen(false);
  }

  async function startBundling() {
    setError(null);
    setWorking(true);
    try {
      const siblings = await getItemsForAcquisition(item.acquisition_id);
      const candidates = siblings.filter(
        (i) => i.id !== item.id && i.bundle_id == null && (i.status === "inventory" || i.status === "listed")
      );
      setBundleCandidates(candidates);
      setBundleSelectedIds([item.id]);
      setBundleLabel("");
      setBundlePrice(item.listed_price != null ? String(item.listed_price) : "");
      setBundling(true);
    } finally {
      setWorking(false);
    }
  }

  function toggleBundleCandidate(id: number) {
    setBundleSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSaveBundle() {
    if (bundleSelectedIds.length < 2) {
      setError("Select at least one other item to bundle with.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const selectedItems = [item, ...bundleCandidates.filter((c) => bundleSelectedIds.includes(c.id))];
      await createBundleListing({
        items: selectedItems.map((i) => ({ id: i.id, cost_basis: i.cost_basis })),
        label: bundleLabel.trim() || null,
        total_listed_price: bundlePrice.trim() ? parseFloat(bundlePrice) || 0 : null,
      });
      onChanged();
      setBundling(false);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setWorking(false);
    }
  }

  async function handleRemoveFromBundle() {
    setWorking(true);
    try {
      await removeFromBundle(item.id);
      onChanged();
    } finally {
      setWorking(false);
      setOpen(false);
    }
  }

  function startSplit() {
    setSplitName1(item.name);
    setSplitCost1(String(Math.round((item.cost_basis / 2) * 100) / 100));
    setSplitName2(item.name);
    setSplitCost2(String(Math.round((item.cost_basis / 2) * 100) / 100));
    setError(null);
    setSplitting(true);
  }

  async function handleSaveSplit() {
    if (!splitName1.trim() || !splitName2.trim()) {
      setError("Both names are required.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      await splitItem(item, [
        { name: splitName1.trim(), cost_basis: parseFloat(splitCost1) || 0 },
        { name: splitName2.trim(), cost_basis: parseFloat(splitCost2) || 0 },
      ]);
      onChanged();
      setSplitting(false);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setWorking(false);
    }
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
        className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-[#ECEAE3] bg-white p-3 text-left active:bg-[#FCFBF8]"
      >
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[#1A1A17]">{item.name}</p>
          <p className="text-[12px] text-[#8C887D]">
            {item.category ?? "Uncategorized"} &middot; cost {formatCurrency(item.cost_basis)}
            {item.condition && <> &middot; {CONDITION_LABELS[item.condition]}</>}
            {item.status === "listed" && item.listed_price != null && (
              <span className="ml-2 font-mono font-semibold text-[#B45309]">
                +{formatCurrency(item.listed_price)} asking
              </span>
            )}
            {item.status === "pending" && item.pending_price != null && (
              <span className="ml-2 font-mono font-semibold text-[#1D4ED8]">
                +{formatCurrency(item.pending_price)} pending sale
              </span>
            )}
            {item.bundle_label && <span className="ml-2 text-teal-600">&middot; {item.bundle_label}</span>}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-[rgba(26,26,23,.32)]"
          onClick={() => {
            setOpen(false);
            setEditing(false);
            setSplitting(false);
            setListing(false);
            setMarkingPending(false);
            setBundling(false);
          }}
        >
          <div
            className="w-full rounded-t-[26px] bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
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
            ) : splitting ? (
              <div className="flex flex-col gap-3">
                <p className="px-2 font-medium">Split item</p>
                <p className="px-2 text-sm text-[#8C887D]">
                  Replaces &quot;{item.name}&quot; with two items. Adjust names and cost basis as needed.
                </p>
                {error && <p className="px-2 text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input label="Item 1 name" value={splitName1} onChange={(e) => setSplitName1(e.target.value)} />
                  </div>
                  <div className="w-28">
                    <Input
                      label="Cost basis"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={splitCost1}
                      onChange={(e) => setSplitCost1(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input label="Item 2 name" value={splitName2} onChange={(e) => setSplitName2(e.target.value)} />
                  </div>
                  <div className="w-28">
                    <Input
                      label="Cost basis"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={splitCost2}
                      onChange={(e) => setSplitCost2(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-1 flex gap-2">
                  <Button variant="secondary" type="button" onClick={() => setSplitting(false)} className="flex-1">
                    Back
                  </Button>
                  <Button type="button" onClick={handleSaveSplit} disabled={working} className="flex-1">
                    {working ? "Saving..." : "Split"}
                  </Button>
                </div>
              </div>
            ) : listing ? (
              <div className="flex flex-col gap-3">
                <p className="px-2 font-medium">List item</p>
                <p className="px-2 text-sm text-[#8C887D]">
                  Optional asking price, shown until a buyer agrees to terms.
                </p>
                {error && <p className="px-2 text-sm text-red-600">{error}</p>}
                <Input
                  label="Asking price (optional)"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={listedPrice}
                  onChange={(e) => setListedPrice(e.target.value)}
                  placeholder="0.00"
                />
                <div className="mt-1 flex gap-2">
                  <Button variant="secondary" type="button" onClick={() => setListing(false)} className="flex-1">
                    Back
                  </Button>
                  <Button type="button" onClick={handleSaveListing} disabled={working} className="flex-1">
                    {working ? "Saving..." : "List item"}
                  </Button>
                </div>
              </div>
            ) : markingPending ? (
              <div className="flex flex-col gap-3">
                <p className="px-2 font-medium">Mark pending sale</p>
                <p className="px-2 text-sm text-[#8C887D]">
                  A buyer agreed to terms. Enter the agreed price — it can differ from the asking price.
                  {pendingBundle && " This applies to the whole bundle."}
                </p>
                {error && <p className="px-2 text-sm text-red-600">{error}</p>}
                <Input
                  label={pendingBundle ? "Total agreed price (optional)" : "Agreed price (optional)"}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={pendingPrice}
                  onChange={(e) => setPendingPrice(e.target.value)}
                  placeholder="0.00"
                />
                <div className="mt-1 flex gap-2">
                  <Button variant="secondary" type="button" onClick={() => setMarkingPending(false)} className="flex-1">
                    Back
                  </Button>
                  <Button type="button" onClick={handleSavePending} disabled={working} className="flex-1">
                    {working ? "Saving..." : "Mark pending"}
                  </Button>
                </div>
              </div>
            ) : bundling ? (
              <div className="flex flex-col gap-3">
                <p className="px-2 font-medium">List as bundle</p>
                <p className="px-2 text-sm text-[#8C887D]">
                  Pick other inventory items from this deal to list together with &quot;{item.name}&quot; for one
                  combined price. The price is split across items by cost basis.
                </p>
                {error && <p className="px-2 text-sm text-red-600">{error}</p>}
                <Input label="Bundle label (optional)" value={bundleLabel} onChange={(e) => setBundleLabel(e.target.value)} placeholder="e.g. Camera kit" />
                <Input
                  label="Total asking price (optional)"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={bundlePrice}
                  onChange={(e) => setBundlePrice(e.target.value)}
                  placeholder="0.00"
                />
                {bundleCandidates.length === 0 ? (
                  <p className="px-2 text-sm text-[#8C887D]">No other available items in this deal.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {bundleCandidates.map((c) => (
                      <Toggle
                        key={c.id}
                        label={`${c.name} (${formatCurrency(c.cost_basis)})`}
                        checked={bundleSelectedIds.includes(c.id)}
                        onChange={() => toggleBundleCandidate(c.id)}
                      />
                    ))}
                  </div>
                )}
                <div className="mt-1 flex gap-2">
                  <Button variant="secondary" type="button" onClick={() => setBundling(false)} className="flex-1">
                    Back
                  </Button>
                  <Button type="button" onClick={handleSaveBundle} disabled={working} className="flex-1">
                    {working ? "Saving..." : "Save bundle"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-3 px-2 font-semibold">{item.name}</p>
                <div className="flex flex-col gap-1">
                  <SheetAction label="Edit details" onClick={startEdit} />
                  {isActionable && (
                    <>
                      <SheetAction
                        label={item.status === "pending" ? "Complete sale" : "Mark sold"}
                        onClick={goSell}
                        disabled={working}
                      />
                      <SheetAction
                        label="Mark traded"
                        onClick={() => router.push(`/transactions/new?acquisition_id=${item.acquisition_id}&item_ids=${item.id}&type=trade`)}
                      />
                      <SheetAction label="Mark kept" onClick={handleMarkKept} disabled={working} />
                      {!item.bundle_id && item.status !== "pending" && (
                        <SheetAction
                          label={item.status === "listed" ? "Edit asking price" : "List item"}
                          onClick={startListing}
                        />
                      )}
                      {!item.bundle_id && (item.status === "inventory" || item.status === "listed") && (
                        <SheetAction label="List as bundle" onClick={startBundling} disabled={working} />
                      )}
                      {item.bundle_id && item.status !== "pending" && (
                        <SheetAction label="Remove from bundle" onClick={handleRemoveFromBundle} disabled={working} />
                      )}
                      {item.status === "listed" && (
                        <SheetAction label="Mark pending sale" onClick={startPending} />
                      )}
                      {item.status === "pending" && (
                        <SheetAction label="Edit pending price" onClick={startPending} />
                      )}
                      <SheetAction label="Split item" onClick={startSplit} />
                    </>
                  )}
                  {item.status === "pending" && (
                    <SheetAction label="Move back to listed" onClick={handleUndoPending} disabled={working} />
                  )}
                  {item.status === "kept" && (
                    <SheetAction label="Move back to inventory" onClick={handleUndoKept} disabled={working} />
                  )}
                  {(item.status === "sold" || item.status === "traded" || item.status === "bundled") && (
                    <p className="px-3 py-2 text-sm text-[#B3AFA5]">
                      To undo this, edit or delete the related transaction.
                    </p>
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
      className={`min-h-12 rounded-[12px] px-3 text-left text-base ${
        muted ? "text-[#B3AFA5]" : "text-[#1A1A17] active:bg-[#F4F2EC]"
      }`}
    >
      {label}
    </button>
  );
}
