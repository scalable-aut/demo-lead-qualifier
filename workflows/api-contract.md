# API Contract — Frontend ↔ Backend

This file documents the API surface between the Next.js frontend and the Trigger.dev backend.
Both sides must conform to this contract. Update this file before changing either side.

---

## Endpoints

### POST /api/qualify

Triggers the `qualify-lead` Trigger.dev task and returns a run handle for the frontend to subscribe to.

**Called by:** `LeadQualifierForm.tsx` on form submit

**Auth:** None required from client — the API route uses the server-side `TRIGGER_SECRET_KEY`

#### Request

```
POST /api/qualify
Content-Type: application/json
```

**Body** — `LeadPayload`:

```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "company": "string (required)",
  "industry": "string (required)",
  "companySize": "\"1-10\" | \"11-50\" | \"51-200\" | \"201-1000\" | \"1000+\" (required)",
  "role": "string (required)",
  "useCase": "string (required, min 10 chars)",
  "budget": "\"Under $1k\" | \"$1k–$5k\" | \"$5k–$20k\" | \"$20k+\" (optional)",
  "timeline": "\"Immediate\" | \"1-3 months\" | \"3-6 months\" | \"6+ months\" (optional)",
  "source": "string (optional)"
}
```

#### Success Response — `200 OK`

```json
{
  "runId": "run_abc123xyz",
  "publicAccessToken": "eyJ..."
}
```

| Field | Type | Notes |
|-------|------|-------|
| `runId` | string | Trigger.dev run ID — use with `useRealtimeRun` |
| `publicAccessToken` | string | Short-lived JWT (15 min), scoped to this `runId` only |

#### Error Responses

| Status | Cause | Body |
|--------|-------|------|
| `400` | Missing required field | `{ "error": "Missing required field: useCase" }` |
| `500` | Trigger.dev API unreachable | `{ "error": "Failed to trigger task" }` |

---

## Run Status Lifecycle

After the API route returns, the frontend subscribes to the run via `useRealtimeRun`.
Status transitions in order:

```
QUEUED → EXECUTING → COMPLETED
                  ↘ FAILED
                  ↘ CRASHED
                  ↘ CANCELED
```

| Status | Frontend action |
|--------|----------------|
| `QUEUED` | Show "Analyzing..." spinner |
| `EXECUTING` | Show "Analyzing..." spinner |
| `COMPLETED` | Read `run.output` → render `QualificationResult` |
| `FAILED` | Show error message — check `run.error.message` |
| `CRASHED` | Show generic error: "Something went wrong. Please try again." |
| `CANCELED` | Show: "Analysis was canceled." |

---

## Run Output Shape

When `run.status === "COMPLETED"`, `run.output` is a `QualificationResult`:

```typescript
interface QualificationResult {
  score: number;             // 0–100 integer
  tier: "hot" | "warm" | "cold" | "disqualified";
  summary: string;           // 2–3 sentences
  strengths: string[];       // 2–4 items
  concerns: string[];        // 0–3 items
  recommendedAction: string; // One imperative sentence
  reasoning: string;         // Step-by-step scoring breakdown
}
```

The `QualificationResult` type is defined in `trigger/types.ts`.
Import it in the frontend via relative path — do not redefine it.

---

## React Hook Usage

```typescript
// frontend/app/components/LeadQualifierForm.tsx
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { qualifyLeadTask } from "../../../trigger/tasks/qualify-lead";

// After POST /api/qualify returns { runId, publicAccessToken }:
const { run, error } = useRealtimeRun<typeof qualifyLeadTask>(runId, {
  accessToken: publicAccessToken,
  enabled: !!runId, // only subscribe when we have a runId
});

// Derived state:
const isLoading = run?.status === "QUEUED" || run?.status === "EXECUTING";
const result = run?.status === "COMPLETED" ? run.output : null;
const failed = run?.status === "FAILED" || run?.status === "CRASHED";
```

---

## Versioning

- If `LeadPayload` gains a new required field, update both this contract and the form in the same PR.
- If `QualificationResult` changes shape, update `trigger/types.ts`, the task, and `QualificationResult.tsx` in the same PR.
- The `qualify-lead` task ID is treated as a stable API name — do not rename it without updating all callers.
