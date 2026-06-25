"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { deleteEvaluation, getEvaluation, getEvaluationMessages, updateEvaluationNotes } from "@/lib/db";
import type { Evaluation, EvaluationMessage } from "@/lib/types";
import { formatCurrency, formatDate, isValidUrl } from "@/lib/format";
import { LoadingState } from "@/components/ui/Empty";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { LinkifiedText } from "@/components/ui/LinkifiedText";
import { FlippyMark } from "@/components/ui/FlippyMark";

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
  const [messages, setMessages] = useState<EvaluationMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const e = await getEvaluation(id);
      setEvaluation(e);
      setNotes(e?.notes ?? "");
      const msgs = await getEvaluationMessages(id);
      setMessages(msgs);
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleAsk(ev: React.FormEvent) {
    ev.preventDefault();
    const text = question.trim();
    if (!text || !evaluation) return;
    setAsking(true);
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: -1, evaluation_id: evaluation.id, role: "user", content: text, input_tokens: null, output_tokens: null, cost_usd: null, created_at: new Date().toISOString() },
    ]);
    setQuestion("");
    try {
      const res = await fetch(`/api/evaluations/${evaluation.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not get an answer");
      const msgs = await getEvaluationMessages(evaluation.id);
      setMessages(msgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAsking(false);
    }
  }

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
        {e.suggested_offer != null && (
          <div className="mt-3 rounded-[10px] bg-[#ECFDF5] p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[#047857]">
              <FlippyMark className="h-4 w-4" />
              Flippy suggests offering {formatCurrency(e.suggested_offer)}
            </p>
            {e.suggested_message && (
              <p className="mt-1 text-sm text-[#1A1A17]">&ldquo;{e.suggested_message}&rdquo;</p>
            )}
          </div>
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

      <LinkButton href={`/evaluate?from=${e.id}`} variant="secondary" className="mt-4 w-full">
        Edit details &amp; re-evaluate
      </LinkButton>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-[#1A1A17]">Ask Flippy a follow-up</p>
        <div className="flex flex-col gap-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-[12px] px-3 py-2 text-sm ${
                m.role === "user" ? "self-end bg-[#047857] text-white" : "self-start bg-[#F4F2EC] text-[#1A1A17]"
              }`}
            >
              <LinkifiedText text={m.content} />
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleAsk} className="mt-3 flex gap-2">
          <input
            value={question}
            onChange={(ev) => setQuestion(ev.target.value)}
            placeholder="e.g. should I counter at $50?"
            className="min-h-[44px] flex-1 rounded-[12px] border border-[#E3E0D7] bg-white px-3 py-2 text-sm focus:border-[#047857] focus:outline-none"
          />
          <Button type="submit" disabled={asking || !question.trim()}>
            {asking ? "..." : "Ask"}
          </Button>
        </form>
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
