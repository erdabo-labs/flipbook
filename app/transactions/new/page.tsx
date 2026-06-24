"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TransactionForm } from "@/components/TransactionForm";

function NewTransactionContent() {
  const searchParams = useSearchParams();
  const acquisitionId = searchParams.get("acquisition_id");
  const itemIdsParam = searchParams.get("item_ids") ?? searchParams.get("item_id");
  const itemIds = itemIdsParam
    ? itemIdsParam
        .split(",")
        .map(Number)
        .filter((n) => !Number.isNaN(n))
    : [];
  const type = searchParams.get("type");
  const cash = searchParams.get("cash");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Record transaction</h1>
      <TransactionForm
        initialAcquisitionId={acquisitionId ? Number(acquisitionId) : null}
        initialItemIds={itemIds}
        initialKind={type === "trade" ? "trade" : itemIds.length > 1 ? "bundle" : "sale"}
        initialCashAmount={cash ?? undefined}
      />
    </div>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading...</div>}>
      <NewTransactionContent />
    </Suspense>
  );
}
