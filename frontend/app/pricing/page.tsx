import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing — Lead Qualifier",
  description: "Simple, transparent pricing for AI-powered B2B lead qualification.",
};

const FREE_FEATURES = [
  "2 lead qualifications per day",
  "AI scoring across 5 criteria",
  "Tier assignment (hot / warm / cold)",
  "Full reasoning output",
  "Qualification history",
];

const PRO_FEATURES = [
  "Unlimited lead qualifications",
  "Everything in Free",
  "Priority support",
  "Cancel anytime",
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let subscriptionStatus = "free";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();
    subscriptionStatus = profile?.subscription_status ?? "free";
  }

  const isPro = subscriptionStatus === "active" || subscriptionStatus === "past_due";
  const showSuccess = searchParams.success === "1";

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      {showSuccess && (
        <div className="mb-10 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-green-700">
            You&apos;re on Pro!
          </p>
          <p className="mt-0.5 text-xs text-green-600">
            Your subscription is active. Enjoy unlimited lead qualifications.
          </p>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold text-ink tracking-tight mb-3">
          Simple, transparent pricing
        </h1>
        <p className="text-sm text-ink-2">
          Start free. Upgrade when you need more.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-2xl mx-auto">
        {/* Free tier */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-ink mb-1">Free</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-ink">$0</span>
              <span className="text-xs text-ink-3">/month</span>
            </div>
          </div>
          <ul className="space-y-2.5 mb-6">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-xs text-ink-2">
                <span className="text-violet font-bold flex-shrink-0">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          {!user ? (
            <Link
              href="/signup"
              className="block text-center px-4 py-2.5 rounded-md border border-border text-xs font-semibold text-ink hover:bg-surface-2 transition-colors"
            >
              Get started free
            </Link>
          ) : (
            <span className="block text-center text-xs text-ink-3 font-medium py-2">
              {isPro ? "Your previous plan" : "Current plan"}
            </span>
          )}
        </div>

        {/* Pro tier */}
        <div className="rounded-xl border-2 border-violet bg-surface p-6 shadow-sm relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-violet text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
              MOST POPULAR
            </span>
          </div>
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-ink mb-1">Pro</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-ink">$29</span>
              <span className="text-xs text-ink-3">/month</span>
            </div>
          </div>
          <ul className="space-y-2.5 mb-6">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-xs text-ink-2">
                <span className="text-violet font-bold flex-shrink-0">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          {!user ? (
            <Link
              href="/signup"
              className="block text-center px-4 py-2.5 rounded-md bg-violet text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Start free, upgrade later
            </Link>
          ) : isPro ? (
            <form action="/api/stripe/portal" method="POST">
              <button
                type="submit"
                className="w-full px-4 py-2.5 rounded-md border border-violet text-violet text-xs font-semibold hover:bg-violet/5 transition-colors"
              >
                Manage subscription
              </button>
            </form>
          ) : (
            <form action="/api/stripe/checkout" method="POST">
              <button
                type="submit"
                className="w-full px-4 py-2.5 rounded-md bg-violet text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Upgrade to Pro — $29/mo
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-ink-3">
        Payments are processed securely by Lemon Squeezy. Cancel anytime from your account.
      </p>
    </main>
  );
}
