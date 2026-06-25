"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { deleteEvaluation, getEvaluation, updateEvaluationNotes } from "@/lib/db";
import type { Evaluation } from "@/lib/types";
import { formatCurrency, formatDate, isValidUrl } from "@/lib/format";
import { LoadingState } from "@/components/ui/Empty";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { LinkifiedText } from "@/components/ui/LinkifiedText";

function scoreColor(score: number): string {
  if (score >= 7) return "text-[#047857]";
  if (score >= 4) return "text-[#B45309]";
  return "text-[#DC2626]";
}

export default function EvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const e = await getEvaluation(id);
      setEvaluation(e);
      setNotes(e?.notes ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, [load]);

  async function handleNotesBlur() {
    if (!evaluation) return;
    const value = notes.trim();
    if (value === (evaluation.notes ?? "")) return;
    const updated = await updateEvaluationNotes(evaluation.id, value || null);
    setEvaluation(updated);
  }

  async function handleDelete() {
    if (!evaluation) return;
    if (!window.confirm("Delete this evaluation? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteEvaluation(evaluation.id);
      router.push("/evaluations");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <p className="p-6 text-sm text-[#DC2626]">{error}</p>;
  if (!evaluation) return <p className="p-6 text-sm text-[#8C887D]">Evaluation not found.</p>;

  const e = evaluation;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <Link href="/evaluations" className="mb-3 inline-block text-sm font-medium text-[#8C887D]">
        ‹ Evaluations
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-[22px] font-extrabold tracking-[-0.03em] text-[#1A1A17]">{e.title}</h1>
          <p className="mt-1 text-sm text-[#8C887D]">
            {formatDate(e.created_at)} &middot; {formatCurrency(e.price)}
          </p>
        </div>
        <Badge className="mt-1 shrink-0">{e.kind === "offer" ? "Offer" : "Listing"}</Badge>
      </div>

      {e.listing_url && (
        isValidUrl(e.listing_url) ? (
          <a
            href={e.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-block break-all text-sm text-[#047857] underline"
          >
            {e.listing_url}
          </a>
        ) : (
          <p className="mb-4 break-all text-sm text-[#8C887D]">{e.listing_url}</p>
        )
      )}

      <Card className="min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-3xl font-bold ${scoreColor(e.score)}`}>{e.score}/10</span>
          <span className="text-sm font-semibold text-[#8C887D]">{e.verdict}</span>
        </div>
        <p className="mt-3 text-sm text-[#1A1A17]">
          Estimated resale: {formatCurrency(e.estimated_resale_low)}–{formatCurrency(e.estimated_resale_high)}
        </p>
        <p className="mt-2 text-sm text-[#1A1A17]">
          <LinkifiedText text={e.reasoning} />
        </p>
        {e.red_flags.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1">
            {e.red_flags.map((flag, i) => (
              <li key={i} className="text-sm text-[#B45309]">
                ⚠ <LinkifiedText text={flag} />
              </li>
            ))}
          </ul>
        )}
        {(e.input_tokens != null || e.cost_usd != null) && (
          <p className="mt-3 border-t border-[#ECEAE3] pt-2 text-xs text-[#B3AFA5]">
            {e.input_tokens != null && e.output_tokens != null && (
              <>
                {e.input_tokens.toLocaleString()} in / {e.output_tokens.toLocaleString()} out tokens
                {e.cost_usd != null && " · "}
              </>
            )}
            {e.cost_usd != null && `$${e.cost_usd.toFixed(4)}`}
          </p>
        )}
      </Card>

      {e.description && (
        <div className="mt-4">
          <p className="mb-1 text-sm font-medium text-[#1A1A17]">
            {e.kind === "offer" ? "Offer details" : "Listing description"}
          </p>
          <p className="whitespace-pre-wrap break-words text-sm text-[#8C887D]">{e.description}</p>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-1 text-sm font-medium text-[#1A1A17]">Your notes</p>
        <Textarea
          value={notes}
          onChange={(ev) => setNotes(ev.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add a personal note..."
        />
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="mt-6 text-sm text-[#DC2626] underline"
      >
        {deleting ? "Deleting..." : "Delete this evaluation"}
      </button>
    </div>
  );
}
