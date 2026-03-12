"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface PresentationModeProps {
  programName: string;
  orgName?: string;
  children: React.ReactNode;
}

export default function PresentationMode({
  programName,
  orgName,
  children,
}: PresentationModeProps) {
  const searchParams = useSearchParams();
  const isPresentation = searchParams.get("mode") === "presentation";
  const [active, setActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPresentation) {
      setActive(true);
      // Try fullscreen
      document.documentElement.requestFullscreen?.().catch(() => {
        // Fullscreen may be blocked; still show presentation layout
      });
    }
  }, [isPresentation]);

  useEffect(() => {
    if (!active) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActive(false);
        document.exitFullscreen?.().catch(() => {});
      }
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement && active) {
        setActive(false);
      }
    }

    document.addEventListener("keydown", handleKey);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [active]);

  if (!active) return <>{children}</>;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] overflow-auto"
      style={{ backgroundColor: "#1B2B3A" }}
    >
      {/* Content area */}
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div
            className="w-full max-w-[1400px] bg-stone rounded-xl overflow-hidden shadow-2xl"
            style={{ animation: "presentFadeIn 0.5s ease" }}
          >
            {children}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-3">
          <p className="font-fraunces text-sm text-stone/60">
            {programName}
            {orgName && <span className="text-stone/30"> · {orgName}</span>}
          </p>
          <p className="font-jost text-xs text-stone/40">
            Press <kbd className="px-1.5 py-0.5 rounded bg-stone/10 text-stone/60 font-mono text-[10px]">Esc</kbd> to exit
          </p>
        </div>
      </div>

      <style>{`
        @keyframes presentFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        /* Stagger animation for logic model columns */
        #logic-model-grid > div > div:nth-child(1) { animation: colFadeIn 0.4s ease 0.1s both; }
        #logic-model-grid > div > div:nth-child(2) { animation: colFadeIn 0.4s ease 0.3s both; }
        #logic-model-grid > div > div:nth-child(3) { animation: colFadeIn 0.4s ease 0.5s both; }
        #logic-model-grid > div > div:nth-child(4) { animation: colFadeIn 0.4s ease 0.7s both; }
        #logic-model-grid > div > div:nth-child(5) { animation: colFadeIn 0.4s ease 0.9s both; }
        @keyframes colFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
