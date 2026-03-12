"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/app/grant-suite";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Candela";
  const appTitle = process.env.NEXT_PUBLIC_APP_TITLE ?? "Candela Assist";
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@candela.education";
  const allowSignup = process.env.NEXT_PUBLIC_ALLOW_SIGNUP === "true";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #0e1e2a 0%, #1B2B3A 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/candela-logo-primary.svg"
            alt={orgName}
            width={48}
            height={48}
            className="mb-4"
          />
          <h1 className="font-fraunces text-2xl text-stone leading-none mb-1">
            {orgName}
          </h1>
          <p className="font-mono text-[10px] text-gold/50 tracking-[0.2em] uppercase">
            {appTitle}
          </p>
        </div>

        {/* Card */}
        <div className="bg-stone rounded-2xl p-8 shadow-2xl">
          <h2 className="font-fraunces font-medium text-xl text-midnight mb-1">
            Sign in
          </h2>
          <p className="font-jost text-sm text-midnight/50 mb-6">
            Enter your credentials to access the platform.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="form-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@organization.org"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm font-jost text-error bg-error/10 border border-error/20 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {allowSignup && (
            <p className="text-center font-jost text-sm text-midnight/40 mt-6">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="text-cerulean hover:text-cerulean-dark">
                Sign up
              </a>
            </p>
          )}
        </div>

        <p className="text-center font-jost text-xs text-stone/30 mt-8">
          Need access?{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="text-stone/50 hover:text-stone transition-colors"
          >
            Contact {orgName}
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
