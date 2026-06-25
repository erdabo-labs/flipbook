"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LinkifiedText } from "@/components/ui/LinkifiedText";
import { FlippyMark } from "@/components/ui/FlippyMark";
import { formatCurrency } from "@/lib/format";
import { getEvaluation, getInventoryItems } from "@/lib/db";
import type { Evaluation, EvaluationKind, Item } from "@/lib/types";

function scoreColor(score: number): string {
  if (score >= 7) return "text-[#047857]";
  if (score >= 4) return "text-[#B45309]";
  return "text-[#DC2626]";
}

function ResultCard({ result }: { result: Evaluation }) {
  return (
    <Card className="mt-6 min-w-0">
      <div className="flex items-center justify-between">
        <span className={`text-3xl font-bold ${scoreColor(result.score)}`}>{result.score}/10</span>
        <span className="text-sm font-semibold text-[#8C887D]">{result.verdict}</span>
      </div>
      <p className="mt-3 text-sm text-[#1A1A17]">
        Estimated resale: {formatCurrency(result.estimated_resale_low)}–
        {formatCurrency(result.estimated_resale_high)}
      </p>
      <p className="mt-2 text-sm text-[#1A1A17]">
        <LinkifiedText text={result.reasoning} />
      </p>
      {result.red_flags.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {result.red_flags.map((flag, i) => (
            <li key={i} className="text-sm text-[#B45309]">
              ⚠ <LinkifiedText text={flag} />
            </li>
          ))}
        </ul>
      )}
      {result.suggested_offer != null && (
        <div className="mt-3 rounded-[10px] bg-[#ECFDF5] p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[#047857]">
            <FlippyMark className="h-4 w-4" />
            Flippy suggests {result.kind === "grade" || result.kind === "grade_deal" ? "listing it at" : "offering"}{" "}
            {formatCurrency(result.suggested_offer)}
          </p>
          {result.suggested_message && (
            <p className="mt-1 text-sm text-[#1A1A17]">&ldquo;{result.suggested_message}&rdquo;</p>
          )}
        </div>
      )}
      {(result.input_tokens != null || result.cost_usd != null) && (
        <p className="mt-3 border-t border-[#ECEAE3] pt-2 text-xs text-[#B3AFA5]">
          {result.input_tokens != null && result.output_tokens != null && (
            <>
              {result.input_tokens.toLocaleString()} in / {result.output_tokens.toLocaleString()} out tokens
              {result.cost_usd != null && " · "}
            </>
          )}
          {result.cost_usd != null && `$${result.cost_usd.toFixed(4)}`}
        </p>
      )}
    </Card>
  );
}

function EvaluateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialKind = searchParams.get("kind");
  const [kind, setKind] = useState<EvaluationKind>(
    initialKind === "offer" || initialKind === "grade" || initialKind === "grade_deal" || initialKind === "sale"
      ? initialKind
      : "listing"
  );
  const acquisitionId = searchParams.get("acquisition_id") ?? "";
  const [title, setTitle] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [itemId, setItemId] = useState(searchParams.get("item_id") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  const reEvaluateId = searchParams.get("from");
  const [saleCtx, setSaleCtx] = useState<{
    cost_basis: string;
    category: string;
    condition: string;
    platform: string;
    counterparty: string;
    transaction_date: string;
    acquired_date: string;
  } | null>(null);

  useEffect(() => {
    if ((kind === "offer" || kind === "grade") && items.length === 0) {
      getInventoryItems().then(setItems).catch((e) => setError(e.message));
    }
  }, [kind, items.length]);

  useEffect(() => {
    if (kind !== "grade_deal") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill from URL on mount
    setTitle(searchParams.get("title") ?? "");
    setPrice(searchParams.get("price") ?? "");
  }, [kind, searchParams]);

  useEffect(() => {
    if (kind !== "sale") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill from URL on mount
    setTitle(searchParams.get("item_name") ?? "");
    setPrice(searchParams.get("cash_amount") ?? "");
    setSaleCtx({
      cost_basis: searchParams.get("cost_basis") ?? "",
      category: searchParams.get("category") ?? "",
      condition: searchParams.get("condition") ?? "",
      platform: searchParams.get("platform") ?? "",
      counterparty: searchParams.get("counterparty") ?? "",
      transaction_date: searchParams.get("transaction_date") ?? "",
      acquired_date: searchParams.get("acquired_date") ?? "",
    });
  }, [kind, searchParams]);

  useEffect(() => {
    if (!reEvaluateId) return;
    getEvaluation(Number(reEvaluateId)).then((e) => {
      if (!e) return;
      setKind(e.kind);
      setTitle(e.title);
      setListingUrl(e.listing_url ?? "");
      setPrice(String(e.price));
      setDescription(e.description ?? "");
      setNotes(e.notes ?? "");
      if (e.item_id) setItemId(String(e.item_id));
    });
  }, [reEvaluateId]);

  const selectedItem = items.find((i) => i.id === Number(itemId));

  useEffect(() => {
    if (kind === "grade" && selectedItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- autofill price when item picked
      setPrice(String(selectedItem.cost_basis));
    }
  }, [kind, selectedItem]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (kind === "listing" && !title.trim()) {
      setError("Listing title is required.");
      return;
    }
    if ((kind === "offer" || kind === "grade") && !itemId) {
      setError(kind === "offer" ? "Select which item the offer is on." : "Select which item to grade.");
      return;
    }
    if (!price) {
      setError("Price is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title:
            kind === "offer"
              ? `Offer on ${selectedItem?.name ?? "item"}`
              : kind === "grade"
                ? `Grade: ${selectedItem?.name ?? "item"}`
                : title.trim(),
          listing_url: kind === "listing" ? listingUrl.trim() : "",
          price: parseFloat(price),
          description: description.trim(),
          notes: notes.trim(),
          item_id: kind === "offer" || kind === "grade" ? Number(itemId) : null,
          acquisition_id: kind === "grade_deal" && acquisitionId ? Number(acquisitionId) : null,
          previous_evaluation_id: reEvaluateId ? Number(reEvaluateId) : null,
          sale_cost_basis: saleCtx?.cost_basis ? parseFloat(saleCtx.cost_basis) : null,
          sale_category: saleCtx?.category || null,
          sale_condition: saleCtx?.condition || null,
          sale_platform: saleCtx?.platform || null,
          sale_counterparty: saleCtx?.counterparty || null,
          sale_transaction_date: saleCtx?.transaction_date || null,
          sale_acquired_date: saleCtx?.acquired_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="text-sm font-medium text-[#8C887D]">
          Cancel
        </button>
        <h1 className="text-[14px] font-bold">
          {reEvaluateId
            ? "Re-evaluate with Flippy"
            : kind === "sale"
              ? "Grade this sale"
              : kind === "grade_deal"
                ? "Grade this deal"
                : "Ask Flippy"}
        </h1>
        <span className="w-12" />
      </div>

      {kind !== "sale" && kind !== "grade_deal" && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setKind("listing")}
            className={`flex-1 rounded-[12px] px-3 py-2.5 text-sm font-semibold ${
              kind === "listing" ? "bg-[#047857] text-white" : "bg-[#F4F2EC] text-[#1A1A17]"
            }`}
          >
            New listing
          </button>
          <button
            type="button"
            onClick={() => setKind("offer")}
            className={`flex-1 rounded-[12px] px-3 py-2.5 text-sm font-semibold ${
              kind === "offer" ? "bg-[#047857] text-white" : "bg-[#F4F2EC] text-[#1A1A17]"
            }`}
          >
            Offer on my item
          </button>
          <button
            type="button"
            onClick={() => setKind("grade")}
            className={`flex-1 rounded-[12px] px-3 py-2.5 text-sm font-semibold ${
              kind === "grade" ? "bg-[#047857] text-white" : "bg-[#F4F2EC] text-[#1A1A17]"
            }`}
          >
            Grade my item
          </button>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-[#DC2626]">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {kind === "listing" ? (
          <>
            <Input
              label="Listing title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bambu P2S printer, barely used"
            />
            <Input
              label="Listing link (optional)"
              value={listingUrl}
              onChange={(e) => setListingUrl(e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Asking price"
              type="number"
              inputMode="decimal"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
            <Textarea
              label="Listing description (paste it in)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the seller's description here..."
            />
          </>
        ) : kind === "offer" ? (
          <>
            <Select label="Which item is the offer on?" value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">Select item</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} — cost {formatCurrency(i.cost_basis)}
                  {i.listed_price != null ? `, asking ${formatCurrency(i.listed_price)}` : ""}
                </option>
              ))}
            </Select>
            <Input
              label="Offer amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
            <Textarea
              label="Offer details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. trading a drone plus $200 cash, or just notes on the buyer's offer"
            />
          </>
        ) : kind === "grade" ? (
          <>
            <Select label="Which item do you want graded?" value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">Select item</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} — cost {formatCurrency(i.cost_basis)}
                  {i.listed_price != null ? `, asking ${formatCurrency(i.listed_price)}` : ""}
                </option>
              ))}
            </Select>
            {selectedItem && (
              <p className="text-sm text-[#8C887D]">
                Cost basis: {formatCurrency(selectedItem.cost_basis)} — Flippy will assess the deal and suggest a
                listing price.
              </p>
            )}
            <Textarea
              label="Additional context (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anything else worth knowing — repairs done, accessories included, etc."
            />
          </>
        ) : kind === "grade_deal" ? (
          <div className="rounded-[14px] border border-[#ECEAE3] bg-white p-4">
            <p className="font-medium text-[#1A1A17]">{title}</p>
            <p className="mt-1 text-sm text-[#8C887D]">
              Total cost {formatCurrency(parseFloat(price) || 0)} — Flippy will look at every item in this deal
              and grade it as a whole.
            </p>
          </div>
        ) : (
          <div className="rounded-[14px] border border-[#ECEAE3] bg-white p-4">
            <p className="font-medium text-[#1A1A17]">{title}</p>
            <p className="mt-1 text-sm text-[#8C887D]">
              Sold for {formatCurrency(parseFloat(price) || 0)}
              {saleCtx?.cost_basis && ` — cost basis ${formatCurrency(parseFloat(saleCtx.cost_basis))}`}
            </p>
            {saleCtx?.platform && <p className="mt-1 text-sm text-[#8C887D]">Platform: {saleCtx.platform}</p>}
            {saleCtx?.transaction_date && (
              <p className="mt-1 text-sm text-[#8C887D]">Sold: {saleCtx.transaction_date}</p>
            )}
          </div>
        )}
        <Textarea
          label="Your notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Your own read on this — seller seems motivated, you suspect it's a flipper, gut feeling, etc. Weighed as your opinion, not a verified fact."
        />
        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? "Evaluating..." : "Evaluate"}
        </Button>
      </form>

      {result && <ResultCard result={result} />}
    </div>
  );
}

export default function EvaluatePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#8C887D]">Loading...</div>}>
      <EvaluateForm />
    </Suspense>
  );
}
