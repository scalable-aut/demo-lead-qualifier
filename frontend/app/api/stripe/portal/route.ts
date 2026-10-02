import { lemonSqueezySetup, getCustomer } from "@lemonsqueezy/lemonsqueezy.js";
import { createClient } from "@/lib/supabase/server";

lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! });

export async function POST(_req: Request): Promise<Response> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return Response.json({ error: "No active subscription found" }, { status: 400 });
  }

  // stripe_customer_id column holds the Lemon Squeezy customer ID
  const customer = await getCustomer(profile.stripe_customer_id);
  const portalUrl = customer.data?.data.attributes.urls.customer_portal;

  if (!portalUrl) {
    console.error("[ls/portal] Failed to get portal URL:", customer.error);
    return Response.json({ error: "Failed to get portal URL" }, { status: 500 });
  }

  return Response.redirect(portalUrl, 303);
}
