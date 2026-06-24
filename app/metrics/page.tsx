"use client";

import { useEffect, useState } from "react";
import { getClosedItemRows } from "@/lib/db";
import { computeAvgDaysToSell, computeMonthlyPnl } from "@/lib/metrics";
import type { MonthlyPnl } from "@/lib/metrics";
import { formatPnl, pnlColorClass } from "@/lib/format";
import { LoadingState, EmptyState } from "@/components/ui/Empty";

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const d = new Date(Number(year), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function MetricsPage() {
  const [months, setMonths] = useState<MonthlyPnl[]>([]);
  const [avgDays, setAvgDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getClosedItemRows()
      .then((rows) => {
        setMonths(computeMonthlyPnl(rows));
        setAvgDays(computeAvgDaysToSell(rows));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const allDeals = months.flatMap((m) => m.deals);
  const lifetimePnl = allDeals.reduce((sum, d) => sum + d.pnl, 0);
  const lifetimeDeals = allDeals.length;
  const winRate = lifetimeDeals > 0 ? Math.round((allDeals.filter((d) => d.pnl > 0).length / lifetimeDeals) * 100) : null;
  const avgProfit = lifetimeDeals > 0 ? lifetimePnl / lifetimeDeals : null;

  const recentMonths = months.slice(-6);
  const maxAbsPnl = Math.max(1, ...recentMonths.map((m) => Math.abs(m.realized_pnl)));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-[26px] font-extrabold tracking-[-0.03em]">Metrics</h1>

      {loading && <LoadingState />}
      {error && <p className="text-sm text-[#DC2626]">{error}</p>}

      {!loading && !error && (
        <>
          {recentMonths.length > 0 && (
            <div className="mb-3 rounded-[16px] border border-[#ECEAE3] bg-white p-4">
              <p className="mb-3 text-[14px] font-bold">Realized P&L &middot; last 6 months</p>
              <div className="flex h-28 items-end gap-2">
                {recentMonths.map((m, i) => {
                  const isCurrent = i === recentMonths.length - 1;
                  const heightPct = Math.max(4, (Math.abs(m.realized_pnl) / maxAbsPnl) * 100);
                  return (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className={`w-full rounded-t-[4px] ${isCurrent ? "bg-[#047857]" : i % 2 === 0 ? "bg-[#9ED4BD]" : "bg-[#CFE9DD]"}`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] font-medium text-[#A8A49A]">
                        {formatMonth(m.month).slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-3 rounded-[16px] border border-[#ECEAE3] bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#A8A49A]">Lifetime realized P&L</p>
            <p className={`mt-1 font-mono text-[38px] font-semibold leading-none ${pnlColorClass(lifetimePnl)}`}>
              {formatPnl(lifetimePnl)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] border border-[#ECEAE3] bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#A8A49A]">Win rate</p>
              <p className="mt-1 font-mono text-[21px] font-semibold">{winRate !== null ? `${winRate}%` : "—"}</p>
            </div>
            <div className="rounded-[14px] border border-[#ECEAE3] bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#A8A49A]">Avg. per deal</p>
              <p className={`mt-1 font-mono text-[21px] font-semibold ${avgProfit !== null ? pnlColorClass(avgProfit) : ""}`}>
                {avgProfit !== null ? formatPnl(avgProfit) : "—"}
              </p>
            </div>
            <div className="rounded-[14px] border border-[#ECEAE3] bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#A8A49A]">Avg. held</p>
              <p className="mt-1 font-mono text-[21px] font-semibold">
                {avgDays !== null ? `${avgDays}d` : "—"}
              </p>
            </div>
            <div className="rounded-[14px] border border-[#ECEAE3] bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#A8A49A]">Deals closed</p>
              <p className="mt-1 font-mono text-[21px] font-semibold">{lifetimeDeals}</p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="mb-3 text-[14px] font-bold">By month</h2>
            {months.length === 0 ? (
              <EmptyState
                title="No closed deals yet"
                description="Sales and trades will show up here once recorded."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {months.map((m) => {
                  const isOpen = expanded === m.month;
                  return (
                    <div key={m.month} className="rounded-[14px] border border-[#ECEAE3] bg-white">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : m.month)}
                        className="flex w-full items-center justify-between p-3 text-left"
                      >
                        <div>
                          <p className="text-sm font-medium">{formatMonth(m.month)}</p>
                          <p className="text-xs text-[#8C887D]">
                            {m.deals_closed} deal{m.deals_closed === 1 ? "" : "s"} closed
                          </p>
                        </div>
                        <span className={`font-mono text-sm font-semibold ${pnlColorClass(m.realized_pnl)}`}>
                          {formatPnl(m.realized_pnl)}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="flex flex-col gap-1 border-t border-[#F1EFE9] px-3 py-2">
                          {m.deals.map((d) => (
                            <div key={d.transaction_id} className="flex items-center justify-between py-1">
                              <p className="min-w-0 truncate text-xs text-[#8C887D]">
                                {d.items.join(", ")}
                              </p>
                              <span className={`ml-2 shrink-0 text-xs font-medium ${pnlColorClass(d.pnl)}`}>
                                {formatPnl(d.pnl)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
