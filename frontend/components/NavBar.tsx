import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function NavBar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isPro = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();
    const status = profile?.subscription_status;
    isPro = status === "active" || status === "past_due";
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet text-white text-xs font-bold select-none">
            LQ
          </span>
          <span className="text-sm font-semibold text-ink tracking-tight">
            Lead Qualifier
          </span>
        </Link>
        <span className="ml-1 text-xs text-ink-3 font-medium">
          AI-powered B2B scoring
        </span>

        {user ? (
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/history"
              className="text-xs font-medium text-ink-2 hover:text-ink transition-colors"
            >
              History
            </Link>
            {isPro ? (
              <form action="/api/stripe/portal" method="POST">
                <button
                  type="submit"
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet text-white text-[10px] font-bold hover:opacity-90 transition-opacity"
                >
                  Pro
                </button>
              </form>
            ) : (
              <Link
                href="/pricing"
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-violet text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Upgrade
              </Link>
            )}
            <span className="text-xs text-ink-3 hidden sm:block">
              {user.email}
            </span>
            <SignOutButton />
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-xs font-medium text-ink-2 hover:text-ink transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-xs font-medium text-ink-2 hover:text-ink transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
