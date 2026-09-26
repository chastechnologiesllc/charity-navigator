import { createServerFn } from "@tanstack/react-start";
import { CHARITIES } from "@/data/charities";

export type HorizonMatch = { slug: string; reason: string };
export type HorizonResult = {
  ok: true;
  summary: string;
  matches: HorizonMatch[];
  source: "ai" | "local";
};

const CATALOG = CHARITIES.map((c) => ({
  slug: c.slug,
  name: c.name,
  cause: c.cause,
  tags: c.tags,
  score: c.overall,
  city: c.city,
  state: c.state,
  mission: c.mission.slice(0, 140),
}));

function localHorizon(query: string): HorizonResult {
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  const scored = CHARITIES.map((c) => {
    const hay = `${c.name} ${c.cause} ${c.tags.join(" ")} ${c.mission} ${c.city} ${c.state} ${c.programs.join(" ")}`.toLowerCase();
    let score = c.overall / 20;
    for (const t of tokens) {
      if (hay.includes(t)) score += 12;
      if (c.tags.some((tag) => tag.includes(t))) score += 8;
      if (c.cause.toLowerCase().includes(t)) score += 10;
    }
    return { c, score };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const matches = scored
    .filter((x) => x.score > 8)
    .map((x) => ({
      slug: x.c.slug,
      reason: `${x.c.cause} · Encompass score ${x.c.overall}. ${x.c.mission.slice(0, 110)}`,
    }));

  return {
    ok: true,
    source: "local",
    summary: matches.length
      ? `Based on “${query}”, here are highly rated charities that match your passions.`
      : "We couldn’t find a strong match. Try a cause, city, or charity name.",
    matches,
  };
}

export const askHorizon = createServerFn({ method: "POST" })
  .validator((input: { query: string }) => input)
  .handler(async ({ data }): Promise<HorizonResult | { ok: false; error: string }> => {
    const query = data.query.trim();
    if (!query) return { ok: false, error: "Enter a question to search." };
    if (query.length > 400) return { ok: false, error: "Keep your question under 400 characters." };

    const fallback = localHorizon(query);
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return fallback;

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0.3,
          max_tokens: 700,
          messages: [
            {
              role: "system",
              content:
                'You are Horizon, Charity Navigator\'s giving assistant. Recommend 3-5 charities from the provided catalog only. Return JSON only: {"summary":"1-2 sentences","matches":[{"slug":"...","reason":"one sentence why"}]}',
            },
            {
              role: "user",
              content: `Catalog:\n${JSON.stringify(CATALOG)}\n\nDonor request: ${query}`,
            },
          ],
        }),
      });
      if (!res.ok) return fallback;
      const body = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      const text = body.choices[0]?.message.content ?? "";
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart < 0 || jsonEnd < 0) return fallback;
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
        summary?: string;
        matches?: HorizonMatch[];
      };
      const slugs = new Set(CHARITIES.map((c) => c.slug));
      const matches = (parsed.matches ?? []).filter((m) => slugs.has(m.slug)).slice(0, 6);
      if (!matches.length) return fallback;
      return {
        ok: true,
        source: "ai",
        summary: parsed.summary || fallback.summary,
        matches,
      };
    } catch {
      return fallback;
    }
  });
