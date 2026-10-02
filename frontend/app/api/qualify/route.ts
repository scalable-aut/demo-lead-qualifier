import { tasks, auth } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const LeadPayloadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().min(1),
  industry: z.string().min(1),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]),
  role: z.string().min(1),
  useCase: z.string().min(1),
  budget: z.enum(["Under $1k", "$1k–$5k", "$5k–$20k", "$20k+"]).optional(),
  timeline: z.enum(["Immediate", "1-3 months", "3-6 months", "6+ months"]).optional(),
  source: z.string().optional(),
});

export async function POST(req: Request): Promise<Response> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Subscription gating ───────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  const subscriptionStatus = profile?.subscription_status ?? "free";
  const hasPaidAccess = subscriptionStatus === "active" || subscriptionStatus === "past_due";

  if (!hasPaidAccess) {
    const todayMidnightUTC = new Date();
    todayMidnightUTC.setUTCHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from("qualifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayMidnightUTC.toISOString());

    if (!countError && (count ?? 0) >= 2) {
      return Response.json(
        {
          error: "limit_reached",
          message: "Free tier allows 2 qualifications per day. Upgrade for unlimited access.",
        },
        { status: 403 }
      );
    }
  }
  // ── End gating ────────────────────────────────────────────────────────────

  try {
    const body: unknown = await req.json();
    const parsed = LeadPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }
    const payload = parsed.data;

    const handle = await tasks.trigger("qualify-lead", payload);

    const publicToken = await auth.createPublicToken({
      scopes: { read: { runs: [handle.id] } },
      expirationTime: "15m",
    });

    return Response.json({ runId: handle.id, publicAccessToken: publicToken });
  } catch (err) {
    console.error("[qualify] Failed to trigger task:", err);
    return Response.json(
      { error: "Failed to start analysis. Check server logs." },
      { status: 500 }
    );
  }
}
