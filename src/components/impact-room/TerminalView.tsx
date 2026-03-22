"use client";

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
        fontSize: "8px",
        letterSpacing: "1px",
        padding: "3px 8px",
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
    <span style={{ fontFamily: MONO, fontSize: "11px", color }}>
      {arrow} {delta}
    </span>
  );
}

interface TerminalViewProps {
  payload: ImpactRoomInternalPayload;
  slug: string;
}

export default function TerminalView({ payload, slug }: TerminalViewProps) {
  const { org, as_of, period_label, programs, summary, overall_status, ticker_items } = payload;

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
        <div style={{ fontSize: "11px" }}>
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
                  fontSize: "9px",
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

        {/* Right */}
        <div style={{ fontSize: "9px", color: DIM }}>
          AS OF {as_of.toUpperCase()} &middot; {period_label.toUpperCase()}
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

        {/* Avg Placement Rate — derived if available */}
        <SummaryCell
          label="Programs Active"
          value={programs.length.toString()}
          delta={null}
        />

        {/* Metrics Tracked */}
        <SummaryCell
          label="Metrics Tracked"
          value={programs.reduce((sum, p) => sum + p.metrics.length, 0).toString()}
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
              fontSize: "8px",
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
            gridTemplateColumns: "2fr 1.2fr 1.2fr 1.2fr 80px 60px",
            backgroundColor: "#0d0f12",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {["Program", "Headline Metric", "Target", "Prior Period", "Delta", "Status"].map(
            (col) => (
              <span
                key={col}
                style={{
                  fontFamily: MONO,
                  fontSize: "8px",
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
        {programs.map((prog) => {
          const headline = prog.metrics[0];
          return (
            <div
              key={prog.id}
              className="grid px-5 py-4 transition-colors"
              style={{
                gridTemplateColumns: "2fr 1.2fr 1.2fr 1.2fr 80px 60px",
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
                <p style={{ fontFamily: MONO, fontSize: "11px", color: BRIGHT }}>
                  {prog.name}
                </p>
                {prog.barriers_summary && (
                  <p
                    style={{
                      fontFamily: MONO,
                      fontSize: "9px",
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
                <p style={{ fontFamily: MONO, fontSize: "13px", color: BRIGHT }}>
                  {headline?.value ?? "—"}
                </p>
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: "8px",
                    color: DIM,
                    marginTop: "2px",
                  }}
                >
                  {headline?.label ?? ""}
                </p>
              </div>

              {/* Target */}
              <p style={{ fontFamily: MONO, fontSize: "9px", color: DIM }}>
                {headline?.target ?? "—"}
              </p>

              {/* Prior Period */}
              <p style={{ fontFamily: MONO, fontSize: "9px", color: DIM }}>
                {headline?.prior_value ?? "—"}
              </p>

              {/* Delta */}
              <DeltaValue
                delta={headline?.delta ?? null}
                trend={headline?.trend ?? null}
              />

              {/* Status */}
              <StatusPill status={prog.status} />
            </div>
          );
        })}

        {/* Additional metric rows for programs with multiple metrics */}
        {programs.map((prog) =>
          prog.metrics.slice(1).map((m, i) => (
            <div
              key={`${prog.id}-${i}`}
              className="grid px-5 py-3 transition-colors"
              style={{
                gridTemplateColumns: "2fr 1.2fr 1.2fr 1.2fr 80px 60px",
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
              <p style={{ fontFamily: MONO, fontSize: "9px", color: MID, paddingLeft: "16px" }}>
                └ {m.label}
              </p>
              <p style={{ fontFamily: MONO, fontSize: "11px", color: BRIGHT }}>
                {m.value}
              </p>
              <p style={{ fontFamily: MONO, fontSize: "9px", color: DIM }}>
                {m.target ?? "—"}
              </p>
              <p style={{ fontFamily: MONO, fontSize: "9px", color: DIM }}>
                {m.prior_value ?? "—"}
              </p>
              <DeltaValue delta={m.delta} trend={m.trend} />
              <span />
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
              style={{ fontFamily: MONO, fontSize: "9px", color: DIM }}
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
        <span style={{ fontFamily: MONO, fontSize: "9px", color: DIM }}>
          {period_label.toUpperCase()} &middot; {org.name.toUpperCase()}
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: "8px",
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
          fontSize: "8px",
          color: DIM,
          letterSpacing: "3px",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>
      <p style={{ fontFamily: MONO, fontSize: "18px", color: BRIGHT }}>{value}</p>
      {delta && (
        <p
          style={{
            fontFamily: MONO,
            fontSize: "9px",
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
