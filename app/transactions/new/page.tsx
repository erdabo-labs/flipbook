"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TransactionForm } from "@/components/TransactionForm";

function NewTransactionContent() {
  const searchParams = useSearchParams();
  const acquisitionId = searchParams.get("acquisition_id");
  const itemId = searchParams.get("item_id");
  const type = searchParams.get("type");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Record transaction</h1>
      <TransactionForm
        initialAcquisitionId={acquisitionId ? Number(acquisitionId) : null}
        initialItemId={itemId ? Number(itemId) : null}
        initialKind={type === "trade" ? "trade" : "sale"}
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
