"use client";

import { useState } from "react";

interface LiveDataBadgeProps {
  lastUpdated: string;
  metrics: Array<{ label: string; value: string }>;
}

export default function LiveDataBadge({
  lastUpdated,
  metrics,
}: LiveDataBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  const relativeDate = getRelativeDate(lastUpdated);

  return (
    <div className="print-hidden">
      {/* Badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-2 font-jost text-xs text-stone/70 hover:text-stone transition-colors"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        Live data · Updated {relativeDate}
      </button>

      {/* Expandable metrics strip */}
      {expanded && metrics.length > 0 && (
        <div
          className="mt-2 rounded-lg px-4 py-3 flex flex-wrap gap-x-6 gap-y-2"
          style={{
            backgroundColor: "#EDE8DE",
            animation: "stripSlideDown 0.2s ease",
          }}
        >
          {metrics.map((m, i) => (
            <div key={i} className="flex items-baseline gap-1.5">
              <span className="font-jost font-bold text-lg text-midnight">
                {m.value}
              </span>
              <span className="font-jost text-xs text-midnight/60">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes stripSlideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function getRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
