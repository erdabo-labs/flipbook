"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getInventory } from "@/lib/db";
import type { CurrentInventoryRow } from "@/lib/types";
import { formatCurrency, formatDate, daysSince, saleHref } from "@/lib/format";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/Empty";
import { LinkButton } from "@/components/ui/Button";

export default function InventoryPage() {
  const [rows, setRows] = useState<CurrentInventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInventory()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalCapital = useMemo(() => rows.reduce((sum, r) => sum + r.cost_basis, 0), [rows]);
  const potentialCash = useMemo(
    () =>
      rows.reduce(
        (sum, r) => sum + (r.status === "listed" ? r.listed_price ?? 0 : r.status === "pending" ? r.pending_price ?? 0 : 0),
        0
      ),
    [rows]
  );

  const bundleMembers = useMemo(() => {
    const map = new Map<string, CurrentInventoryRow[]>();
    for (const row of rows) {
      if (!row.bundle_id) continue;
      if (!map.has(row.bundle_id)) map.set(row.bundle_id, []);
      map.get(row.bundle_id)!.push(row);
    }
    return map;
  }, [rows]);

  function saleLinkFor(item: CurrentInventoryRow): string {
    const members = item.bundle_id ? bundleMembers.get(item.bundle_id) ?? [item] : [item];
    const total = members.reduce((sum, m) => sum + (m.pending_price ?? m.listed_price ?? 0), 0);
    return saleHref({
      acquisitionId: item.acquisition_id,
      itemIds: members.map((m) => m.id),
      cashAmount: total || null,
    });
  }

  const grouped = useMemo(() => {
    const map = new Map<number, { acquisition_id: number; desc: string; date: string; items: CurrentInventoryRow[] }>();
    for (const row of rows) {
      if (!map.has(row.acquisition_id)) {
        map.set(row.acquisition_id, {
          acquisition_id: row.acquisition_id,
          desc: row.acquisition_desc,
          date: row.acquired_date,
          items: [],
        });
      }
      map.get(row.acquisition_id)!.items.push(row);
    }
    return Array.from(map.values());
  }, [rows]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Inventory</h1>

      {loading && <LoadingState />}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium text-zinc-500">Capital tied up</p>
              <p className="mt-1 text-2xl font-semibold">{formatCurrency(totalCapital)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium text-zinc-500">Potential cash</p>
              <p className="mt-1 text-2xl font-semibold">{formatCurrency(potentialCash)}</p>
            </div>
          </div>

          {grouped.length === 0 ? (
            <EmptyState title="No inventory" description="Items you haven't sold yet will show up here." />
          ) : (
            <div className="flex flex-col gap-6">
              {grouped.map((group) => (
                <section key={group.acquisition_id}>
                  <Link
                    href={`/acquisitions/${group.acquisition_id}`}
                    className="mb-2 block text-sm font-semibold text-zinc-700"
                  >
                    {group.desc}
                  </Link>
                  <div className="flex flex-col gap-2">
                    {group.items.map((item) => (
                      <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.name}</p>
                            <p className="text-sm text-zinc-500">
                              {item.category ?? "Uncategorized"} &middot; {formatCurrency(item.cost_basis)}
                              {item.status === "listed" && item.listed_price != null && (
                                <span className="ml-2 font-medium text-blue-600">
                                  +{formatCurrency(item.listed_price)} asking
                                </span>
                              )}
                              {item.status === "pending" && item.pending_price != null && (
                                <span className="ml-2 font-medium text-orange-600">
                                  +{formatCurrency(item.pending_price)} pending sale
                                </span>
                              )}
                              {item.bundle_label && (
                                <span className="ml-2 text-teal-600">&middot; {item.bundle_label}</span>
                              )}
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">
                              Held {daysSince(item.acquired_date)} days &middot; acquired {formatDate(item.acquired_date)}
                            </p>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        <LinkButton href={saleLinkFor(item)} variant="secondary" className="mt-3 w-full">
                          {item.status === "pending" ? "Complete sale" : "Record sale"}
                        </LinkButton>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
