import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createEvaluation, getFlippyProfile } from "@/lib/db";
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
  suggested_offer: number | null;
  suggested_message: string | null;
}

const VALID_KINDS: EvaluationKind[] = ["listing", "offer", "grade", "sale"];

export async function POST(request: Request) {
  const body = await request.json();
  const kind: EvaluationKind = VALID_KINDS.includes(body.kind) ? body.kind : "listing";
  const { title, price, description, notes, listing_url, item_id, previous_evaluation_id } = body;

  if (!title || typeof price !== "number") {
    return NextResponse.json({ error: "Title and price are required" }, { status: 400 });
  }

  let itemContext = "";
  if ((kind === "offer" || kind === "grade") && item_id) {
    const { data: item, error } = await supabase
      .from("item")
      .select("name, cost_basis, listed_price, pending_price, condition, category, acquisition:acquisition_id(acquired_date, description)")
      .eq("id", item_id)
      .single();
    if (error) {
      return NextResponse.json({ error: "Could not load item for evaluation" }, { status: 400 });
    }
    const acquisition = item.acquisition as unknown as { acquired_date: string; description: string } | null;
    if (kind === "offer") {
      itemContext =
        `\n\nThis offer is on an item already in inventory:\n` +
        `Item: ${item.name}\nCategory: ${item.category ?? "unknown"}\nCondition: ${item.condition ?? "unknown"}\n` +
        `Original cost basis: $${item.cost_basis}\nCurrent asking/listed price: ${item.listed_price != null ? `$${item.listed_price}` : "not listed"}\n` +
        (acquisition ? `Acquired: ${acquisition.acquired_date} (${acquisition.description})\n` : "");
    } else {
      itemContext =
        `\n\nThis item is already in the user's inventory (they already bought it — you're not deciding whether to buy it):\n` +
        `Item: ${item.name}\nCategory: ${item.category ?? "unknown"}\nCondition: ${item.condition ?? "unknown"}\n` +
        `Cost basis (what they paid): $${item.cost_basis}\nCurrent status: ${item.listed_price != null ? `listed at $${item.listed_price}` : item.pending_price != null ? `pending sale at $${item.pending_price}` : "not yet listed"}\n` +
        (acquisition ? `Acquired: ${acquisition.acquired_date} (${acquisition.description})\n` : "");
    }
  }

  let saleContext = "";
  if (kind === "sale") {
    const {
      sale_cost_basis,
      sale_category,
      sale_condition,
      sale_platform,
      sale_counterparty,
      sale_transaction_date,
      sale_acquired_date,
    } = body;
    saleContext =
      `\n\nThis sale has already happened — you're grading it in hindsight, not deciding anything:\n` +
      `Item: ${title}\nCategory: ${sale_category || "unknown"}\nCondition: ${sale_condition || "unknown"}\n` +
      `Cost basis (what they paid): $${sale_cost_basis ?? "unknown"}\nSold for: $${price}\n` +
      `Platform: ${sale_platform || "unknown"}\nBuyer: ${sale_counterparty || "unknown"}\n` +
      (sale_acquired_date ? `Acquired: ${sale_acquired_date}\n` : "") +
      (sale_transaction_date ? `Sold: ${sale_transaction_date}\n` : "");
  }

  const profile = await getFlippyProfile();
  const profileSection = profile
    ? `\n\nAbout the user you're helping (use this to tailor your evaluation):\n` +
      (profile.location ? `Location: ${profile.location}\n` : "") +
      (profile.platforms ? `Sells on: ${profile.platforms}\n` : "") +
      `Ships items: ${profile.ships_items ? "yes" : "no — local pickup/meetup only, factor in local demand, not nationwide eBay-only demand"}\n` +
      (profile.style_notes ? `Their personal evaluation style/preferences: ${profile.style_notes}\n` : "")
    : "";

  const personality =
    "You are Flippy, a sharp, friendly AI sidekick for a local reseller. Keep verdicts punchy and a little personable, but always substantive — no fluff. ";

  const offerGuidance =
    "Also decide whether a counter-offer is warranted: if the current price/offer is already solid, set suggested_offer to null and say so plainly in the verdict (don't suggest lowballing a fair deal). " +
    "If there's clearly room to negotiate, set suggested_offer to the number you'd propose and suggested_message to a short, casual message the user could send to make that offer.";

  const JSON_SHAPE =
    '{"score": number 1-10, "verdict": short string, "estimated_resale_low": number, "estimated_resale_high": number, "reasoning": short string, "red_flags": string[], "suggested_offer": number|null, "suggested_message": string|null}';

  const instructions =
    kind === "offer"
      ? personality +
        "You evaluate incoming offers (cash or trade) on items the user already owns and is trying to sell. " +
        "Weigh the offer against the item's cost basis, current asking price, and current market value (use web search for current resale comps — don't rely on memorized prices). " +
        "If the offer includes a trade item, assess how easy that traded item would be to resell too. " +
        "The user has already inspected condition in person, so don't factor unknown-condition risk. " +
        "The user may also include their own notes/opinion — treat that as their personal read on the situation, not a verified fact, and weigh it accordingly alongside the hard data. " +
        "suggested_offer here means the counter-offer to propose back to the buyer if their offer is too low. " +
        offerGuidance +
        profileSection +
        " Respond with ONLY a JSON object, no prose, matching this shape: " +
        JSON_SHAPE
      : kind === "grade"
        ? personality +
          "You're grading a purchase the user already made and owns — don't evaluate whether to buy it, that decision is done. " +
          "Assess in hindsight whether it was a good purchase given the cost basis vs. likely resale value (use web search for current sold/asking comps — don't rely on memorized prices), " +
          "and recommend what to list it for now given current market value. " +
          "suggested_offer here means the listing price you'd recommend; suggested_message is a short marketplace listing blurb they could use, or null if you have nothing useful to add. " +
          "score 1-10 reflects how good the original deal was (10 = steal). " +
          profileSection +
          " Respond with ONLY a JSON object, no prose, matching this shape: " +
          JSON_SHAPE
        : kind === "sale"
          ? personality +
            "You're grading a sale that has ALREADY happened — there's nothing left to decide, you're just giving the user feedback in hindsight. " +
            "Use web search for comps to judge whether the sale price was fair given the item, condition, and platform. Factor in cost basis (was it profitable) and how long they held it if known. " +
            "score 1-10 reflects how good the sale was (10 = sold for great value quickly). " +
            "suggested_offer and suggested_message should be null — there's no future action here, just a verdict and reasoning. If you have a quick tip for next time, put it in reasoning instead. " +
            profileSection +
            " Respond with ONLY a JSON object, no prose, matching this shape: " +
            JSON_SHAPE
          : personality +
            "You evaluate secondhand local marketplace listings (FB Marketplace, Craigslist, OfferUp, KSL) for resale flipping potential. " +
            "The buyer has already inspected the item's condition in person and confirmed it is not junk, so do not factor unknown-condition risk into your score. " +
            "Use web search to check current sold/asking prices for this item (eBay, FB Marketplace, etc.) rather than relying on memorized prices, since market values change. " +
            "The user may also include their own notes/opinion — treat that as their personal read on the situation, not a verified fact, and weigh it accordingly alongside the hard data. " +
            "suggested_offer here means what the user should offer the seller, if lower than asking price is worth trying. " +
            offerGuidance +
            profileSection +
            " Respond with ONLY a JSON object, no prose, matching this shape: " +
            JSON_SHAPE;

  const notesSection = notes ? `\n\nUser's own notes/opinion (weigh as opinion, not verified fact): ${notes}` : "";

  const inputText =
    kind === "offer"
      ? `Offer: $${price}\nOffer details: ${description || "(none provided)"}${itemContext}${notesSection}`
      : kind === "grade"
        ? `Item: ${title}\nCost basis: $${price}\nAdditional context: ${description || "(none provided)"}${itemContext}${notesSection}`
        : kind === "sale"
          ? `Item: ${title}\nSold for: $${price}${saleContext}${notesSection}`
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
      item_id: (kind === "offer" || kind === "grade" || kind === "sale") && item_id ? item_id : null,
      score: result.score,
      verdict: result.verdict,
      estimated_resale_low: result.estimated_resale_low,
      estimated_resale_high: result.estimated_resale_high,
      reasoning: result.reasoning,
      red_flags: result.red_flags,
      suggested_offer: result.suggested_offer ?? null,
      suggested_message: result.suggested_message ?? null,
      previous_evaluation_id: typeof previous_evaluation_id === "number" ? previous_evaluation_id : null,
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
