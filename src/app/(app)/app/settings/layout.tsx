"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div
      className="min-h-full"
      style={{ background: "#0f1c27", fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px" }}>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs transition-colors mb-6 hover:opacity-80"
          style={{ color: "rgba(237,232,222,0.5)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        {children}
      </div>
    </div>
  );
}
