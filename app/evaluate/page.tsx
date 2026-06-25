"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";

interface EvaluateResult {
  score: number;
  verdict: string;
  estimated_resale_low: number;
  estimated_resale_high: number;
  reasoning: string;
  red_flags: string[];
}

function scoreColor(score: number): string {
  if (score >= 7) return "text-[#047857]";
  if (score >= 4) return "text-[#B45309]";
  return "text-[#DC2626]";
}

export default function EvaluatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluateResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!title.trim() || !price) {
      setError("Title and asking price are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          price: parseFloat(price),
          description: description.trim(),
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
        <h1 className="text-[14px] font-bold">Evaluate a deal</h1>
        <span className="w-12" />
      </div>

      {error && <p className="mb-4 text-sm text-[#DC2626]">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Listing title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Bambu P2S printer, barely used"
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
        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? "Evaluating..." : "Evaluate"}
        </Button>
      </form>

      {result && (
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
        </Card>
      )}
    </div>
  );
}
