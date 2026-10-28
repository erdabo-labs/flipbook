"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TransactionForm } from "@/components/TransactionForm";

function NewTransactionContent() {
  const router = useRouter();
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
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="text-sm font-medium text-[#8C887D]">
          Cancel
        </button>
        <h1 className="text-[14px] font-bold">Record sale</h1>
        <span className="w-12" />
      </div>
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
    <Suspense fallback={<div className="p-6 text-sm text-[#8C887D]">Loading...</div>}>
      <NewTransactionContent />
    </Suspense>
  );
}
