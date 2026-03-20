"use client";

import { useRouter } from "next/navigation";

interface LiveViewClientProps {
  projectId: string;
  viewType: string | null;
  outputData: unknown;
  brandKit: unknown;
}

export default function LiveViewClient({
  projectId,
  viewType,
  outputData,
}: LiveViewClientProps) {
  const router = useRouter();
  const outputHtml = typeof outputData === "string" ? outputData : null;

  return (
    <div className="relative">
      {/* Floating exit control */}
      <button
        onClick={() =>
          router.push(`/app/impact-studio/projects/${projectId}`)
        }
        className="fixed top-4 left-4 z-50 px-4 py-2 rounded-full text-[13px] text-[#EDE8DE] transition-colors"
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          background: "rgba(27, 43, 58, 0.8)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(27, 43, 58, 1)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(27, 43, 58, 0.8)")
        }
      >
        ← Back
      </button>

      {outputHtml ? (
        <iframe
          srcDoc={outputHtml}
          sandbox="allow-scripts allow-same-origin"
          style={{ width: "100vw", height: "100vh", border: "none" }}
          title={`Live ${viewType ?? "view"}`}
        />
      ) : (
        <div
          style={{
            background: "#1B2B3A",
            color: "#EDE8DE",
            fontFamily: "DM Sans, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100vw",
            height: "100vh",
          }}
        >
          <p>
            {viewType
              ? `No output generated for "${viewType}" yet. Generate a run first.`
              : "No view data available yet. Generate a run first."}
          </p>
        </div>
      )}
    </div>
  );
}
