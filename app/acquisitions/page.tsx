"use client";

import { useEffect, useMemo, useState } from "react";
import { getAcquisitionsPnl } from "@/lib/db";
import type { AcquisitionPnl } from "@/lib/types";
import { AcquisitionCard } from "@/components/AcquisitionCard";
import { LinkButton } from "@/components/ui/Button";
import { LoadingState, EmptyState } from "@/components/ui/Empty";

type Filter = "all" | "active" | "closed";

export default function AcquisitionsListPage() {
  const [acquisitions, setAcquisitions] = useState<AcquisitionPnl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    getAcquisitionsPnl()
      .then(setAcquisitions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "active") return acquisitions.filter((a) => a.items_in_inventory > 0);
    if (filter === "closed") return acquisitions.filter((a) => a.items_in_inventory === 0);
    return acquisitions;
  }, [acquisitions, filter]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Deals</h1>
        <LinkButton href="/acquisitions/new">+ New</LinkButton>
      </div>

      <div className="mb-4 flex gap-2">
        {(["all", "active", "closed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`min-h-9 rounded-full px-4 text-sm font-medium capitalize ${
              filter === f ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <LoadingState />}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        filtered.length === 0 ? (
          <EmptyState
            title="No deals yet"
            description="Log your first one to get started."
            action={<LinkButton href="/acquisitions/new" className="mt-2">+ Log deal</LinkButton>}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((a) => (
              <AcquisitionCard key={a.id} acquisition={a} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
