"use client";

import { usePathname } from "next/navigation";
import { Check } from "lucide-react";

const STEPS = [
  { label: "Workspace", path: "/app/impact-studio" },
  { label: "Input", path: "/app/impact-studio/input" },
  { label: "Analysis", path: "/app/impact-studio/analysis" },
  { label: "Edit", path: "/app/impact-studio/edit" },
  { label: "Views", path: "/app/impact-studio/views" },
  { label: "Output", path: "/app/impact-studio/output" },
];

export default function StepIndicator() {
  const pathname = usePathname();

  const currentIndex = STEPS.findIndex((s) =>
    s.path === "/app/impact-studio"
      ? pathname === s.path
      : pathname.startsWith(s.path)
  );

  return (
    <div className="flex items-center gap-1 px-6 py-3 bg-white/60 border-b border-midnight/5">
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex;
        const isCompleted = i < currentIndex;

        return (
          <div key={step.path} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-8 h-px mx-1 ${
                  isCompleted ? "bg-cerulean" : "bg-midnight/10"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-cerulean text-white"
                    : isCompleted
                    ? "bg-cerulean/20 text-cerulean"
                    : "bg-midnight/5 text-midnight/30"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : i}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isActive
                    ? "text-midnight"
                    : isCompleted
                    ? "text-cerulean"
                    : "text-midnight/30"
                }`}
                style={{ fontFamily: "var(--font-jost), system-ui, sans-serif" }}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
