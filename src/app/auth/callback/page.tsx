"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function handleCallback() {
      // Supabase JS reads the URL fragment and establishes the session
      await supabase.auth.getSession();

      // Check if this is a password recovery flow
      const hash = window.location.hash;
      if (hash.includes("type=recovery")) {
        router.replace("/auth/reset-password");
      } else {
        router.replace("/workspace");
      }
    }

    handleCallback();
  }, [supabase, router]);

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
          Signing you in...
        </p>
      </div>
    </div>
  );
}
