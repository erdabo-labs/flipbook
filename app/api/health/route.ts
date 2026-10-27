// Liveness only. Does not contact PostgreSQL or OpenAI, or expose configuration.
export function GET() { return Response.json({ ok: true }); }
