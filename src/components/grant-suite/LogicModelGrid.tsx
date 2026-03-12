"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LogicModelData {
  inputs: Array<{ title: string; detail: string }>;
  activities: Array<{ title: string; detail: string }>;
  outputs: Array<{ title: string; metric: string; target: string }>;
  shortTermOutcomes: Array<{ title: string; indicator: string; timeframe: string }>;
  longTermOutcomes: Array<{ title: string; indicator: string; timeframe: string }>;
  theoryOfChange: string;
}

export interface SelectedCard {
  column: string;
  index: number;
}

// ─── Column config (exported for use by EvaluationPanel) ─────────────────────

export const COLUMNS = [
  {
    key: "inputs" as const,
    label: "Inputs",
    headerBg: "#185FA5",
    bodyBg: "#f0f7ff",
    accent: "#185FA5",
  },
  {
    key: "activities" as const,
    label: "Activities",
    headerBg: "#0F6E56",
    bodyBg: "#eafaf3",
    accent: "#0F6E56",
  },
  {
    key: "outputs" as const,
    label: "Outputs",
    headerBg: "#854F0B",
    bodyBg: "#fff7eb",
    accent: "#854F0B",
  },
  {
    key: "shortTermOutcomes" as const,
    label: "Short-Term Outcomes",
    headerBg: "#3C3489",
    bodyBg: "#f3f2fe",
    accent: "#3C3489",
  },
  {
    key: "longTermOutcomes" as const,
    label: "Long-Term Outcomes",
    headerBg: "#993C1D",
    bodyBg: "#fff0eb",
    accent: "#993C1D",
  },
] as const;

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({
  title,
  subtext,
  accent,
  badge,
  badgeColor,
  italic,
  selected,
  onClick,
}: {
  title: string;
  subtext?: string;
  accent: string;
  badge?: string;
  badgeColor?: string;
  italic?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderTop: selected ? `2px solid ${accent}` : "1px solid #e5e7eb",
        borderRight: selected ? `2px solid ${accent}` : "1px solid #e5e7eb",
        borderBottom: selected ? `2px solid ${accent}` : "1px solid #e5e7eb",
        borderLeft: `3px solid ${accent}`,
        backgroundColor: selected ? `${accent}08` : "white",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: selected
          ? `0 2px 8px ${accent}20`
          : hovered
            ? "0 4px 12px rgba(0,0,0,0.10)"
            : "0 1px 3px rgba(0,0,0,0.06)",
        transition: "all 0.15s ease",
        cursor: "pointer",
        position: "relative",
      }}
      className="rounded-[5px] p-3 flex flex-col gap-1.5 select-none"
    >
      {badge && (
        <p
          className="font-jost font-bold text-lg leading-none"
          style={{ color: badgeColor ?? accent }}
        >
          {badge}
        </p>
      )}
      <p className="font-jost font-medium text-[11px] text-midnight leading-snug">
        {title}
      </p>
      {subtext && (
        <p className="font-jost text-[10px] text-[#6b7280] leading-snug">
          {subtext}
        </p>
      )}
      {italic && (
        <p className="font-jost text-[10px] italic text-[#e67e5a] leading-snug mt-0.5">
          {italic}
        </p>
      )}

      {/* "Click to explore" hint */}
      <span
        className="font-jost text-[10px] text-[#9ca3af] absolute bottom-2 right-2 transition-opacity duration-150"
        style={{ opacity: hovered && !selected ? 1 : 0 }}
        aria-hidden
      >
        Click to explore
      </span>
    </div>
  );
}

// ─── Arrow connector ──────────────────────────────────────────────────────────

function Arrow({ color }: { color: string }) {
  return (
    <div className="hidden sm:flex items-center justify-center w-6 flex-shrink-0">
      <span
        className="text-lg font-bold select-none"
        style={{ color, opacity: 0.6 }}
        aria-hidden
      >
        →
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface LogicModelGridProps {
  data: LogicModelData;
  selectedCard?: SelectedCard | null;
  onCardClick?: (column: string, index: number) => void;
}

export default function LogicModelGrid({
  data,
  selectedCard,
  onCardClick,
}: LogicModelGridProps) {
  return (
    <div id="logic-model-grid" className="w-full px-6 py-6">
      <div className="flex flex-col sm:flex-row gap-0 items-stretch">
        {COLUMNS.map((col, colIndex) => {
          const items = data[col.key] as unknown[];

          return (
            <div
              key={col.key}
              className="flex flex-col sm:flex-row items-stretch flex-1 min-w-0"
            >
              {/* Column */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Column header */}
                <div
                  className="px-3 py-2 rounded-t-md mb-2"
                  style={{ backgroundColor: col.headerBg }}
                >
                  <span className="font-mono text-[9px] text-white uppercase tracking-[0.14em]">
                    {col.label}
                  </span>
                </div>

                {/* Cards */}
                <div
                  className="flex-1 rounded-b-md p-2 flex flex-col gap-2"
                  style={{ backgroundColor: col.bodyBg }}
                >
                  {items.map((item, i) => {
                    const it = item as Record<string, string>;
                    const isSelected =
                      selectedCard?.column === col.key &&
                      selectedCard?.index === i;

                    const cardClickHandler = () => onCardClick?.(col.key, i);

                    if (col.key === "inputs" || col.key === "activities") {
                      return (
                        <Card
                          key={i}
                          title={it.title}
                          subtext={it.detail}
                          accent={col.accent}
                          selected={isSelected}
                          onClick={cardClickHandler}
                        />
                      );
                    }

                    if (col.key === "outputs") {
                      return (
                        <Card
                          key={i}
                          title={it.title}
                          subtext={it.metric}
                          badge={it.target}
                          badgeColor={col.accent}
                          accent={col.accent}
                          selected={isSelected}
                          onClick={cardClickHandler}
                        />
                      );
                    }

                    if (
                      col.key === "shortTermOutcomes" ||
                      col.key === "longTermOutcomes"
                    ) {
                      return (
                        <Card
                          key={i}
                          title={it.title}
                          subtext={it.indicator}
                          italic={it.timeframe}
                          accent={col.accent}
                          selected={isSelected}
                          onClick={cardClickHandler}
                        />
                      );
                    }

                    return null;
                  })}
                </div>
              </div>

              {/* Arrow between columns */}
              {colIndex < COLUMNS.length - 1 && (
                <Arrow color={col.accent} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
