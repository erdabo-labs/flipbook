"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getEvaluations } from "@/lib/db";
import type { Evaluation } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { LoadingState, EmptyState } from "@/components/ui/Empty";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function scoreColor(score: number): string {
  if (score >= 7) return "text-[#047857]";
  if (score >= 4) return "text-[#B45309]";
  return "text-[#DC2626]";
}

export default function EvaluationsPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEvaluations()
      .then(setEvaluations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalCost = useMemo(
    () => evaluations.reduce((sum, e) => sum + (e.cost_usd ?? 0), 0),
    [evaluations]
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-[#1A1A17]">Evaluations</h1>
        <LinkButton href="/evaluate">+ New</LinkButton>
      </div>

      {loading && <LoadingState />}
      {error && <p className="text-sm text-[#DC2626]">{error}</p>}

      {!loading && !error && (
        <>
          {evaluations.length > 0 && (
            <p className="mb-4 text-sm text-[#8C887D]">
              {evaluations.length} evaluation{evaluations.length === 1 ? "" : "s"} · {formatCurrency(totalCost)} spent
            </p>
          )}

          {evaluations.length === 0 ? (
            <EmptyState
              title="No evaluations yet"
              description="Evaluate a listing or an incoming offer to get an AI score."
              action={<LinkButton href="/evaluate" className="mt-2">+ New evaluation</LinkButton>}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {evaluations.map((e) => (
                <Card key={e.id} onClick={() => router.push(`/evaluations/${e.id}`)} className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-[#1A1A17]">{e.title}</p>
                      <p className="text-[12px] text-[#8C887D]">
                        {formatDate(e.created_at)} &middot; {formatCurrency(e.price)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge>{e.kind === "offer" ? "Offer" : "Listing"}</Badge>
                      <span className={`font-mono text-base font-bold ${scoreColor(e.score)}`}>{e.score}/10</span>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13px] text-[#1A1A17]">{e.verdict}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {e.cost_usd != null && <p className="text-[11px] text-[#B3AFA5]">${e.cost_usd.toFixed(4)}</p>}
                    {e.notes && <p className="truncate text-[11px] text-[#8C887D]">📝 {e.notes}</p>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
