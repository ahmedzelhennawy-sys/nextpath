import { GoogleGenAI } from "@google/genai";
import { StudentProfile, Opportunity, ParsedSearchQuery } from "./types";

const apiKey = process.env.GEMINI_API_KEY || "";

let ai: any = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

/**
 * 1. Semantic Embedding Generator (text-embedding-004)
 * Generates 768-dimensional vector embedding for vector search in Supabase (pgvector).
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!apiKey || !ai) {
    return null;
  }
  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });
    return response.embedding?.values || null;
  } catch (err) {
    console.error("[Gemini Embedding Error]:", err);
    return null;
  }
}

/**
 * 2. Natural-Language Query Parsing with Gemini
 * Translates user prompt into structured SQL filters and semantic terms.
 */
export async function parseQueryWithGemini(query: string): Promise<ParsedSearchQuery> {
  if (!apiKey || !ai) {
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
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() || "{}";
    return JSON.parse(text) as ParsedSearchQuery;
  } catch (error) {
    console.error("[Gemini Parser Error, using heuristic]:", error);
    const { parseNaturalLanguageQuery } = await import("./ai-search");
    return parseNaturalLanguageQuery(query);
  }
}

/**
 * 3. AI Application & Motivation Letter Generator
 * Strictly grounded in student profile data (Zero Hallucination Guardrail).
 */
export async function generateMotivationLetterWithGemini(
  profile: StudentProfile,
  opportunity: Opportunity
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

  if (!apiKey || !ai) {
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

Output format:
Subject: [Subject Line]

[Body of the letter]
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || "";
    const subjectMatch = rawText.match(/Subject:\s*(.*)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : `Application for ${opportunity.title} — ${profile.fullName}`;
    const letter = rawText.replace(/Subject:.*\n*/i, "").trim();

    return {
      subject,
      letter,
      groundedFactsUsed,
    };
  } catch (error) {
    const { draftMotivationLetter } = await import("./ai-assistant");
    return draftMotivationLetter(profile, opportunity);
  }
}
