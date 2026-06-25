import OpenAI from "openai";
import { NextResponse } from "next/server";

interface EvaluateResult {
  score: number;
  verdict: string;
  estimated_resale_low: number;
  estimated_resale_high: number;
  reasoning: string;
  red_flags: string[];
}

export async function POST(request: Request) {
  const { title, price, description } = await request.json();

  if (!title || typeof price !== "number") {
    return NextResponse.json({ error: "Title and asking price are required" }, { status: 400 });
  }

  const openai = new OpenAI();
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    tools: [{ type: "web_search" }],
    instructions:
      "You evaluate secondhand local marketplace listings (FB Marketplace, Craigslist, OfferUp, KSL) for resale flipping potential. " +
      "The buyer has already inspected the item's condition in person and confirmed it is not junk, so do not factor unknown-condition risk into your score. " +
      "Use web search to check current sold/asking prices for this item (eBay, FB Marketplace, etc.) rather than relying on memorized prices, since market values change. " +
      "Respond with ONLY a JSON object, no prose, matching this shape: " +
      '{"score": number 1-10, "verdict": short string, "estimated_resale_low": number, "estimated_resale_high": number, "reasoning": short string, "red_flags": string[]}',
    input: `Title: ${title}\nAsking price: $${price}\nDescription: ${description || "(none provided)"}`,
  });

  const text = response.output_text.trim().replace(/^```(?:json)?|```$/g, "").trim();

  let result: EvaluateResult;
  try {
    result = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Could not parse evaluation" }, { status: 502 });
  }

  return NextResponse.json(result);
}
