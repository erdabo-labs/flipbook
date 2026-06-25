import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getEvaluation, getEvaluationMessages, getFlippyProfile } from "@/lib/db";
import { supabase } from "@/lib/supabase";

const INPUT_COST_PER_TOKEN = 0.25 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 2.0 / 1_000_000;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evaluationId = Number(id);
  const body = await request.json();
  const question: string = (body.message || "").trim();
  if (!question) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const evaluation = await getEvaluation(evaluationId);
  if (!evaluation) {
    return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
  }
  const history = await getEvaluationMessages(evaluationId);
  const profile = await getFlippyProfile();

  const profileSection = profile
    ? `\n\nAbout the user: ${[
        profile.location && `Location: ${profile.location}`,
        profile.platforms && `Sells on: ${profile.platforms}`,
        `Ships items: ${profile.ships_items ? "yes" : "no, local only"}`,
        profile.style_notes && `Style notes: ${profile.style_notes}`,
      ]
        .filter(Boolean)
        .join(". ")}`
    : "";

  const instructions =
    "You are Flippy, a sharp, friendly AI sidekick for a local reseller. You already evaluated this item/offer below — " +
    "answer the user's follow-up question using that context. Be concise and practical. If they ask for a counter-offer or a message to send, " +
    "give them a specific number and a short draft message they can copy. Don't repeat the full evaluation back unless asked." +
    profileSection +
    `\n\nOriginal evaluation:\nKind: ${evaluation.kind}\nTitle: ${evaluation.title}\nPrice: $${evaluation.price}\n` +
    `Description: ${evaluation.description ?? "(none)"}\nScore: ${evaluation.score}/10\nVerdict: ${evaluation.verdict}\n` +
    `Reasoning: ${evaluation.reasoning}\nRed flags: ${evaluation.red_flags.join(", ") || "none"}\n` +
    (evaluation.suggested_offer != null ? `Suggested offer: $${evaluation.suggested_offer}\n` : "") +
    (evaluation.notes ? `User's notes: ${evaluation.notes}\n` : "");

  const conversation = [
    ...history.map((m) => `${m.role === "user" ? "User" : "Flippy"}: ${m.content}`),
    `User: ${question}`,
  ].join("\n\n");

  const openai = new OpenAI();
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    instructions,
    input: conversation,
  });

  const answer = response.output_text.trim();
  const inputTokens = response.usage?.input_tokens ?? null;
  const outputTokens = response.usage?.output_tokens ?? null;
  const costUsd =
    inputTokens != null && outputTokens != null
      ? inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN
      : null;

  const { error: insertError } = await supabase.from("evaluation_message").insert([
    { evaluation_id: evaluationId, role: "user", content: question },
    {
      evaluation_id: evaluationId,
      role: "assistant",
      content: answer,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
    },
  ]);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ answer, cost_usd: costUsd });
}
