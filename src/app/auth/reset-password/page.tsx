"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      // Parse tokens from hash fragment
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setExpired(true);
        } else {
          setReady(true);
        }
      } else {
        // No tokens in hash — check if session already exists
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setReady(true);
        } else {
          setExpired(true);
        }
      }
    }
    init();
  }, [supabase]);

  async function handleSubmit() {
    if (!password || password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.replace("/workspace");
    }
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1B2B3A" }}>
        <div className="text-center">
          <p style={{ color: "#EDE8DE" }}>This link has expired. Please request a new password reset.</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1B2B3A" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "#E9C03A", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1B2B3A" }}>
      <div className="w-full max-w-sm p-8 rounded-lg border" style={{ borderColor: "#3A6B8A" }}>
        <h1 className="text-2xl mb-6" style={{ fontFamily: "Cormorant Garamond, serif", color: "#E9C03A" }}>Set New Password</h1>
        {error && <p className="mb-4 text-sm" style={{ color: "#D85A30" }}>{error}</p>}
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 mb-3 rounded-lg text-sm"
          style={{ backgroundColor: "#0f1c27", border: "1px solid #3A6B8A", color: "#EDE8DE" }}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-3 py-2 mb-6 rounded-lg text-sm"
          style={{ backgroundColor: "#0f1c27", border: "1px solid #3A6B8A", color: "#EDE8DE" }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2 rounded-lg font-semibold text-sm"
          style={{ backgroundColor: "#E9C03A", color: "#1B2B3A" }}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}
