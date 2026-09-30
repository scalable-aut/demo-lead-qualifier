# Deployment Guide — Trigger.dev Backend

Follow these steps in order. Each step depends on the previous one.

---

## Step 1 — Create a Trigger.dev Account and Project

1. Go to **https://cloud.trigger.dev** and sign up or log in.
2. Click **"Create new project"**.
3. Name it `lead-qualifier` (cosmetic — any name works).
4. Select the region closest to your Vercel deployment (US East recommended).
5. You land on the project dashboard. Keep this tab open.

---

## Step 2 — Get Your Project Ref

1. In the left sidebar click **"Project Settings"**.
2. Copy the **"Project ref"** — looks like `proj_abcdef12345678`.
3. Paste it somewhere handy — you need it in Step 5.

---

## Step 3 — Create an API Key

1. In the left sidebar click **"API Keys"**.
2. Click **"Create new API key"**.
3. Set:
   - **Environment:** Dev (for local development)
   - **Name:** `local-dev`
4. Copy the secret key — looks like `tr_dev_sk_...`.
5. Store it securely — it won't be shown again.

For production (Step 9) you'll create a second key with Environment: Production.

---

## Step 4 — Add Your Anthropic API Key

Get your Anthropic API key from **https://console.anthropic.com/settings/api-keys**.

If you don't have one:
1. Sign up at https://console.anthropic.com
2. Go to Settings → API Keys → Create key
3. Copy the key — looks like `sk-ant-api03-...`

---

## Step 5 — Fill in `trigger/.env`

Open [trigger/.env](./\.env) and replace the placeholder values:

```
ANTHROPIC_API_KEY=sk-ant-api03-<paste your Anthropic key>
TRIGGER_SECRET_KEY=tr_dev_sk_<paste your Trigger.dev dev key>
```

Save the file.

---

## Step 6 — Update `trigger.config.ts` with Your Project Ref

Open [trigger/trigger.config.ts](./trigger.config.ts) and replace the placeholder:

```typescript
// Before:
project: "proj_YOUR_PROJECT_REF",

// After (example):
project: "proj_abcdef12345678",
```

The project ref must match exactly — it links your CLI to the correct cloud project.

---

## Step 7 — Install Dependencies

From the `trigger/` directory:

```bash
cd "c:/Users/khyma/OneDrive/Desktop/n8n downloads/Demo Lead Qualifier-Fullstack/trigger"
npm install
```

This installs `@trigger.dev/sdk`, `@anthropic-ai/sdk`, `dotenv`, and TypeScript tooling.

---

## Step 8 — Start the Local Dev Worker

```bash
npm run dev
# or: npx trigger.dev@latest dev
```

What you should see:
```
Trigger.dev v3.x.x
Connecting to cloud.trigger.dev...
✓ qualify-lead registered
✓ Worker connected — waiting for runs
```

Leave this terminal running. Every time you edit `tasks/qualify-lead.ts`, the worker
hot-reloads automatically.

If you see an auth error, double-check `TRIGGER_SECRET_KEY` in `trigger/.env`.

---

## Step 9 — Test the Prompt in Isolation

Open a **second terminal**. From the project root:

```bash
npx ts-node --project trigger/tsconfig.json tools/test-anthropic.ts
```

This sends the seed payload directly to the Claude API (no Trigger.dev needed).

Expected output:
```
Sending payload to Claude API...
Lead: Sarah Chen @ Stackline Analytics
---
Raw response from Claude:
{ "score": 84, "tier": "hot", ... }
---
Parsed QualificationResult:
{
  "score": 84,
  "tier": "hot",
  ...
}
---
Score: 84 | Tier: HOT
Action: Book a 30-minute discovery call this week...
```

If this fails with a JSON parse error, check the raw response — Claude may be wrapping the JSON in markdown fences. The regex in the task strips them, but this script also handles it.

---

## Step 10 — Test the Full Pipeline

With the dev worker still running (Step 8):

```bash
npx ts-node --project trigger/tsconfig.json tools/test-trigger-task.ts
```

Expected output:
```
Triggering qualify-lead task...
Lead: Sarah Chen @ Stackline Analytics
---
Run created: run_abc123xyz
Polling for result...
  Status: COMPLETED
Qualification Result:
{ ... }
---
Score: 84 | Tier: HOT
Action: Book a 30-minute discovery call this week...
```

If it sticks at `QUEUED`, the dev worker is not running — go back to Step 8.
If it reaches `FAILED`, check the Trigger.dev dashboard → Runs → click the failed run → View logs.

---

## Step 11 — Set Production Environment Variables

Before deploying, add your secrets to the Trigger.dev cloud:

1. In the dashboard, click **"Environment Variables"** in the left sidebar.
2. Click **"Add variable"**.
3. Add `ANTHROPIC_API_KEY` with your Anthropic key value.
   - Environment: **Production**
4. Save.

The `trigger/.env` file is **not** deployed — it's only for local use.

---

## Step 12 — Deploy to Production

```bash
npx trigger.dev@latest deploy
```

What happens:
- The CLI bundles `tasks/qualify-lead.ts` and uploads it to Trigger.dev cloud.
- The task becomes available in the Production environment.
- Output: `✓ qualify-lead deployed (version x.x.x)`

---

## Step 13 — Verify in the Dashboard

1. In the dashboard, click **"Tasks"** in the left sidebar.
2. `qualify-lead` should be listed with status **Active**.
3. Click on it → click **"Test"**.
4. Paste the contents of `tools/seed-form-payload.json` as the payload.
5. Click **"Run test"**.
6. Watch the run progress: `QUEUED → EXECUTING → COMPLETED`.
7. Click the completed run → inspect the **Output** tab → you should see a `QualificationResult`.

If the run fails, click **"View logs"** for the error message. Common issues:
- `ANTHROPIC_API_KEY is not set` → Environment Variable was not saved (Step 11)
- `Failed to parse Claude response as JSON` → check the raw log for what Claude returned

---

## Summary Cheat Sheet

| Action | Command |
|--------|---------|
| Start local dev worker | `npm run dev` (from `trigger/`) |
| Test Claude API only | `npx ts-node --project trigger/tsconfig.json tools/test-anthropic.ts` |
| Test full pipeline | `npx ts-node --project trigger/tsconfig.json tools/test-trigger-task.ts` |
| Deploy to production | `npx trigger.dev@latest deploy` (from `trigger/`) |
