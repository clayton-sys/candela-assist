"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    async function ensureSession() {
      // First check if we already have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
        return;
      }

      // If no session, Supabase JS may pick up tokens from the URL hash automatically
      const hash = window.location.hash;
      if (hash) {
        // Give Supabase a moment to process the hash tokens
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession) {
          setSessionReady(true);
          return;
        }
      }

      // No session could be established
      setExpired(true);
    }

    ensureSession();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/workspace"), 2000);
  }

  if (expired) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          backgroundColor: "#1B2B3A",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <div className="w-full max-w-md text-center">
          <h1
            className="text-2xl mb-4"
            style={{
              color: "#E9C03A",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 600,
            }}
          >
            Link Expired
          </h1>
          <p className="text-sm" style={{ color: "#EDE8DE" }}>
            Link expired. Please request a new password reset.
          </p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#1B2B3A" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "#E9C03A", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "#EDE8DE" }}>
            Verifying your link...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundColor: "#1B2B3A",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div className="w-full max-w-md">
        <h1
          className="text-2xl text-center mb-8"
          style={{
            color: "#E9C03A",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
          }}
        >
          Reset Your Password
        </h1>

        {success ? (
          <p className="text-center text-sm" style={{ color: "#EDE8DE" }}>
            Password updated. Redirecting...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="px-3 py-2 rounded text-sm bg-[#D85A30]/20 text-[#D85A30]">
                {error}
              </div>
            )}

            <div>
              <label
                className="block text-xs uppercase tracking-wider mb-1"
                style={{ color: "rgba(237,232,222,0.7)" }}
              >
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{
                  backgroundColor: "#0f1c27",
                  border: "1px solid rgba(58,107,138,0.3)",
                  color: "#EDE8DE",
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs uppercase tracking-wider mb-1"
                style={{ color: "rgba(237,232,222,0.7)" }}
              >
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{
                  backgroundColor: "#0f1c27",
                  border: "1px solid rgba(58,107,138,0.3)",
                  color: "#EDE8DE",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#E9C03A",
                color: "#1B2B3A",
              }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
