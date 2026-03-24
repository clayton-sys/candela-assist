"use client";

import { useState, useMemo } from "react";
import { LineChart, Line } from "recharts";
import type { ImpactRoomInternalPayload, ProgramStatus } from "@/lib/impact-room/assemble-internal";

const GREEN = "#00ff88";
const RED = "#ff4d4d";
const GOLD = "#E9C03A";
const BLUE = "#4d9fff";
const BRIGHT = "rgba(255,255,255,0.88)";
const MID = "rgba(255,255,255,0.45)";
const DIM = "rgba(255,255,255,0.18)";

const MONO = "'DM Mono', 'var(--font-dm-mono)', ui-monospace, monospace";

function StatusPill({ status }: { status: ProgramStatus }) {
  const config = {
    on_track: { bg: "rgba(0,255,136,0.08)", color: GREEN, label: "ON TRACK" },
    at_risk: { bg: "rgba(233,192,58,0.1)", color: GOLD, label: "AT RISK" },
    alert: { bg: "rgba(255,77,77,0.1)", color: RED, label: "ALERT" },
  }[status];

  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: "10px",
        letterSpacing: "1px",
        padding: "4px 10px",
        borderRadius: "3px",
        backgroundColor: config.bg,
        color: config.color,
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}

function DeltaValue({ delta, trend }: { delta: string | null; trend: "up" | "down" | "flat" | null }) {
  if (!delta || !trend) return <span style={{ color: DIM }}>—</span>;
  const color = trend === "up" ? GREEN : trend === "down" ? RED : MID;
  const arrow = trend === "up" ? "▲" : trend === "down" ? "▼" : "";
  return (
    <span style={{ fontFamily: MONO, fontSize: "14px", color }}>
      {arrow} {delta}
    </span>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <LineChart width={80} height={32} data={chartData}>
      <Line
        type="monotone"
        dataKey="v"
        stroke={GOLD}
        strokeWidth={1.5}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
}

function getSparklineData(
  programs: ImpactRoomInternalPayload["programs"],
  progId: string,
  metricLabel: string
): number[] {
  const prog = programs.find((p) => p.id === progId);
  if (!prog?.periods) return [];
  // Periods are newest-first from the API; reverse for chronological
  const reversed = [...prog.periods].reverse();
  const values: number[] = [];
  for (const period of reversed) {
    const m = period.metrics.find((met) => met.label === metricLabel);
    if (m) {
      const num = parseFloat((m.value ?? "0").replace(/[^0-9.-]/g, ""));
      if (!isNaN(num)) values.push(num);
    }
  }
  return values;
}

interface TerminalViewProps {
  payload: ImpactRoomInternalPayload;
  slug: string;
}

export default function TerminalView({ payload, slug }: TerminalViewProps) {
  const { org, as_of, period_label, programs, summary, overall_status, ticker_items } = payload;

  // ── Period filter ───────────────────────────────────────────────
  const allPeriods = useMemo(() => {
    const seen = new Set<string>();
    for (const prog of programs) {
      for (const p of prog.periods ?? []) {
        if (p.period_label) seen.add(p.period_label);
      }
    }
    // Filter out periods where ALL programs have zero metrics
    return Array.from(seen).filter((label) =>
      programs.some((prog) => {
        const snapshot = prog.periods?.find((p) => p.period_label === label);
        return snapshot && snapshot.metrics.length > 0;
      })
    );
  }, [programs]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>("__latest__");

  const displayPrograms = useMemo(() => {
    if (selectedPeriod === "__latest__") return programs;
    return programs.map((prog) => {
      const snapshot = prog.periods?.find((p) => p.period_label === selectedPeriod);
      if (!snapshot) return { ...prog, metrics: [], barriers_summary: null };
      return {
        ...prog,
        metrics: snapshot.metrics.map((m) => ({
          label: m.label,
          value: m.value,
          target: m.target,
          prior_value: null as string | null,
          delta: null as string | null,
          trend: null as "up" | "down" | "flat" | null,
        })),
        barriers_summary: snapshot.barriers_summary,
        status: "on_track" as ProgramStatus,
      };
    });
  }, [selectedPeriod, programs]);

  const isSpecificPeriod = selectedPeriod !== "__latest__";
  const activePeriodLabel = isSpecificPeriod ? selectedPeriod : period_label;
  const gridCols = isSpecificPeriod
    ? "2fr 1.2fr 1.2fr 60px 90px"
    : "2fr 1.2fr 1.2fr 1.2fr 80px 60px 90px";

  // Duplicate ticker items for seamless scroll
  const tickerDuplicated = [...ticker_items, ...ticker_items];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0a0c0f", fontFamily: MONO }}
    >
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{
          backgroundColor: "#0d0f12",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Left */}
        <div style={{ fontSize: "14px" }}>
          <span style={{ color: BRIGHT }}>{org.name.toUpperCase()}</span>
          <span style={{ color: GOLD }}>{" // IMPACT TERMINAL"}</span>
        </div>

        {/* Center — mode switcher */}
        <div className="flex gap-1">
          {[
            { label: "PUBLIC", href: `/impact/${slug}` },
            { label: "BOARD", href: `/impact/${slug}/board` },
            { label: "INTERNAL", href: `/impact/${slug}?mode=internal` },
          ].map((item) => {
            const isActive = item.label === "INTERNAL";
            return (
              <a
                key={item.label}
                href={item.href}
                style={{
                  fontFamily: MONO,
                  fontSize: "11px",
                  letterSpacing: "2px",
                  padding: "4px 12px",
                  borderRadius: "2px",
                  backgroundColor: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                  color: isActive ? BRIGHT : DIM,
                  textDecoration: "none",
                }}
              >
                {item.label}
              </a>
            );
          })}
        </div>

        {/* Period filter */}
        {allPeriods.length > 1 && (
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                letterSpacing: "2px",
                color: DIM,
              }}
            >
              PERIOD:
            </span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{
                fontFamily: MONO,
                fontSize: "11px",
                color: GREEN,
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "2px",
                padding: "3px 8px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="__latest__">LATEST</option>
              {allPeriods.map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right */}
        <div style={{ fontSize: "11px", color: DIM }}>
          AS OF {as_of.toUpperCase()} &middot; {activePeriodLabel.toUpperCase()}
        </div>
      </header>

      {/* ── Summary row ──────────────────────────────────────────── */}
      <div
        className="grid grid-cols-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Total Participants */}
        <SummaryCell
          label="Total Participants"
          value={summary.total_participants !== null ? summary.total_participants.toLocaleString() : "—"}
          delta={
            summary.participants_delta !== null
              ? `${summary.participants_delta > 0 ? "+" : ""}${summary.participants_delta}`
              : null
          }
          deltaColor={
            summary.participants_delta !== null
              ? summary.participants_delta >= 0
                ? GREEN
                : RED
              : undefined
          }
        />

        {/* Programs Active */}
        <SummaryCell
          label="Programs Active"
          value={displayPrograms.length.toString()}
          delta={null}
        />

        {/* Metrics Tracked */}
        <SummaryCell
          label="Metrics Tracked"
          value={displayPrograms.reduce((sum, p) => sum + p.metrics.length, 0).toString()}
          delta={null}
        />

        {/* Overall Status */}
        <div
          className="px-5 py-4"
          style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p
            style={{
              fontFamily: MONO,
              fontSize: "10px",
              color: DIM,
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Overall Status
          </p>
          <StatusPill status={overall_status} />
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {/* Table header */}
        <div
          className="grid px-5 py-3"
          style={{
            gridTemplateColumns: gridCols,
            backgroundColor: "#0d0f12",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {(isSpecificPeriod
            ? ["Program", "Headline Metric", "Target", "Status", "Trend"]
            : ["Program", "Headline Metric", "Target", "Prior Period", "Delta", "Status", "Trend"]
          ).map((col) => (
              <span
                key={col}
                style={{
                  fontFamily: MONO,
                  fontSize: "10px",
                  color: DIM,
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                }}
              >
                {col}
              </span>
            )
          )}
        </div>

        {/* Program rows */}
        {displayPrograms.map((prog) => {
          const headline = prog.metrics[0];
          return (
            <div
              key={prog.id}
              className="grid px-5 py-4 transition-colors"
              style={{
                gridTemplateColumns: gridCols,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  "transparent";
              }}
            >
              {/* Program */}
              <div>
                <p style={{ fontFamily: MONO, fontSize: "14px", color: BRIGHT }}>
                  {prog.name}
                </p>
                {prog.barriers_summary && (
                  <p
                    style={{
                      fontFamily: MONO,
                      fontSize: "11px",
                      color: DIM,
                      marginTop: "2px",
                    }}
                  >
                    {prog.barriers_summary}
                  </p>
                )}
              </div>

              {/* Headline Metric */}
              <div>
                <p style={{ fontFamily: MONO, fontSize: "16px", color: BRIGHT }}>
                  {headline?.value ?? "—"}
                </p>
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: "10px",
                    color: DIM,
                    marginTop: "2px",
                  }}
                >
                  {headline?.label ?? ""}
                </p>
              </div>

              {/* Target */}
              <p style={{ fontFamily: MONO, fontSize: "12px", color: DIM }}>
                {headline?.target ?? "—"}
              </p>

              {!isSpecificPeriod && (
                <>
                  {/* Prior Period */}
                  <p style={{ fontFamily: MONO, fontSize: "12px", color: DIM }}>
                    {headline?.prior_value ?? "—"}
                  </p>

                  {/* Delta */}
                  <DeltaValue
                    delta={headline?.delta ?? null}
                    trend={headline?.trend ?? null}
                  />
                </>
              )}

              {/* Status */}
              <StatusPill status={prog.status} />

              {/* Sparkline */}
              <div style={{ display: "flex", alignItems: "center" }}>
                {headline && (
                  <Sparkline data={getSparklineData(programs, prog.id, headline.label)} />
                )}
              </div>
            </div>
          );
        })}

        {/* Additional metric rows for programs with multiple metrics */}
        {displayPrograms.map((prog) =>
          prog.metrics.slice(1).map((m, i) => (
            <div
              key={`${prog.id}-${i}`}
              className="grid px-5 py-3 transition-colors"
              style={{
                gridTemplateColumns: gridCols,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  "transparent";
              }}
            >
              {/* Indented sub-metric */}
              <p style={{ fontFamily: MONO, fontSize: "11px", color: MID, paddingLeft: "16px" }}>
                └ {m.label}
              </p>
              <p style={{ fontFamily: MONO, fontSize: "14px", color: BRIGHT }}>
                {m.value}
              </p>
              <p style={{ fontFamily: MONO, fontSize: "12px", color: DIM }}>
                {m.target ?? "—"}
              </p>
              {!isSpecificPeriod && (
                <>
                  <p style={{ fontFamily: MONO, fontSize: "12px", color: DIM }}>
                    {m.prior_value ?? "—"}
                  </p>
                  <DeltaValue delta={m.delta} trend={m.trend} />
                </>
              )}
              {/* Sparkline */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <Sparkline data={getSparklineData(programs, prog.id, m.label)} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Ticker bar ───────────────────────────────────────────── */}
      <div
        className="shrink-0 overflow-hidden"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          backgroundColor: "#0b0d10",
          padding: "7px 0",
        }}
      >
        <div
          className="flex whitespace-nowrap"
          style={{
            animation: "ticker-scroll 28s linear infinite",
          }}
        >
          {tickerDuplicated.map((item, i) => (
            <span
              key={i}
              className="mx-6"
              style={{ fontFamily: MONO, fontSize: "11px", color: DIM }}
            >
              {item.split("·").map((part, j) => {
                const trimmed = part.trim();
                // Numbers and deltas get brighter/colored treatment
                const hasNumber = /\d/.test(trimmed);
                const isPositive = trimmed.startsWith("+");
                const isNegative = trimmed.startsWith("-") && hasNumber;
                let color = DIM;
                if (isPositive) color = GREEN;
                else if (isNegative) color = RED;
                else if (hasNumber) color = BRIGHT;

                return (
                  <span key={j}>
                    {j > 0 && (
                      <span style={{ color: DIM }}> &middot; </span>
                    )}
                    <span style={{ color }}>{trimmed}</span>
                  </span>
                );
              })}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes ticker-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <footer
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          backgroundColor: "#0a0c0f",
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: "11px", color: DIM }}>
          {activePeriodLabel.toUpperCase()} &middot; {org.name.toUpperCase()}
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: "10px",
            color: "rgba(233,192,58,0.4)",
          }}
        >
          {"CANDELA // INTERNAL"}
        </span>
      </footer>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  delta,
  deltaColor,
}: {
  label: string;
  value: string;
  delta: string | null;
  deltaColor?: string;
}) {
  return (
    <div
      className="px-5 py-4"
      style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}
    >
      <p
        style={{
          fontFamily: MONO,
          fontSize: "10px",
          color: DIM,
          letterSpacing: "3px",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>
      <p style={{ fontFamily: MONO, fontSize: "24px", color: BRIGHT }}>{value}</p>
      {delta && (
        <p
          style={{
            fontFamily: MONO,
            fontSize: "11px",
            color: deltaColor ?? MID,
            marginTop: "4px",
          }}
        >
          {delta}
        </p>
      )}
    </div>
  );
}
