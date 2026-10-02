import type { Metadata } from "next";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Create account — Lead Qualifier",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-violet text-white text-xs font-bold select-none">
            LQ
          </span>
          <span className="text-sm font-semibold text-ink tracking-tight">
            Lead Qualifier
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
          <h1 className="text-lg font-bold text-ink mb-1">Create account</h1>
          <p className="text-sm text-ink-2 mb-6">
            Get started qualifying leads with AI.
          </p>
          <SignupForm />
        </div>

        <p className="text-center text-xs text-ink-3 mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-violet font-medium hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
