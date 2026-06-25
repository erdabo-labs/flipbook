"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { getInventoryItems } from "@/lib/db";
import type { Evaluation, EvaluationKind, Item } from "@/lib/types";

function scoreColor(score: number): string {
  if (score >= 7) return "text-[#047857]";
  if (score >= 4) return "text-[#B45309]";
  return "text-[#DC2626]";
}

function ResultCard({ result }: { result: Evaluation }) {
  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between">
        <span className={`text-3xl font-bold ${scoreColor(result.score)}`}>{result.score}/10</span>
        <span className="text-sm font-semibold text-[#8C887D]">{result.verdict}</span>
      </div>
      <p className="mt-3 text-sm text-[#1A1A17]">
        Estimated resale: {formatCurrency(result.estimated_resale_low)}–
        {formatCurrency(result.estimated_resale_high)}
      </p>
      <p className="mt-2 text-sm text-[#1A1A17]">{result.reasoning}</p>
      {result.red_flags.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {result.red_flags.map((flag, i) => (
            <li key={i} className="text-sm text-[#B45309]">
              ⚠ {flag}
            </li>
          ))}
        </ul>
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
  const [kind, setKind] = useState<EvaluationKind>(searchParams.get("kind") === "offer" ? "offer" : "listing");
  const [title, setTitle] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [itemId, setItemId] = useState(searchParams.get("item_id") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);

  useEffect(() => {
    if (kind === "offer" && items.length === 0) {
      getInventoryItems().then(setItems).catch((e) => setError(e.message));
    }
  }, [kind, items.length]);

  const selectedItem = items.find((i) => i.id === Number(itemId));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (kind === "listing" && !title.trim()) {
      setError("Listing title is required.");
      return;
    }
    if (kind === "offer" && !itemId) {
      setError("Select which item the offer is on.");
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
          title: kind === "offer" ? `Offer on ${selectedItem?.name ?? "item"}` : title.trim(),
          listing_url: kind === "listing" ? listingUrl.trim() : "",
          price: parseFloat(price),
          description: description.trim(),
          item_id: kind === "offer" ? Number(itemId) : null,
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
        <h1 className="text-[14px] font-bold">New evaluation</h1>
        <span className="w-12" />
      </div>

      <div className="mb-4 flex gap-2">
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
      </div>

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
        ) : (
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
        )}
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
