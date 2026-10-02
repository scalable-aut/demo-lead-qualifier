"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // If Supabase "Confirm email" is DISABLED: user is immediately signed in.
    // If ENABLED: signUp succeeds but user is not yet authenticated — show check-email state.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      router.refresh();
      router.push("/");
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <p className="text-sm font-semibold text-ink mb-1">Check your email</p>
        <p className="text-sm text-ink-2">
          We sent a confirmation link to{" "}
          <span className="font-medium">{email}</span>. Click the link to
          activate your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          placeholder="sarah@company.com"
          className="field-input"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          placeholder="Min. 8 characters"
          className="field-input"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="confirm">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={loading}
          placeholder="Repeat password"
          className="field-input"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-violet text-white text-sm font-semibold py-2.5 px-4
          hover:opacity-90 active:scale-[0.99]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
