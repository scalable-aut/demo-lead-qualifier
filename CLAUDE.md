# CLAUDE.md — AI Lead Qualifier (Fullstack)

This file is the primary guide for Claude Code when building and modifying this project.
Read it completely before generating or editing any code.

---

## Project Overview

A fullstack AI lead qualification tool. A user fills in a form about a prospective lead,
clicks "Analyze", and receives an AI-generated qualification report — score, tier, reasoning,
and recommended next action — within seconds.

**User flow:**
1. User submits the lead form on the Next.js frontend
2. Frontend calls a Next.js API route (`POST /api/qualify`)
3. API route triggers the `qualify-lead` Trigger.dev task and returns a `runId` + `publicAccessToken`
4. Frontend uses `@trigger.dev/react-hooks` to subscribe to real-time run status
5. When the run completes, the `QualificationResult` is displayed in the UI

---

## WAT Framework

This project is structured using the WAT framework — a scaffold for Claude Code to navigate AI-powered builds.

| Letter | Meaning | Location | Role |
|--------|---------|----------|------|
| **W** | Workflows | `workflows/` | Specs, prompts, and API contracts. **Read these first** before touching code. |
| **A** | Agent | — | Claude Code itself. No folder. You are the agent. |
| **T** | Tools | `tools/` | CLI scripts for testing tasks and the API in isolation. Run these to verify behavior. |

**Rule:** Before writing any task or frontend code, read the relevant file in `workflows/`.
It defines the contract. Code must match the spec, not the other way around.

---

## Folder Structure

```
Demo Lead Qualifier-Fullstack/
├── CLAUDE.md                          # This file
├── .env.example                       # Env var template (never commit .env)
├── .gitignore
│
├── workflows/                         # W: specs, prompts, contracts
│   ├── lead-qualifier.md              # Input fields, scoring logic, output schema
│   ├── prompt-qualify-lead.md         # Exact Claude system + user prompt
│   └── api-contract.md               # Frontend ↔ backend API shape
│
├── tools/                             # T: testing and utility scripts
│   ├── test-trigger-task.ts           # Trigger qualify-lead from CLI, prints result
│   ├── test-anthropic.ts              # Test the Claude API call in isolation
│   └── seed-form-payload.json         # Sample lead payload for testing
│
├── trigger/                           # Trigger.dev backend tasks
│   ├── trigger.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── types.ts                       # Shared: LeadPayload, QualificationResult
│   └── tasks/
│       └── qualify-lead.ts            # Main qualification task
│
└── frontend/                          # Next.js app (deployed to Vercel)
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── api/
    │   │   └── qualify/
    │   │       └── route.ts           # POST — triggers task, returns runId + token
    │   └── components/
    │       ├── LeadQualifierForm.tsx
    │       └── QualificationResult.tsx
    └── lib/
        └── triggerClient.ts           # Server-side Trigger.dev client init
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14+ (App Router) | Deployed to Vercel via GitHub |
| Backend tasks | Trigger.dev v3 (TypeScript) | Deployed via `npx trigger.dev@latest deploy` |
| AI | Claude via `@anthropic-ai/sdk` | Called inside the Trigger.dev task only — never from frontend |
| Realtime | `@trigger.dev/react-hooks` | `useRealtimeTaskTrigger` for live status updates |
| Language | TypeScript throughout | Strict mode. No `any`. |

---

## Lead Qualifier — Input Fields

The form collects the following fields. All are strings unless noted.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `firstName` | string | yes | Lead's first name |
| `lastName` | string | yes | Lead's last name |
| `company` | string | yes | Company name |
| `industry` | string | yes | e.g. "SaaS", "E-commerce", "Healthcare" |
| `companySize` | enum | yes | `"1-10"` \| `"11-50"` \| `"51-200"` \| `"201-1000"` \| `"1000+"` |
| `role` | string | yes | Their job title |
| `useCase` | string | yes | Free text — what they want to achieve |
| `budget` | enum | no | `"Under $1k"` \| `"$1k–$5k"` \| `"$5k–$20k"` \| `"$20k+"` |
| `timeline` | enum | no | `"Immediate"` \| `"1-3 months"` \| `"3-6 months"` \| `"6+ months"` |
| `source` | string | no | How they heard about you |

**Shared TypeScript type** (defined in `trigger/types.ts`, imported everywhere):

```typescript
export interface LeadPayload {
  firstName: string;
  lastName: string;
  company: string;
  industry: string;
  companySize: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";
  role: string;
  useCase: string;
  budget?: "Under $1k" | "$1k–$5k" | "$5k–$20k" | "$20k+";
  timeline?: "Immediate" | "1-3 months" | "3-6 months" | "6+ months";
  source?: string;
}
```

---

## Lead Qualifier — AI Output Schema

Claude returns a structured JSON object. The task parses and returns it as the run output.
See `workflows/lead-qualifier.md` for the full scoring rubric.

```typescript
export interface QualificationResult {
  score: number;             // 0–100 numeric score
  tier: "hot" | "warm" | "cold" | "disqualified";
  summary: string;           // 2-3 sentence human-readable summary
  strengths: string[];       // Positive signals identified
  concerns: string[];        // Risk factors or gaps
  recommendedAction: string; // e.g. "Book discovery call immediately"
  reasoning: string;         // Step-by-step scoring rationale
}
```

**Tier thresholds:**
- 80–100 → `hot`
- 60–79 → `warm`
- 40–59 → `cold`
- 0–39 → `disqualified`

---

## Frontend ↔ Backend Communication Pattern

The frontend **never** calls the Trigger.dev API directly with a secret key.
The pattern is: form → Next.js API route (server) → Trigger.dev SDK → realtime React hook.

### Step 1 — Next.js API Route triggers the task

```typescript
// frontend/app/api/qualify/route.ts
import { tasks, auth } from "@trigger.dev/sdk/v3";
import type { qualifyLeadTask } from "../../../trigger/tasks/qualify-lead";
import type { LeadPayload } from "../../../trigger/types";

export async function POST(req: Request) {
  const payload: LeadPayload = await req.json();

  const handle = await tasks.trigger<typeof qualifyLeadTask>(
    "qualify-lead",
    payload
  );

  const publicToken = await auth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
    expirationTime: "15m",
  });

  return Response.json({ runId: handle.id, publicAccessToken: publicToken });
}
```

### Step 2 — Frontend subscribes with React hook

```typescript
// After POST /api/qualify returns { runId, publicAccessToken }:
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { qualifyLeadTask } from "../../trigger/tasks/qualify-lead";

const { run } = useRealtimeRun<typeof qualifyLeadTask>(runId, {
  accessToken: publicAccessToken,
});

// run.status progresses: QUEUED → EXECUTING → COMPLETED
// run.output is QualificationResult when status === "COMPLETED"
```

---

## Trigger.dev Task Structure

Tasks live in `trigger/tasks/`. Each file exports one task.

```typescript
// trigger/tasks/qualify-lead.ts
import { task } from "@trigger.dev/sdk/v3";
import Anthropic from "@anthropic-ai/sdk";
import type { LeadPayload, QualificationResult } from "../types";

export const qualifyLeadTask = task({
  id: "qualify-lead",
  maxDuration: 60,
  run: async (payload: LeadPayload): Promise<QualificationResult> => {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: buildPrompt(payload) }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    // Strip markdown fences before parsing — Claude sometimes wraps JSON in ```json
    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const result: QualificationResult = JSON.parse(cleaned);
    return result;
  },
});
```

Key rules:
- `id` must exactly match the string used in `tasks.trigger("qualify-lead", ...)` on the frontend
- Return value must be JSON-serializable — it becomes `run.output` in the frontend
- Never import from `frontend/` inside a task file
- Always set `maxDuration` to prevent runaway costs on hung API calls

---

## trigger/trigger.config.ts

```typescript
import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_YOUR_PROJECT_REF", // From Trigger.dev dashboard → Project Settings
  dirs: ["./tasks"],
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },
});
```

---

## Development Commands

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000

npm run build        # Production build check before Vercel deploy
npm run lint
```

### Trigger.dev Backend

```bash
cd trigger
npm install

# Start local dev worker (watches tasks/, hot reload)
npx trigger.dev@latest dev

# Deploy to Trigger.dev cloud
npx trigger.dev@latest deploy
```

### Tools (Testing)

```bash
# From project root — requires trigger/ deps installed
cd trigger && npm install && cd ..

# Test only the Anthropic API call (fast, no Trigger.dev needed)
npx ts-node --project trigger/tsconfig.json tools/test-anthropic.ts

# Test the full task pipeline end-to-end
npx ts-node --project trigger/tsconfig.json tools/test-trigger-task.ts
```

---

## Environment Variables

### trigger/.env

```
ANTHROPIC_API_KEY=sk-ant-...
TRIGGER_SECRET_KEY=tr_dev_sk_...    # From Trigger.dev dashboard → API Keys
```

### frontend/.env.local

```
TRIGGER_SECRET_KEY=tr_dev_sk_...    # Same key — server-side only (API routes)
```

**Never** expose `TRIGGER_SECRET_KEY` in client-side code. It must only appear in
`app/api/` routes or Server Actions — never in React components.

Vercel environment variables are set in the Vercel dashboard under
**Settings → Environment Variables**.

---

## TypeScript Conventions

- Strict mode enabled in all `tsconfig.json` files
- No `any` — use `unknown` and narrow with type guards
- **Shared types** (`LeadPayload`, `QualificationResult`) live in `trigger/types.ts`
  and are imported by relative path into both the task and the Next.js API route
- All async functions must have explicit return types
- Prefer `const` over `let`; never use `var`
- File names: `kebab-case.ts` for tasks/utilities, `PascalCase.tsx` for React components

---

## Vercel Deployment

The `frontend/` directory is the Vercel root. Configure in the Vercel dashboard:

| Setting | Value |
|---------|-------|
| Framework preset | Next.js |
| Root directory | `frontend` |
| Build command | `npm run build` (default) |
| Environment variables | Add `TRIGGER_SECRET_KEY` |

GitHub integration: push to `main` triggers a Vercel deploy automatically.
The Trigger.dev backend deploys **independently** via `npx trigger.dev@latest deploy` from `trigger/`.

---

## Run Status Values

| Status | Meaning |
|--------|---------|
| `QUEUED` | Task is waiting for a worker |
| `EXECUTING` | Task is actively running |
| `COMPLETED` | Task finished — `output` is populated |
| `FAILED` | Task threw an error — check `error` field |
| `CANCELED` | Manually canceled |
| `CRASHED` | Worker crashed unexpectedly |

Only act on `run.output` when `run.status === "COMPLETED"`.

---

## Key Constraints and Gotchas

1. **Secret key in client bundle** — `TRIGGER_SECRET_KEY` must never reach the browser.
   Only use it in `app/api/` routes or Server Actions.

2. **JSON.parse on Claude output** — Claude sometimes wraps JSON in markdown fences
   (` ```json `). Always strip fences before parsing. See the task template above.

3. **Task ID must match** — The string `"qualify-lead"` in `trigger.config.ts`, in
   `tasks.trigger("qualify-lead", ...)`, and in `task({ id: "qualify-lead" })` must
   all be identical.

4. **`trigger.config.ts` project ref** — Replace `proj_YOUR_PROJECT_REF` with the
   actual ref from Trigger.dev dashboard → Project Settings.

5. **Type sharing via relative path** — `trigger/types.ts` is imported from both the
   task (`../types`) and the Next.js API route (`../../../trigger/types`). Do not
   duplicate the type definitions.

6. **`useRealtimeRun` requires `publicAccessToken`** — Create this short-lived token
   server-side (in the API route) with `auth.createPublicToken()`. It expires in 15
   minutes, which is sufficient for any qualification run.

7. **`output` field** — When using a Public API key for REST polling, the `output`
   field is omitted. Use `@trigger.dev/react-hooks` or a Secret key server-side
   if you need the output payload.
