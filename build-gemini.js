const fs = require('fs');

const geminiCode = import { GoogleGenAI } from '@google/genai';
import { StudentProfile, Opportunity, ParsedSearchQuery } from './types';

const apiKey = process.env.GEMINI_API_KEY || '';

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!apiKey || !ai) {
    console.warn('[Gemini] GEMINI_API_KEY not configured, skipping live embedding generation.');
    return null;
  }
  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });
    return response.embedding?.values || null;
  } catch (error) {
    console.error('[Gemini Embedding Error]:', error);
    return null;
  }
}

export async function parseQueryWithGemini(query: string): Promise<ParsedSearchQuery> {
  if (!apiKey || !ai) {
    const { parseNaturalLanguageQuery } = await import('./ai-search');
    return parseNaturalLanguageQuery(query);
  }

  const systemInstruction = 'You are NEXTPATH Opportunity Query Parser. Extract search filters from student query. Return JSON with extractedFilters, semanticKeywords, explanation.';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    return JSON.parse(text) as ParsedSearchQuery;
  } catch (error) {
    const { parseNaturalLanguageQuery } = await import('./ai-search');
    return parseNaturalLanguageQuery(query);
  }
}

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
    'Student: ' + profile.fullName,
    'Nationality: ' + profile.nationality,
    'Major: ' + (currentEdu?.major || 'General Studies') + ' at ' + (currentEdu?.institution || 'University'),
    'GPA: ' + (currentEdu?.gpa ? currentEdu.gpa + '/' + (currentEdu.gpaScale || 4.0) : 'Not specified'),
    'Skills: ' + ((profile.skills || []).join(', ') || 'Technical skills'),
    'Interests: ' + ((profile.interests || []).join(', ') || 'N/A'),
  ];

  if (!apiKey || !ai) {
    const { draftMotivationLetter } = await import('./ai-assistant');
    return draftMotivationLetter(profile, opportunity);
  }

  const prompt = [
    'You are NEXTPATH Application Assistant. Draft a compelling motivation letter strictly grounded in this student profile.',
    'RULES: Zero hallucinations of unearned degrees or fake companies.',
    'STUDENT: ' + JSON.stringify(profile),
    'OPPORTUNITY: ' + JSON.stringify(opportunity),
  ].join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawText = response.text || '';
    const subjectMatch = rawText.match(/Subject:\s*(.*)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Application for ' + opportunity.title + ' — ' + profile.fullName;
    const letter = rawText.replace(/Subject:.*\n*/i, '').trim();

    return {
      subject,
      letter,
      groundedFactsUsed,
    };
  } catch (error) {
    const { draftMotivationLetter } = await import('./ai-assistant');
    return draftMotivationLetter(profile, opportunity);
  }
}
;

fs.writeFileSync('src/gemini-client.ts', geminiCode, 'utf8');
console.log('Created src/gemini-client.ts successfully');
