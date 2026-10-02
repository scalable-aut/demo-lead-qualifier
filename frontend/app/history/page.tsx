import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "History — Lead Qualifier",
};

interface QualificationRow {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  company: string;
  score: number;
  tier: "hot" | "warm" | "cold" | "disqualified";
  summary: string;
  recommended_action: string;
}

const TIER_COLORS: Record<
  QualificationRow["tier"],
  { bg: string; text: string; border: string }
> = {
  hot:          { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  warm:         { bg: "#F0F9FF", text: "#0284C7", border: "#BAE6FD" },
  cold:         { bg: "#F4F4F5", text: "#52525B", border: "#D4D4D8" },
  disqualified: { bg: "#FAFAFA", text: "#71717A", border: "#E4E4E7" },
};

export default async function HistoryPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rows, error } = await supabase
    .from("qualifications")
    .select(
      "id, created_at, first_name, last_name, company, score, tier, summary, recommended_action"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[history] Supabase query error:", error);
  }

  const qualifications = (rows ?? []) as QualificationRow[];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">
            Qualification history
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            {qualifications.length === 0
              ? "No leads qualified yet."
              : `${qualifications.length} lead${qualifications.length === 1 ? "" : "s"} qualified`}
          </p>
        </div>
        <Link
          href="/"
          className="text-xs font-medium text-violet hover:opacity-80 transition-opacity"
        >
          Qualify a new lead →
        </Link>
      </div>

      {qualifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {qualifications.map((row) => (
            <QualificationCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </main>
  );
}

function QualificationCard({ row }: { row: QualificationRow }) {
  const tierMeta = TIER_COLORS[row.tier];
  const date = new Date(row.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Score bubble */}
        <div className="flex-shrink-0 w-14 text-center">
          <span
            className="block text-3xl font-extrabold leading-none tracking-tight"
            style={{ color: tierMeta.text }}
          >
            {row.score}
          </span>
          <span className="text-[10px] text-ink-3">/ 100</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-ink">
              {row.first_name} {row.last_name}
            </span>
            <span className="text-xs text-ink-3">{row.company}</span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border"
              style={{
                backgroundColor: tierMeta.bg,
                color: tierMeta.text,
                borderColor: tierMeta.border,
              }}
            >
              {row.tier.charAt(0).toUpperCase() + row.tier.slice(1)}
            </span>
          </div>
          <p className="text-xs text-ink-2 line-clamp-2">{row.summary}</p>
          <p className="mt-1.5 text-xs font-medium text-ink-2">
            {row.recommended_action}
          </p>
        </div>

        {/* Date */}
        <time
          className="flex-shrink-0 text-xs text-ink-3 mt-0.5"
          dateTime={row.created_at}
        >
          {date}
        </time>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-12 flex flex-col items-center text-center">
      <p className="text-sm font-medium text-ink-2 mb-1">
        No qualification history yet
      </p>
      <p className="text-xs text-ink-3 mb-4">
        Qualified leads will appear here after you run your first analysis.
      </p>
      <Link
        href="/"
        className="text-xs font-semibold text-white bg-violet hover:opacity-90 px-4 py-2 rounded-md transition-opacity"
      >
        Qualify your first lead
      </Link>
    </div>
  );
}
