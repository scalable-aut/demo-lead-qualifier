import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

// Map Lemon Squeezy subscription statuses to our simplified set
const STATUS_MAP: Record<string, string> = {
  active: "active",
  on_trial: "active",
  past_due: "past_due",
  unpaid: "past_due",
  cancelled: "canceled",
  expired: "canceled",
  paused: "canceled",
};

// Minimal type for the webhook payload fields we need
interface LSWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: { user_id?: string };
  };
  data: {
    id: string;
    attributes: {
      status: string;
      customer_id: number;
      renews_at: string | null;
      ends_at: string | null;
    };
  };
}

export async function POST(req: Request): Promise<Response> {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!signature) {
    return Response.json({ error: "Missing x-signature header" }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature
  const hmac = crypto.createHmac("sha256", process.env.LEMONSQUEEZY_WEBHOOK_SECRET!);
  const digest = hmac.update(rawBody).digest("hex");

  try {
    if (!crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(signature, "utf8"))) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as LSWebhookPayload;
  const { event_name: eventName, custom_data: customData } = payload.meta;
  const userId = customData?.user_id;
  const attrs = payload.data.attributes;

  const supabase = createServiceClient();

  try {
    switch (eventName) {
      case "subscription_created": {
        if (!userId) {
          console.error("[ls/webhook] subscription_created: missing user_id in custom_data");
          break;
        }
        await supabase.from("profiles").upsert({
          id: userId,
          // Reuse stripe_customer_id column to store the LS customer ID
          stripe_customer_id: String(attrs.customer_id),
          subscription_status: "active",
          subscription_id: payload.data.id,
          current_period_end: attrs.renews_at ?? null,
        });
        break;
      }

      case "subscription_updated": {
        if (!userId) break;
        const mappedStatus = STATUS_MAP[attrs.status] ?? "canceled";
        await supabase
          .from("profiles")
          .update({
            subscription_status: mappedStatus,
            current_period_end: attrs.renews_at ?? null,
          })
          .eq("id", userId);
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        if (!userId) break;
        await supabase
          .from("profiles")
          .update({
            subscription_status: "canceled",
            subscription_id: null,
            current_period_end: null,
          })
          .eq("id", userId);
        break;
      }

      case "subscription_payment_failed": {
        if (!userId) break;
        await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("id", userId);
        break;
      }

      default:
        // Unhandled event — return 200 so LS stops retrying
        break;
    }
  } catch (err) {
    console.error(`[ls/webhook] Handler error for ${eventName}:`, err);
    // Return 200 to prevent Lemon Squeezy from retrying indefinitely
  }

  return Response.json({ received: true });
}
