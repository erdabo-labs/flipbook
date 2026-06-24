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
        <div className="flex items-center gap-2">
          <svg className="h-6 w-6" viewBox="0 0 40 40" fill="none" stroke="#047857" strokeWidth={3} strokeLinejoin="round">
            <path d="M2 4c6-2.4 12-2.4 18 0v32c-6-2.4-12-2.4-18 0z" />
            <path d="M38 4c-6-2.4-12-2.4-18 0v32c6-2.4 12-2.4 18 0z" />
          </svg>
          <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-[#1A1A17]">Flipbook</h1>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ECFDF5] text-sm font-bold text-[#047857]">
          F
        </div>
      </div>

      {loading && <LoadingState />}
      {error && <p className="text-sm text-[#DC2626]">{error}</p>}

      {!loading && !error && stats && (
        <>
          <SummaryStats stats={stats} />

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-bold">Active deals</h2>
              <LinkButton href="/acquisitions" variant="ghost" className="!min-h-0 !p-0 text-sm font-semibold text-[#047857]">
                See all
              </LinkButton>
            </div>
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
            <h2 className="mb-3 text-[14px] font-bold">Recent activity</h2>
            {recent.length === 0 ? (
              <EmptyState title="No transactions yet" description="Sales and trades will show up here." />
            ) : (
              <div className="rounded-[14px] border border-[#ECEAE3] bg-white">
                {recent.map((t, i) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-3 ${i > 0 ? "border-t border-[#F1EFE9]" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-[#1A1A17]">
                        {t.items.map((i) => i.item_name).join(", ") || "—"}
                      </p>
                      <p className="text-[12px] text-[#8C887D]">
                        {formatDate(t.transaction_date)} &middot; {t.type}
                      </p>
                    </div>
                    <span className={`font-mono text-sm font-semibold ${pnlColorClass(t.cash_amount)}`}>
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
            className="mt-8 text-sm text-[#B3AFA5] underline"
          >
            Sign out
          </button>
        </>
      )}
    </div>
  );
}
