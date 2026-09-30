"use client";

import type { QualificationResult } from "@/lib/types";

interface Props {
  result: QualificationResult;
}

const TIER_META = {
  hot: {
    label: "Hot",
    scoreColor: "#DC2626",
    badgeBg: "#FEF2F2",
    badgeBorder: "#FECACA",
    badgeText: "#DC2626",
    actionBg: "#FEF2F2",
    actionBorder: "#FCA5A5",
  },
  warm: {
    label: "Warm",
    scoreColor: "#0284C7",
    badgeBg: "#F0F9FF",
    badgeBorder: "#BAE6FD",
    badgeText: "#0284C7",
    actionBg: "#F0F9FF",
    actionBorder: "#7DD3FC",
  },
  cold: {
    label: "Cold",
    scoreColor: "#52525B",
    badgeBg: "#F4F4F5",
    badgeBorder: "#D4D4D8",
    badgeText: "#52525B",
    actionBg: "#F4F4F5",
    actionBorder: "#D4D4D8",
  },
  disqualified: {
    label: "Disqualified",
    scoreColor: "#A1A1AA",
    badgeBg: "#FAFAFA",
    badgeBorder: "#E4E4E7",
    badgeText: "#71717A",
    actionBg: "#FAFAFA",
    actionBorder: "#E4E4E7",
  },
} satisfies Record<QualificationResult["tier"], object>;

export default function QualificationResult({ result }: Props) {
  const meta = TIER_META[result.tier];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Score + Tier */}
      <div className="flex items-end gap-5 pb-5 border-b border-border">
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-ink-3 uppercase mb-1">Score</p>
          <span
            className="block font-extrabold leading-none tracking-tight"
            style={{ fontSize: "6rem", color: meta.scoreColor }}
          >
            {result.score}
          </span>
          <span className="text-xs text-ink-3">/ 100</span>
        </div>
        <div className="mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border"
            style={{
              backgroundColor: meta.badgeBg,
              borderColor: meta.badgeBorder,
              color: meta.badgeText,
            }}
          >
            <span
              className="block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: meta.scoreColor }}
              aria-hidden="true"
            />
            {meta.label}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div>
        <p className="text-sm text-ink leading-relaxed">{result.summary}</p>
      </div>

      {/* Strengths & Concerns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-ink-3 uppercase mb-3">Strengths</p>
          <ul className="space-y-2">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink">
                <svg className="flex-shrink-0 mt-0.5 h-4 w-4 text-emerald-500" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0z"/>
                </svg>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        {result.concerns.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-ink-3 uppercase mb-3">Concerns</p>
            <ul className="space-y-2">
              {result.concerns.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink">
                  <svg className="flex-shrink-0 mt-0.5 h-4 w-4 text-amber-500" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                  </svg>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommended Action */}
      <div
        className="rounded-lg border px-4 py-3"
        style={{
          backgroundColor: meta.actionBg,
          borderColor: meta.actionBorder,
        }}
      >
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-1"
           style={{ color: meta.scoreColor }}>
          Recommended action
        </p>
        <p className="text-sm font-medium text-ink">{result.recommendedAction}</p>
      </div>

      {/* Reasoning — collapsible */}
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink-3 hover:text-ink-2 transition-colors select-none list-none">
          <svg
            className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6 4l5 4-5 4V4z" />
          </svg>
          Scoring breakdown
        </summary>
        <div className="mt-3 pl-5">
          <p className="text-xs text-ink-2 leading-relaxed whitespace-pre-wrap">{result.reasoning}</p>
        </div>
      </details>
    </div>
  );
}
