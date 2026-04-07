"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordField } from "@/components/auth/PasswordField";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    if (remember && typeof window !== "undefined") {
      localStorage.setItem("client-track-remember", "1");
    } else {
      localStorage.removeItem("client-track-remember");
    }
    router.push("/vendors");
    router.refresh();
  }

  async function handleForgotPassword() {
    setError(null);
    setInfo(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email above, then tap Forgot password.");
      return;
    }
    setForgotLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      trimmed,
      { redirectTo: `${origin}/auth/callback?next=/login` },
    );
    setForgotLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setInfo("Check your email for a reset link.");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="login-email"
          className="block text-xs font-medium text-zinc-500"
        >
          Login
        </label>
        <input
          id="login-email"
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
        id="login-password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={remember}
            onClick={() => setRemember((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              remember ? "bg-blue-600" : "bg-zinc-200"
            }`}
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                remember ? "translate-x-[1.25rem]" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm text-zinc-600">Remember me</span>
        </div>
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={forgotLoading}
          className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
        >
          {forgotLoading ? "Sending…" : "Forgot password?"}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-green-700" role="status">
          {info}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <GoogleSignInButton />
    </form>
  );
}
