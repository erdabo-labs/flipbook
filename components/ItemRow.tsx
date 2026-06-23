"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Item } from "@/lib/types";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { markItemKept } from "@/lib/db";

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
  const [working, setWorking] = useState(false);
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

  return (
    <>
      <button
        type="button"
        onClick={() => isActionable && setOpen(true)}
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
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 px-2 font-medium">{item.name}</p>
            <div className="flex flex-col gap-1">
              <SheetAction label="Mark sold" onClick={() => goToTransaction(item.id)} />
              <SheetAction label="Mark as part of bundle sale" onClick={() => goToTransaction(item.id)} />
              <SheetAction
                label="Mark traded"
                onClick={() => router.push(`/transactions/new?acquisition_id=${item.acquisition_id}&item_id=${item.id}&type=trade`)}
              />
              <SheetAction label="Mark kept" onClick={handleMarkKept} disabled={working} />
              <SheetAction label="Cancel" onClick={() => setOpen(false)} muted />
            </div>
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
