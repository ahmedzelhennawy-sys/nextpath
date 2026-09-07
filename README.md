# NEXTPATH — Opportunity Intelligence & Application Readiness Platform
> **IMPACT 2026 Hackathon** | AI & Database Core Engine

---

## 🌟 What is NEXTPATH?
NEXTPATH turns *"I don't know what's out there"* into *"I know exactly what I should apply for next"*.

### ⚖️ The Golden Rule:
> **AI does NOT decide eligibility.**  
> Eligibility is calculated deterministically by our rule-based engine comparing official requirements with the student's profile.  
> **AI is the intelligence layer** for natural-language search, explanation, and motivation letter drafting.

---

## 📂 Project Structure

```text
NEXTPATH/
├── schema.sql                   # Complete PostgreSQL / Supabase schema with RLS & Triggers
├── seed-expanded.sql            # 15+ Verified real opportunities with structured rules
├── package.json                 # Dependencies (@google/genai, @supabase/supabase-js)
├── tsconfig.json                # TypeScript configuration
└── src/
    ├── types.ts                 # Shared TypeScript models for Frontend & Backend
    ├── eligibility-engine.ts    # Deterministic Rule Engine (4-state verdicts + "Why not?")
    ├── match-engine.ts          # Match Scoring (0-100%) & Profile Gap Analysis
    ├── ai-search.ts             # Conversational Natural Language Query Parser
    ├── ai-assistant.ts          # Grounded Motivation Letter Generator (Zero Hallucination)
    ├── gemini-client.ts         # Google Gemini 2.5 Flash & Vector Embeddings client
    └── demo.ts                  # End-to-End Demo & Test Runner
```

---

## 🚀 Quickstart & Demo

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the Live Demo:**
   ```bash
   npx tsx src/demo.ts
   ```

---

## 👥 Team Integration Guide

### 🎨 Frontend Developer
- Use `src/types.ts` for all UI state management (`EligibilityVerdict`, `MatchScoreResult`, `ParsedSearchQuery`).
- Implement the 4-state badge: `ELIGIBLE`, `LIKELY ELIGIBLE`, `UNKNOWN`, `NOT ELIGIBLE`.
- Display the `"Why not?"` list from `verdict.whyNot` and `"Why this match?"` from `match.whyThisMatch`.

### ⚙️ Backend Developers
- Connect to Supabase using `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- Wrap the pure functions from `src/eligibility-engine.ts`, `src/match-engine.ts`, and `src/gemini-client.ts` in your API route handlers (`/api/search/ai`, `/api/match`, `/api/draft-letter`).
