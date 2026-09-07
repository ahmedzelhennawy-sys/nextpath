<div align="center">

# 🧭 NEXTPATH
### Opportunity-Intelligence & Application-Readiness Platform
**IMPACT 2026 Hackathon**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>Turning <i>"I don't know what's out there"</i> into <i>"I know exactly what I should apply for next."</i></b>
</p>

[Key Features](#-key-features) •
[The Golden Rule](#-the-golden-rule) •
[Architecture](#-system-architecture) •
[Quickstart](#-quickstart--demo) •
[Team & Contributors](#-team--contributors)

---

</div>

## 📌 Problem & Insight
Students today don't lack opportunities — **they lack opportunity intelligence**.
1. **Discovery Gap**: Opportunities are scattered across Telegram channels, Facebook groups, and university portals.
2. **Eligibility Gap**: Students waste hours applying for programs they were never qualified for.
3. **Action Gap**: Drafting repetitive motivation letters and tracking uncoordinated deadlines from scratch.

**NEXTPATH fixes this** with a verified opportunity repository, a mathematical rule-based eligibility engine, and an AI-assisted application copilot.

---

## ⚖️ The Golden Rule
> ### 🛑 AI does NOT decide eligibility.
> 
> Eligibility comes strictly from a **deterministic rule-based engine** that compares structured, verified requirements against the student's profile facts.
> 
> **The Database + Rules are the source of truth. AI is the interpretation layer.**  
> This protects students against AI hallucinations and ensures 100% reliable eligibility verdicts.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph UI ["🎨 1. Presentation Layer (Next.js)"]
        DASH["Student Dashboard"]
        SEARCH_BAR["AI Conversational Search"]
        OPP_DETAIL["Opportunity View ('Why Not?' & Match Breakdowns)"]
        ASSISTANT_MODAL["Motivation Letter Drafter"]
    end

    subgraph BACKEND ["⚙️ 2. API & Server Layer"]
        API_SEARCH["/api/search/ai"]
        API_ELIG["/api/opportunities/:id/eligibility"]
        API_MATCH["/api/opportunities/matches"]
        API_ASSIST["/api/assistant/draft-letter"]
    end

    subgraph ENGINES ["⭐ 3. Core Logic & AI Layer"]
        NL_PARSER["AI Query Parser (Gemini / Heuristic)"]
        RULE_ENGINE["Deterministic Eligibility Evaluator"]
        MATCH_ENGINE["Match Scorer & Gap Analyzer"]
        LETTER_AI["Grounded Letter Drafter (Zero Hallucination)"]
    end

    subgraph DB ["🗄️ 4. Supabase / PostgreSQL Database"]
        PROFILES[("Profiles & Academics")]
        OPPORTUNITIES[("15+ Verified Opportunities")]
        RULES[("Machine-Checkable Requirements")]
        VECTORS[("pgvector Embeddings (768-dim)")]
        RLS[("Row-Level Security Policies")]
    end

    UI --> BACKEND
    BACKEND --> ENGINES
    ENGINES --> DB
```

---

## 🌟 Key Features

| Feature | Description |
| :--- | :--- |
| **🟢 4-State Verdict Engine** | Instant evaluation: `Eligible` \| `Likely Eligible` \| `Unknown` \| `Not Eligible`. |
| **🔍 "Why Not?" Breakdown** | Pinpoints the exact requirement failed (*"Requires minimum GPA 3.2; your GPA is 2.9"*). |
| **📊 Match Score (0–100%)** | Multi-factor weighted score across Academics, Skills, Interests, and Language tests. |
| **🚀 Profile Gap Analysis** | Proactively suggests what is missing (*"You are close to 14 more opportunities. Missing: IELTS 6.5"*). |
| **💬 Natural-Language Search** | Conversational AI translates prompts into precise SQL filters + semantic embeddings. |
| **✍️ Grounded Application Drafter** | Generates tailored motivation letters strictly grounded in verified profile data. |

---

## 📂 Repository Structure

```text
NEXTPATH/
├── schema.sql                   # Supabase database schema (Tables, RLS, Indexes, Triggers)
├── seed-expanded.sql            # 15+ verified global & regional opportunities + rules
├── .env.example                 # Environment variables template
├── package.json                 # Project manifest & dependencies
├── tsconfig.json                # TypeScript configuration
├── LICENSE                      # MIT Open Source License
└── src/
    ├── types.ts                 # Canonical TypeScript contracts for Frontend & Backend
    ├── eligibility-engine.ts    # Deterministic Rule Engine (The Golden Rule)
    ├── match-engine.ts          # Match Scoring (0-100%) & Profile Gap Analysis
    ├── ai-search.ts             # Conversational Natural-Language Query Parser
    ├── ai-assistant.ts          # Grounded Motivation Letter Generator
    ├── gemini-client.ts         # Google Gemini 2.5 Flash & text-embedding-004 client
    └── demo.ts                  # End-to-end verification demo & test suite
```

---

## 🚀 Quickstart & Demo

### 1. Installation
```bash
git clone https://github.com/ahmedzelhennawy-sys/nextpath.git
cd nextpath
npm install
```

### 2. Configure Environment (Optional for Live Gemini API)
```bash
cp .env.example .env.local
# Add your GEMINI_API_KEY and SUPABASE keys
```

### 3. Run the Live Test Suite
```bash
npx tsx src/demo.ts
```

---

## 👥 Team & Contributors

NEXTPATH is built by a dedicated 4-person multidisciplinary engineering team for **IMPACT 2026**:

| Member | Role | Core Responsibilities |
| :--- | :--- | :--- |
| **Ahmed Elhennawy** | **AI & Database Lead** | Supabase database schema, RLS policies, deterministic rule engine, Gemini AI pipeline, vector search embeddings, motivation letter generator. |
| **Team Member 2** | **Frontend & UI/UX Lead** | Next.js client application, responsive dashboard, opportunity discovery feed, eligibility verdict badges, interactive modals. |
| **Team Member 3** | **Backend Engineer** | REST API routing, authentication middleware, opportunity indexing & search endpoints. |
| **Team Member 4** | **Backend Engineer** | Application tracker service, document management, notification & deadline reminder pipeline. |

---

<div align="center">
  <sub>Built with ❤️ by the NEXTPATH Team for the IMPACT 2026 Hackathon.</sub>
</div>
