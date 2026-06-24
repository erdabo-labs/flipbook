import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic();

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

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system:
      "You evaluate secondhand local marketplace listings (FB Marketplace, Craigslist, OfferUp, KSL) for resale flipping potential. " +
      "The buyer has already inspected the item's condition in person and confirmed it is not junk, so do not factor unknown-condition risk into your score. " +
      "Base your estimate on the title, asking price, and description alone. Respond with ONLY a JSON object, no prose, matching this shape: " +
      '{"score": number 1-10, "verdict": short string, "estimated_resale_low": number, "estimated_resale_high": number, "reasoning": short string, "red_flags": string[]}',
    messages: [
      {
        role: "user",
        content: `Title: ${title}\nAsking price: $${price}\nDescription: ${description || "(none provided)"}`,
      },
    ],
  });

  const text = message.content.find((block) => block.type === "text")?.text ?? "";
  let result: EvaluateResult;
  try {
    result = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Could not parse evaluation" }, { status: 502 });
  }

  return NextResponse.json(result);
}
