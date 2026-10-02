import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SaveBodySchema = z.object({
  runId: z.string().min(1),
  payload: z.object({
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
  }),
  result: z.object({
    score: z.number().int().min(0).max(100),
    tier: z.enum(["hot", "warm", "cold", "disqualified"]),
    summary: z.string(),
    strengths: z.array(z.string()),
    concerns: z.array(z.string()),
    recommendedAction: z.string(),
    reasoning: z.string(),
  }),
});

export async function POST(req: Request): Promise<Response> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof SaveBodySchema>;
  try {
    const raw: unknown = await req.json();
    const parsed = SaveBodySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { runId, payload, result } = body;

  const { error } = await supabase.from("qualifications").insert({
    user_id: user.id,
    run_id: runId,
    // LeadPayload — camelCase to snake_case
    first_name: payload.firstName,
    last_name: payload.lastName,
    company: payload.company,
    industry: payload.industry,
    company_size: payload.companySize,
    role: payload.role,
    use_case: payload.useCase,
    budget: payload.budget ?? null,
    timeline: payload.timeline ?? null,
    source: payload.source ?? null,
    // QualificationResult
    score: result.score,
    tier: result.tier,
    summary: result.summary,
    strengths: result.strengths,
    concerns: result.concerns,
    recommended_action: result.recommendedAction,
    reasoning: result.reasoning,
  });

  if (error) {
    console.error("[qualify/save] Supabase insert error:", error);
    return Response.json({ error: "Failed to save result." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
