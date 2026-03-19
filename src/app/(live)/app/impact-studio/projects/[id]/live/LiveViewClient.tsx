"use client";

import { useRouter } from "next/navigation";
import StaffDashboard from "@/components/impact-studio/views/StaffDashboard";
import ImpactCommandCenter from "@/components/impact-studio/views/ImpactCommandCenter";
import ImpactJourney from "@/components/impact-studio/views/ImpactJourney";
import OrbitView from "@/components/impact-studio/views/OrbitView";

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
  brandKit,
}: LiveViewClientProps) {
  const router = useRouter();

  function renderView() {
    switch (viewType) {
      case "impact_command_center":
        return <ImpactCommandCenter data={outputData} brandKit={brandKit} />;
      case "story_view":
        return <ImpactJourney data={outputData} brandKit={brandKit} />;
      case "impact_snapshot":
      case "funder_narrative":
      case "website_embed":
      case "program_profile":
        return <StaffDashboard data={outputData} brandKit={brandKit} />;
      default:
        return (
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
                ? `View type "${viewType}" — coming soon`
                : "No view data available yet. Generate a run first."}
            </p>
          </div>
        );
    }
  }

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

      {renderView()}
    </div>
  );
}
