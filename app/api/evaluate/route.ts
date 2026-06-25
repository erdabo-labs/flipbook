import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createEvaluation } from "@/lib/db";
import type { EvaluationKind } from "@/lib/types";

const INPUT_COST_PER_TOKEN = 0.25 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 2.0 / 1_000_000;

interface EvaluateResult {
  score: number;
  verdict: string;
  estimated_resale_low: number;
  estimated_resale_high: number;
  reasoning: string;
  red_flags: string[];
}

export async function POST(request: Request) {
  const body = await request.json();
  const kind: EvaluationKind = body.kind === "offer" ? "offer" : "listing";
  const { title, price, description, notes, listing_url, item_id } = body;

  if (!title || typeof price !== "number") {
    return NextResponse.json({ error: "Title and price are required" }, { status: 400 });
  }

  let itemContext = "";
  if (kind === "offer" && item_id) {
    const { data: item, error } = await supabase
      .from("item")
      .select("name, cost_basis, listed_price, pending_price, condition, category, acquisition:acquisition_id(acquired_date, description)")
      .eq("id", item_id)
      .single();
    if (error) {
      return NextResponse.json({ error: "Could not load item for offer evaluation" }, { status: 400 });
    }
    const acquisition = item.acquisition as unknown as { acquired_date: string; description: string } | null;
    itemContext =
      `\n\nThis offer is on an item already in inventory:\n` +
      `Item: ${item.name}\nCategory: ${item.category ?? "unknown"}\nCondition: ${item.condition ?? "unknown"}\n` +
      `Original cost basis: $${item.cost_basis}\nCurrent asking/listed price: ${item.listed_price != null ? `$${item.listed_price}` : "not listed"}\n` +
      (acquisition ? `Acquired: ${acquisition.acquired_date} (${acquisition.description})\n` : "");
  }

  const instructions =
    kind === "offer"
      ? "You evaluate incoming offers (cash or trade) on items the user already owns and is trying to sell. " +
        "Weigh the offer against the item's cost basis, current asking price, and current market value (use web search for current resale comps — don't rely on memorized prices). " +
        "If the offer includes a trade item, assess how easy that traded item would be to resell too. " +
        "The user has already inspected condition in person, so don't factor unknown-condition risk. " +
        "The user may also include their own notes/opinion — treat that as their personal read on the situation, not a verified fact, and weigh it accordingly alongside the hard data. " +
        "Respond with ONLY a JSON object, no prose, matching this shape: " +
        '{"score": number 1-10 (10 = take the offer immediately), "verdict": short string, "estimated_resale_low": number, "estimated_resale_high": number, "reasoning": short string, "red_flags": string[]}'
      : "You evaluate secondhand local marketplace listings (FB Marketplace, Craigslist, OfferUp, KSL) for resale flipping potential. " +
        "The buyer has already inspected the item's condition in person and confirmed it is not junk, so do not factor unknown-condition risk into your score. " +
        "Use web search to check current sold/asking prices for this item (eBay, FB Marketplace, etc.) rather than relying on memorized prices, since market values change. " +
        "The user may also include their own notes/opinion — treat that as their personal read on the situation, not a verified fact, and weigh it accordingly alongside the hard data. " +
        "Respond with ONLY a JSON object, no prose, matching this shape: " +
        '{"score": number 1-10, "verdict": short string, "estimated_resale_low": number, "estimated_resale_high": number, "reasoning": short string, "red_flags": string[]}';

  const notesSection = notes ? `\n\nUser's own notes/opinion (weigh as opinion, not verified fact): ${notes}` : "";

  const inputText =
    kind === "offer"
      ? `Offer: $${price}\nOffer details: ${description || "(none provided)"}${itemContext}${notesSection}`
      : `Title: ${title}\nAsking price: $${price}\nDescription: ${description || "(none provided)"}${notesSection}`;

  const openai = new OpenAI();
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    tools: [{ type: "web_search" }],
    instructions,
    input: inputText,
  });

  const text = response.output_text.trim().replace(/^```(?:json)?|```$/g, "").trim();

  let result: EvaluateResult;
  try {
    result = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Could not parse evaluation" }, { status: 502 });
  }

  const inputTokens = response.usage?.input_tokens ?? null;
  const outputTokens = response.usage?.output_tokens ?? null;
  const costUsd =
    inputTokens != null && outputTokens != null
      ? inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN
      : null;

  try {
    const evaluation = await createEvaluation({
      kind,
      title,
      listing_url: listing_url || null,
      price,
      description: description || null,
      notes: notes || null,
      item_id: kind === "offer" && item_id ? item_id : null,
      score: result.score,
      verdict: result.verdict,
      estimated_resale_low: result.estimated_resale_low,
      estimated_resale_high: result.estimated_resale_high,
      reasoning: result.reasoning,
      red_flags: result.red_flags,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
    });
    return NextResponse.json(evaluation);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save evaluation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
