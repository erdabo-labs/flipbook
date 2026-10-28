"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ItemRow } from "@/components/ItemRow";
import Link from "next/link";
import { getInventory } from "@/lib/db-client";
import type { CurrentInventoryRow } from "@/lib/types";
import { formatCurrency, formatDate, daysSince, saleHref } from "@/lib/format";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/Empty";
import { LinkButton } from "@/components/ui/Button";

function InventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = Number(searchParams.get("item"));
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

  const selected = rows.find(row => row.id === selectedId);
  return (
    <div className={`inventory-workspace ${selected ? "has-selection" : ""}`}>
    <div className="page-content inventory-list">
      <h1 className="mb-4 text-[26px] font-extrabold tracking-[-0.03em]">Inventory</h1>

      {loading && <LoadingState />}
      {error && <p className="text-sm text-[#DC2626]">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-[14px] border border-[#ECEAE3] bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#A8A49A]">Capital tied up</p>
              <p className="mt-1 font-mono text-[21px] font-semibold text-[#1A1A17]">{formatCurrency(totalCapital)}</p>
            </div>
            <div className="rounded-[14px] border border-[#D9E3FB] bg-[#F7F9FF] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#1D4ED8]">Potential cash</p>
              <p className="mt-1 font-mono text-[21px] font-semibold text-[#1D4ED8]">{formatCurrency(potentialCash)}</p>
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
                    className="mb-2 block text-[14px] font-bold text-[#6B6A62]"
                  >
                    {group.desc}
                  </Link>
                  <div className="flex flex-col gap-2">
                    {group.items.map((item) => (
                      <div key={item.id} className="rounded-[14px] border border-[#ECEAE3] bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={`/inventory?item=${item.id}`} scroll={false} aria-current={selectedId === item.id ? "page" : undefined} className="block min-h-11 py-2 text-[14px] font-semibold text-[#047857] underline">{item.name}</Link>
                            <p className="text-[12px] text-[#8C887D]">
                              {item.category ?? "Uncategorized"} &middot; cost {formatCurrency(item.cost_basis)}
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
                              {item.bundle_label && (
                                <span className="ml-2 text-teal-600">&middot; {item.bundle_label}</span>
                              )}
                            </p>
                            <p className="mt-1 text-xs text-[#B3AFA5]">
                              Held {daysSince(item.acquired_date)} days &middot; acquired {formatDate(item.acquired_date)}
                            </p>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        <LinkButton
                          href={saleLinkFor(item)}
                          variant={item.status === "pending" ? "primary" : "secondary"}
                          className={`mt-3 w-full ${item.status === "pending" ? "!bg-[#1D4ED8] active:!bg-[#1840B0]" : ""}`}
                        >
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
    {selected && <aside className="inventory-inspector page-content" aria-label="Selected item">
      <Link href="/inventory" scroll={false} className="mb-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#047857]">‹ Inventory</Link>
      <h2 className="mb-3 text-xl font-bold">{selected.name}</h2>
      <p className="mb-4 text-sm text-[#6B6A62]">Tap the item below to edit, list, bundle, or update its status.</p>
      <ItemRow key={selected.id} item={selected} onChanged={() => { getInventory().then(setRows).catch(e => setError(e.message)); router.refresh(); }} />
      <p className="my-4 text-sm">{selected.notes || "No notes yet."}</p>
      <LinkButton href={saleLinkFor(selected)}>Record sale</LinkButton>
    </aside>}
    </div>
  );
}
export default function InventoryPage() {
  return <Suspense fallback={<LoadingState />}><InventoryContent /></Suspense>;
}
