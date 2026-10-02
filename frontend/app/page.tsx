"use client";

import { useEffect, useRef, useState } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import LeadQualifierForm from "../components/LeadQualifierForm";
import QualificationResultPanel from "../components/QualificationResult";
import type { LeadPayload, QualificationResult } from "@/lib/types";

type AppState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "polling"; runId: string; token: string; payload: LeadPayload }
  | { phase: "error"; message: string }
  | { phase: "limit_reached" };

const ACTIVE_STATUSES = new Set(["QUEUED", "EXECUTING", "REATTEMPTING", "WAITING_FOR_DEPLOY"]);
const DONE_STATUSES = new Set(["COMPLETED", "FAILED", "CRASHED", "CANCELED", "SYSTEM_FAILURE"]);

export default function Page() {
  const [state, setState] = useState<AppState>({ phase: "idle" });

  async function handleSubmit(payload: LeadPayload) {
    setState({ phase: "submitting" });
    try {
      const res = await fetch("/api/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { runId?: string; publicAccessToken?: string; error?: string };
      if (res.status === 403 && data.error === "limit_reached") {
        setState({ phase: "limit_reached" });
        return;
      }
      if (!res.ok || !data.runId || !data.publicAccessToken) {
        setState({ phase: "error", message: data.error ?? "Unexpected error — check the console." });
        return;
      }
      setState({ phase: "polling", runId: data.runId, token: data.publicAccessToken, payload });
    } catch {
      setState({ phase: "error", message: "Network error — check your connection." });
    }
  }

  function reset() {
    setState({ phase: "idle" });
  }

  const isPolling = state.phase === "polling";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main split layout */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* Left: form */}
          <section>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-ink tracking-tight">Qualify a lead</h1>
              <p className="mt-1 text-sm text-ink-2">
                Enter what you know. The AI scores against 5 criteria and recommends next steps.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <LeadQualifierForm
                onSubmit={handleSubmit}
                disabled={state.phase === "submitting" || state.phase === "polling"}
              />
            </div>
          </section>

          {/* Right: result panel */}
          <section className="lg:pt-[88px]">
            <ResultPanel
              appState={state}
              onReset={reset}
              isPolling={isPolling}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

/* ─── Result panel — uses the realtime hook ─── */

interface ResultPanelProps {
  appState: AppState;
  onReset: () => void;
  isPolling: boolean;
}

function ResultPanel({ appState, onReset }: ResultPanelProps) {
  const runId = appState.phase === "polling" ? appState.runId : undefined;
  const token = appState.phase === "polling" ? appState.token : undefined;

  const { run } = useRealtimeRun(runId, {
    accessToken: token ?? "",
    enabled: !!runId && !!token,
  });

  /* Derive what to show */
  const isLoading =
    appState.phase === "submitting" ||
    (appState.phase === "polling" && (!run || ACTIVE_STATUSES.has(run.status)));

  const isCompleted = run?.status === "COMPLETED";
  const isFailed = run && DONE_STATUSES.has(run.status) && run.status !== "COMPLETED";
  const result = isCompleted ? (run.output as QualificationResult) : null;

  // Save completed result to Supabase — fire-and-forget, one attempt per run
  const savedRef = useRef(false);
  useEffect(() => {
    if (!isCompleted || !result || savedRef.current) return;
    if (appState.phase !== "polling") return;
    savedRef.current = true;

    const { runId: completedRunId, payload } = appState;
    void fetch("/api/qualify/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: completedRunId, payload, result }),
    }).catch((err) => {
      console.error("[qualify/save] Failed to save result:", err);
    });
  }, [isCompleted, result, appState]);

  /* States */
  if (appState.phase === "limit_reached") {
    return <LimitReachedState onReset={onReset} />;
  }

  if (appState.phase === "idle") {
    return <EmptyState />;
  }

  if (isLoading) {
    return <LoadingState status={run?.status} />;
  }

  if (isFailed) {
    return (
      <ErrorState
        message={`Run ${run!.status.toLowerCase()}. Check the Trigger.dev dashboard for details.`}
        onReset={onReset}
      />
    );
  }

  if (appState.phase === "error") {
    return <ErrorState message={appState.message} onReset={onReset} />;
  }

  if (result) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <QualificationResultPanel result={result} />
        <div className="mt-6 pt-5 border-t border-border">
          <button
            onClick={onReset}
            className="text-xs font-medium text-ink-3 hover:text-ink-2 transition-colors"
          >
            ← Qualify another lead
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-2 p-8 flex flex-col items-center justify-center text-center min-h-64">
      <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center mb-4">
        <svg className="w-5 h-5 text-ink-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M9 12l-1.5-1.5L9 9l1.5 1.5L9 12zm7-7H4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2z" opacity=".3"/>
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 2a1 1 0 000 2h10a1 1 0 100-2H5zm0 4a1 1 0 000 2h6a1 1 0 100-2H5zm0 4a1 1 0 100 2h4a1 1 0 100-2H5z" clipRule="evenodd"/>
        </svg>
      </div>
      <p className="text-sm text-ink-2 font-medium">Qualification report</p>
      <p className="text-xs text-ink-3 mt-1">
        Fill in the lead details and click<br/>
        <span className="font-medium">Analyze lead</span> to see the AI report.
      </p>
    </div>
  );
}

function LoadingState({ status }: { status?: string }) {
  const label =
    status === "QUEUED" ? "Queued — waiting for worker…"
    : status === "EXECUTING" ? "Analyzing with Claude…"
    : "Starting analysis…";

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-2 w-2 rounded-full bg-violet animate-pulse" />
        <span className="text-xs font-medium text-ink-2">{label}</span>
      </div>
      {/* Score placeholder */}
      <div className="pb-5 border-b border-border">
        <div className="h-3 w-12 rounded bg-border animate-pulse mb-3" />
        <div className="h-24 w-20 rounded-lg bg-border animate-pulse" />
      </div>
      {/* Text placeholders */}
      <div className="space-y-2">
        <div className="h-3 rounded bg-border animate-pulse w-full" />
        <div className="h-3 rounded bg-border animate-pulse w-5/6" />
        <div className="h-3 rounded bg-border animate-pulse w-4/6" />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <div className="h-2 w-16 rounded bg-border animate-pulse" />
          <div className="h-3 rounded bg-border animate-pulse" />
          <div className="h-3 rounded bg-border animate-pulse w-4/5" />
          <div className="h-3 rounded bg-border animate-pulse w-3/5" />
        </div>
        <div className="space-y-2">
          <div className="h-2 w-16 rounded bg-border animate-pulse" />
          <div className="h-3 rounded bg-border animate-pulse" />
          <div className="h-3 rounded bg-border animate-pulse w-4/5" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <p className="text-sm font-semibold text-red-700 mb-1">Analysis failed</p>
      <p className="text-sm text-red-600">{message}</p>
      <button
        onClick={onReset}
        className="mt-4 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
      >
        ← Try again
      </button>
    </div>
  );
}

function LimitReachedState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-xl border border-violet/30 bg-violet/5 p-6 shadow-sm">
      <p className="text-sm font-semibold text-violet mb-1">Daily limit reached</p>
      <p className="text-sm text-ink-2 mb-4">
        Free accounts can qualify 2 leads per day. Upgrade to Pro for unlimited qualifications.
      </p>
      <div className="flex items-center gap-3">
        <a
          href="/pricing"
          className="inline-flex items-center px-4 py-2 rounded-md bg-violet text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Upgrade to Pro — $29/mo
        </a>
        <button
          onClick={onReset}
          className="text-xs font-medium text-ink-3 hover:text-ink-2 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
