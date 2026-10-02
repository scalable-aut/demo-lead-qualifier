import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
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

  const checkout = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    process.env.LEMONSQUEEZY_VARIANT_ID!,
    {
      checkoutData: {
        email: user.email,
        // user_id is carried through all subscription webhook events via custom_data
        custom: { user_id: user.id },
      },
      productOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?success=1`,
      },
    }
  );

  const url = checkout.data?.data.attributes.url;
  if (!url) {
    console.error("[ls/checkout] Failed to get checkout URL:", checkout.error);
    return Response.json({ error: "Failed to create checkout" }, { status: 500 });
  }

  return Response.redirect(url, 303);
}
