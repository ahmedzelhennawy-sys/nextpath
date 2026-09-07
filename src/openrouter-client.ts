import { StudentProfile, Opportunity, ParsedSearchQuery } from "./types";

/**
 * OpenRouter client for NEXTPATH.
 *
 * Routes both chat completions and embeddings through OpenRouter so the project
 * uses ONE provider, ONE API key, and stays free-tier friendly.
 *
 * Models:
 *   - Text:       minimax/minimax-m3:free  (configurable via OPENROUTER_TEXT_MODEL)
 *   - Embeddings: nvidia/nemotron-3-embed-1b:free  (2048-dim, configurable via OPENROUTER_EMBED_MODEL)
 *
 * If OPENROUTER_API_KEY is unset, every function returns null / falls back to
 * the deterministic heuristic in ai-search.ts / ai-assistant.ts.
 */

const apiKey = process.env.OPENROUTER_API_KEY || "";
const textModel = process.env.OPENROUTER_TEXT_MODEL || "minimax/minimax-m3:free";
const embedModel = process.env.OPENROUTER_EMBED_MODEL || "nvidia/nemotron-3-embed-1b:free";

const BASE_URL = "https://openrouter.ai/api/v1";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function chat(messages: ChatMessage[], opts: { json?: boolean } = {}): Promise<string | null> {
  if (!apiKey) return null;
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/ahmedzelhennawy-sys/nextpath",
        "X-Title": "NEXTPATH",
      },
      body: JSON.stringify({
        model: textModel,
        messages,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`[OpenRouter chat ${res.status}]:`, await res.text());
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[OpenRouter chat error]:", err);
    return null;
  }
}

/**
 * 1. Semantic Embedding Generator
 * Returns a 2048-dim vector when OpenRouter is configured, otherwise null.
 *
 * NOTE: Schema currently declares vector(768). If you switch embedders you MUST
 * also run: ALTER TABLE opportunities ALTER COLUMN embedding TYPE vector(2048);
 * (or whichever dim your chosen model returns). See scripts/migrate-embedding-dim.sql.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!apiKey) return null;
  try {
    const res = await fetch(`${BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: embedModel,
        input: text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      // 429 from OpenRouter free tier: surface the reset time clearly.
      if (res.status === 429) {
        try {
          const j = JSON.parse(body);
          const reset = j?.metadata?.headers?.["X-RateLimit-Reset"];
          const resetHuman = reset ? new Date(Number(reset)).toISOString() : "unknown";
          console.error(
            `[OpenRouter embed 429 — free-tier daily quota exhausted. Reset at ${resetHuman}. ` +
              `Either wait, or buy credits. Full body: ${body.slice(0, 300)}`,
          );
        } catch {
          console.error(`[OpenRouter embed 429]:`, body.slice(0, 300));
        }
      } else {
        console.error(`[OpenRouter embed ${res.status}]:`, body.slice(0, 300));
      }
      return null;
    }
    const data = (await res.json()) as { data?: { embedding?: number[] }[] };
    return data.data?.[0]?.embedding ?? null;
  } catch (err) {
    console.error("[OpenRouter embed error]:", err);
    return null;
  }
}

export function getEmbeddingDim(): number {
  // Nemotron 3 Embed 1B outputs 2048 dims. Adjust if you swap embedModel.
  return 2048;
}

/**
 * 2. Natural-Language Query Parsing
 * Returns structured filters; falls back to deterministic heuristic if no key.
 */
export async function parseQueryWithLLM(query: string): Promise<ParsedSearchQuery> {
  if (!apiKey) {
    const { parseNaturalLanguageQuery } = await import("./ai-search");
    return parseNaturalLanguageQuery(query);
  }

  const systemInstruction = `
You are NEXTPATH's Opportunity Query Parser.
Extract search filters from the student query. Return ONLY valid JSON with:
{
  "extractedFilters": {
    "type": "scholarship" | "internship" | "hackathon" | "research" | "exchange" | "competition" | undefined,
    "fundingType": "fully_funded" | "partial" | "paid" | "unpaid" | undefined,
    "field": string | undefined,
    "locationCountry": string | undefined,
    "locationMode": "remote" | "in_person" | "hybrid" | undefined,
    "degreeLevel": "bachelor" | "master" | "phd" | undefined,
    "nationality": string | undefined
  },
  "semanticKeywords": string[],
  "explanation": string
}
`.trim();

  const raw = await chat(
    [
      { role: "system", content: systemInstruction },
      { role: "user", content: query },
    ],
    { json: true },
  );

  if (!raw) {
    const { parseNaturalLanguageQuery } = await import("./ai-search");
    return parseNaturalLanguageQuery(query);
  }

  try {
    return JSON.parse(raw) as ParsedSearchQuery;
  } catch (err) {
    console.error("[OpenRouter parser JSON parse error, falling back]:", err);
    const { parseNaturalLanguageQuery } = await import("./ai-search");
    return parseNaturalLanguageQuery(query);
  }
}

/**
 * 3. Motivation Letter Generator (Zero-Hallucination Guardrail)
 * Strictly grounded in the student profile.
 */
export async function generateMotivationLetterWithLLM(
  profile: StudentProfile,
  opportunity: Opportunity,
): Promise<{
  subject: string;
  letter: string;
  groundedFactsUsed: string[];
}> {
  const currentEdu = profile.education?.[0];
  const groundedFactsUsed: string[] = [
    `Student: ${profile.fullName}`,
    `Nationality: ${profile.nationality}`,
    `Major: ${currentEdu?.major || "General Studies"} at ${currentEdu?.institution || "University"}`,
    `GPA: ${currentEdu?.gpa ? currentEdu.gpa + "/" + (currentEdu.gpaScale || 4.0) : "Not specified"}`,
    `Skills: ${(profile.skills || []).join(", ") || "Technical and analytical skills"}`,
    `Interests: ${(profile.interests || []).join(", ") || "N/A"}`,
  ];

  if (!apiKey) {
    const { draftMotivationLetter } = await import("./ai-assistant");
    return draftMotivationLetter(profile, opportunity);
  }

  const prompt = `
You are NEXTPATH's Application Assistant. Draft a compelling motivation letter strictly grounded in this student profile.

RULES:
1. Ground every claim strictly in the student's real profile below.
2. DO NOT hallucinate fake companies, degrees, or unearned awards.
3. Keep the tone ambitious, concise, and professional.

STUDENT PROFILE:
${JSON.stringify(profile, null, 2)}

TARGET OPPORTUNITY:
${JSON.stringify(opportunity, null, 2)}

Output format (plain text, no markdown):
Subject: [Subject Line]

[Body of the letter]
`.trim();

  const rawText = await chat([{ role: "user", content: prompt }]);

  if (!rawText) {
    const { draftMotivationLetter } = await import("./ai-assistant");
    return draftMotivationLetter(profile, opportunity);
  }

  const subjectMatch = rawText.match(/Subject:\s*(.*)/i);
  const subject = subjectMatch
    ? subjectMatch[1].trim()
    : `Application for ${opportunity.title} — ${profile.fullName}`;
  const letter = rawText.replace(/Subject:.*\n*/i, "").trim();

  return { subject, letter, groundedFactsUsed };
}
