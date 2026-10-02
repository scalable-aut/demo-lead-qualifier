import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Map Stripe subscription statuses to our simplified set
const STATUS_MAP: Record<string, string> = {
  active: "active",
  trialing: "active",
  past_due: "past_due",
  unpaid: "past_due",
  canceled: "canceled",
  incomplete: "free",
  incomplete_expired: "free",
  paused: "canceled",
};

// App Router: raw body is obtained via req.text() — no bodyParser config needed.
// Stripe's constructEvent() requires the raw string for signature verification.
export async function POST(req: Request): Promise<Response> {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Service-role client bypasses RLS — required here because there is no user session
  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.userId;
        if (!userId) {
          console.error("[stripe/webhook] checkout.session.completed: missing userId in metadata");
          break;
        }

        // Fetch the full subscription to get current_period_end
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await supabase.from("profiles").upsert({
          id: userId,
          stripe_customer_id: session.customer as string,
          subscription_status: "active",
          subscription_id: subscription.id,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        const mappedStatus = STATUS_MAP[subscription.status] ?? "canceled";

        await supabase
          .from("profiles")
          .update({
            subscription_status: mappedStatus,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("id", userId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
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

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        // invoice events don't carry userId in metadata — resolve via subscription_id
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("subscription_id", subscriptionId)
          .single();

        if (profile?.id) {
          await supabase
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("id", profile.id);
        }
        break;
      }

      default:
        // Unhandled event — acknowledge receipt so Stripe stops retrying
        break;
    }
  } catch (err) {
    // Log but return 200 — returning 5xx causes Stripe to retry for 72 hours
    console.error(`[stripe/webhook] Handler error for ${event.type}:`, err);
  }

  return Response.json({ received: true });
}
