"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordField } from "@/components/auth/PasswordField";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    router.push("/vendors");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="signup-email"
          className="block text-xs font-medium text-zinc-500"
        >
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border-0 bg-zinc-100 px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <PasswordField
        id="signup-password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={6}
      />

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Sign up"}
      </button>

      <GoogleSignInButton label="Or sign up with Google" />
    </form>
  );
}
