import type { NextRequest } from "next/server";
import {
  GROQ_URL,
  GROQ_MODEL,
  MAX_QUERY_LEN,
  buildTowerMessages,
  lookupSources,
} from "@/lib/tower";
import type { Profile } from "@/lib/types";

// Node runtime for reliable streaming + the IPv4 fetch fix mirrored from
// lib/actions/claude.ts (some hosts stall on dual-stack IPv6).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dns").setDefaultResultOrder("ipv4first");
} catch {
  /* not available in this runtime — safe to ignore */
}

interface TowerBody {
  query?: string;
  sourceKeys?: string[];
  profile?: Profile;
}

function bad(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  // Signal the client to fall back to plain source cards, not a hard failure.
  if (!apiKey) return bad(503, "nokey");

  let body: TowerBody;
  try {
    body = (await req.json()) as TowerBody;
  } catch {
    return bad(400, "bad-json");
  }

  const query = (body.query ?? "").trim().slice(0, MAX_QUERY_LEN);
  if (!query) return bad(400, "empty-query");

  // Ground strictly on the sources the client already resolved + displayed.
  const sources = lookupSources(Array.isArray(body.sourceKeys) ? body.sourceKeys : []);
  if (sources.length === 0) return bad(422, "no-sources");

  const messages = buildTowerMessages(query, sources, body.profile);

  let upstream: Response;
  try {
    upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 400,
        stream: true,
        messages,
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (e) {
    console.error("tower groq fetch", e);
    return bad(502, "upstream-failed");
  }

  if (!upstream.ok || !upstream.body) {
    console.error("tower groq", upstream.status, await upstream.text().catch(() => ""));
    return bad(502, "upstream-error");
  }

  // Parse Groq's OpenAI-style SSE and re-emit only the content deltas as plain
  // UTF-8 text, so the client can append tokens directly with no SSE parsing.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep the trailing partial line
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
          };
          const token = json.choices?.[0]?.delta?.content;
          if (token) controller.enqueue(encoder.encode(token));
        } catch {
          /* ignore keep-alive / non-JSON lines */
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
