/**
 * tools/test-trigger-task.ts
 *
 * Triggers the qualify-lead task via the Trigger.dev SDK and polls for the result.
 * Use this to verify the full pipeline end-to-end without opening the browser.
 *
 * Usage:
 *   cd trigger && npm install && cd ..
 *   npx ts-node --project trigger/tsconfig.json tools/test-trigger-task.ts
 *
 * Requires trigger/.env with TRIGGER_SECRET_KEY and ANTHROPIC_API_KEY set.
 * The Trigger.dev dev server must be running: cd trigger && npx trigger.dev@latest dev
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { runs, tasks, configure } from "@trigger.dev/sdk/v3";
import type { LeadPayload, QualificationResult } from "../trigger/types";

// Load env vars from trigger/.env
dotenv.config({ path: path.resolve(__dirname, "../trigger/.env") });

const secretKey = process.env.TRIGGER_SECRET_KEY;
if (!secretKey) {
  console.error("ERROR: TRIGGER_SECRET_KEY is not set in trigger/.env");
  process.exit(1);
}

// Configure the SDK with the secret key
configure({ secretKey });

// Load sample payload
const payloadPath = path.resolve(__dirname, "seed-form-payload.json");
const payload: LeadPayload = JSON.parse(fs.readFileSync(payloadPath, "utf-8"));

const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 120_000; // 2 minutes

async function pollUntilComplete(runId: string): Promise<QualificationResult> {
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT_MS) {
    const run = await runs.retrieve(runId);

    process.stdout.write(`\r  Status: ${run.status.padEnd(12)}`);

    if (run.status === "COMPLETED") {
      console.log(); // newline after status
      return run.output as QualificationResult;
    }

    if (run.status === "FAILED" || run.status === "CRASHED" || run.status === "CANCELED") {
      console.log();
      const errMsg =
        run.status === "FAILED"
          ? (run as { error?: { message?: string } }).error?.message ?? "Unknown error"
          : `Run ended with status: ${run.status}`;
      throw new Error(errMsg);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Timed out after ${MAX_WAIT_MS / 1000}s waiting for run ${runId}`);
}

async function main(): Promise<void> {
  console.log("Triggering qualify-lead task...");
  console.log("Lead:", `${payload.firstName} ${payload.lastName} @ ${payload.company}`);
  console.log("---");

  const handle = await tasks.trigger("qualify-lead", payload);
  console.log(`Run created: ${handle.id}`);
  console.log("Polling for result...");

  const result = await pollUntilComplete(handle.id);

  console.log("\nQualification Result:");
  console.log(JSON.stringify(result, null, 2));
  console.log("---");
  console.log(`Score: ${result.score} | Tier: ${result.tier.toUpperCase()}`);
  console.log(`Action: ${result.recommendedAction}`);
}

main().catch((err) => {
  console.error("\nERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
});
