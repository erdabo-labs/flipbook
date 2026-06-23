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

  useEffect(() => {
    getClosedItemRows()
      .then((rows) => {
        setMonths(computeMonthlyPnl(rows));
        setAvgDays(computeAvgDaysToSell(rows));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const lifetimePnl = months.reduce((sum, m) => sum + m.realized_pnl, 0);
  const lifetimeDeals = months.reduce((sum, m) => sum + m.deals_closed, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Metrics</h1>

      {loading && <LoadingState />}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs text-zinc-500">Lifetime realized P&L</p>
              <p className={`mt-1 text-xl font-semibold ${pnlColorClass(lifetimePnl)}`}>
                {formatPnl(lifetimePnl)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs text-zinc-500">Deals closed</p>
              <p className="mt-1 text-xl font-semibold">{lifetimeDeals}</p>
            </div>
            <div className="col-span-2 rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs text-zinc-500">Avg. days held before selling</p>
              <p className="mt-1 text-xl font-semibold">
                {avgDays !== null ? `${avgDays} day${avgDays === 1 ? "" : "s"}` : "—"}
              </p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">By month</h2>
            {months.length === 0 ? (
              <EmptyState
                title="No closed deals yet"
                description="Sales and trades will show up here once recorded."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {months.map((m) => (
                  <div
                    key={m.month}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{formatMonth(m.month)}</p>
                      <p className="text-xs text-zinc-500">
                        {m.deals_closed} deal{m.deals_closed === 1 ? "" : "s"} closed
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${pnlColorClass(m.realized_pnl)}`}>
                      {formatPnl(m.realized_pnl)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
