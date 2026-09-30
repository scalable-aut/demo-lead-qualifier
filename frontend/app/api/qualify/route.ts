import { tasks, auth } from "@trigger.dev/sdk/v3";
import type { LeadPayload } from "@/lib/types";

export async function POST(req: Request): Promise<Response> {
  try {
    const payload: LeadPayload = await req.json();

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
