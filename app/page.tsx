"use client";

import { useEffect, useState } from "react";
import {
  getSummaryStats,
  getActiveAcquisitions,
  getRecentTransactions,
} from "@/lib/db";
import type { AcquisitionPnl, SummaryStats as SummaryStatsType, Transaction } from "@/lib/types";
import { SummaryStats } from "@/components/SummaryStats";
import { AcquisitionCard } from "@/components/AcquisitionCard";
import { LinkButton } from "@/components/ui/Button";
import { LoadingState, EmptyState } from "@/components/ui/Empty";
import { formatDate, formatPnl, pnlColorClass } from "@/lib/format";
import { AUTH_STORAGE_KEY } from "@/app/login/page";

type RecentTx = Transaction & { items: { item_id: number; item_name: string; direction: string }[] };

export default function DashboardPage() {
  const [stats, setStats] = useState<SummaryStatsType | null>(null);
  const [active, setActive] = useState<AcquisitionPnl[]>([]);
  const [recent, setRecent] = useState<RecentTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getSummaryStats(), getActiveAcquisitions(), getRecentTransactions(5)])
      .then(([s, a, r]) => {
        setStats(s);
        setActive(a);
        setRecent(r);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Flipbook</h1>
        <div className="flex gap-2">
          <LinkButton href="/metrics" variant="secondary">
            Metrics
          </LinkButton>
          <LinkButton href="/acquisitions/new">+ Log deal</LinkButton>
        </div>
      </div>

      {loading && <LoadingState />}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && stats && (
        <>
          <SummaryStats stats={stats} />

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Active deals</h2>
            {active.length === 0 ? (
              <EmptyState
                title="No active deals"
                description="No deals yet — log your first one."
                action={<LinkButton href="/acquisitions/new" className="mt-2">+ Log deal</LinkButton>}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {active.map((a) => (
                  <AcquisitionCard key={a.id} acquisition={a} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Recent activity</h2>
            {recent.length === 0 ? (
              <EmptyState title="No transactions yet" description="Sales and trades will show up here." />
            ) : (
              <div className="flex flex-col gap-2">
                {recent.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {t.items.map((i) => i.item_name).join(", ") || "—"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(t.transaction_date)} &middot; {t.type}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${pnlColorClass(t.cash_amount)}`}>
                      {formatPnl(t.cash_amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(AUTH_STORAGE_KEY);
              window.location.href = "/login";
            }}
            className="mt-8 text-sm text-zinc-400 underline"
          >
            Sign out
          </button>
        </>
      )}
    </div>
  );
}
