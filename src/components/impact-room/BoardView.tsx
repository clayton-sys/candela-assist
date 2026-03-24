"use client";

import { ImpactRoomPublicPayload } from "@/lib/impact-room/assemble-public";
import CeoMessageSection from "./CeoMessageSection";

interface BoardViewProps {
  payload: ImpactRoomPublicPayload;
}

function ProgressBar({ value, target }: { value: string; target: string }) {
  const v = parseFloat(value.replace(/[^0-9.-]/g, ""));
  const t = parseFloat(target.replace(/[^0-9.-]/g, ""));
  const pct = !isNaN(v) && !isNaN(t) && t > 0 ? Math.min((v / t) * 100, 100) : 0;

  return (
    <div style={{ width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          backgroundColor: "#E9C03A",
          borderRadius: 3,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

function ProgressBarLight({ value, target }: { value: string; target: string }) {
  const v = parseFloat(value.replace(/[^0-9.-]/g, ""));
  const t = parseFloat(target.replace(/[^0-9.-]/g, ""));
  const pct = !isNaN(v) && !isNaN(t) && t > 0 ? Math.min((v / t) * 100, 100) : 0;

  return (
    <div style={{ width: "100%", height: 6, backgroundColor: "rgba(27,43,58,0.1)", borderRadius: 3 }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          backgroundColor: "#E9C03A",
          borderRadius: 3,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

export default function BoardView({ payload }: BoardViewProps) {
  const { org, period_label, programs } = payload;

  // Aggregate top metrics across programs for the snapshot
  const aggregateMetrics: Array<{ label: string; value: string }> = [];
  for (const prog of programs) {
    if (prog.headline_metric) {
      aggregateMetrics.push({
        label: prog.headline_metric.label,
        value: prog.headline_metric.value,
      });
    }
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .board-print-hide { display: none !important; }
          body { margin: 0; }
          @page { margin: 0.75in; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .board-program-section:not(:first-of-type) { page-break-before: always; }
        }
      `}</style>

      <div style={{ minHeight: "100vh" }}>
        {/* ── SECTION 1: HEADER (dark) ── */}
        <section
          style={{
            backgroundColor: "#1B2B3A",
            padding: "60px 40px",
            position: "relative",
          }}
        >
          {/* Print button */}
          <button
            className="board-print-hide"
            onClick={() => window.print()}
            style={{
              position: "absolute",
              top: 24,
              right: 32,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "#E9C03A",
              backgroundColor: "transparent",
              border: "1px solid #E9C03A",
              borderRadius: 4,
              padding: "6px 16px",
              cursor: "pointer",
            }}
          >
            Print
          </button>

          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            {/* Logo or org name */}
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                style={{ height: 48, marginBottom: 24, objectFit: "contain" }}
              />
            ) : (
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "2.4rem",
                  fontWeight: 700,
                  color: "#EDE8DE",
                  marginBottom: 24,
                }}
              >
                {org.name}
              </h1>
            )}

            {/* Report title */}
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2rem",
                fontWeight: 600,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              {org.name} &mdash; Board Impact Summary
            </h2>

            {/* Period */}
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.85rem",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "3px",
                color: "#3A6B8A",
                marginBottom: 24,
              }}
            >
              {period_label}
            </p>

            {/* Mission */}
            {org.mission_short && (
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.2rem",
                  fontStyle: "italic",
                  fontWeight: 300,
                  color: "rgba(237,232,222,0.75)",
                  lineHeight: 1.6,
                  maxWidth: 720,
                }}
              >
                {org.mission_short}
              </p>
            )}
          </div>
        </section>

        {/* ── SECTION 2: AGENCY SNAPSHOT (light) ── */}
        <section style={{ backgroundColor: "#EDE8DE", padding: "48px 40px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "4px",
                color: "#3A6B8A",
                marginBottom: 32,
              }}
            >
              At a Glance
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(aggregateMetrics.length || 1, 4)}, 1fr)`,
                gap: 32,
              }}
            >
              {aggregateMetrics.length > 0 ? (
                aggregateMetrics.slice(0, 4).map((m, i) => {
                  const numMatch = m.value.match(/[\d,]+/);
                  const numStr = numMatch ? numMatch[0] : m.value;
                  const unit = m.value.replace(/[\d,]+/, "").trim();
                  return (
                    <div key={i} style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "3.5rem",
                          fontWeight: 300,
                          color: "#1B2B3A",
                          lineHeight: 1.1,
                        }}
                      >
                        {numStr}
                      </p>
                      {unit && (
                        <p
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.75rem",
                            color: "#3A6B8A",
                            textTransform: "uppercase",
                            letterSpacing: "2px",
                            marginTop: 4,
                          }}
                        >
                          {unit}
                        </p>
                      )}
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          color: "#1B2B3A",
                          marginTop: 8,
                        }}
                      >
                        {m.label}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "3.5rem",
                      fontWeight: 300,
                      color: "#1B2B3A",
                      lineHeight: 1.1,
                    }}
                  >
                    {programs.length}
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "#1B2B3A",
                      marginTop: 8,
                    }}
                  >
                    Active Programs
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── SECTION 3: PROGRAMS (alternating dark/light) ── */}
        {programs.map((prog, idx) => {
          const isDark = idx % 2 === 0;
          const bg = isDark ? "#1B2B3A" : "#EDE8DE";
          const textColor = isDark ? "#FFFFFF" : "#1B2B3A";
          const mutedColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(27,43,58,0.55)";
          const labelColor = "#3A6B8A";
          const metrics = prog.all_metrics.length > 0 ? prog.all_metrics : (prog.headline_metric ? [{ label: prog.headline_metric.label, value: prog.headline_metric.value, target: prog.headline_metric.target ?? null }] : []);
          const description = prog.description
            ? prog.description.length > 200
              ? prog.description.slice(0, 200).trim() + "…"
              : prog.description
            : null;

          return (
            <section
              key={prog.id}
              className="board-program-section"
              style={{ backgroundColor: bg, padding: "56px 40px" }}
            >
              <div style={{ maxWidth: 960, margin: "0 auto" }}>
                {/* Program name */}
                <h3
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "2rem",
                    fontWeight: 600,
                    color: textColor,
                    marginBottom: 8,
                  }}
                >
                  {prog.name}
                </h3>

                {/* Description */}
                {description && (
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.9rem",
                      color: mutedColor,
                      lineHeight: 1.6,
                      marginBottom: 24,
                      maxWidth: 640,
                    }}
                  >
                    {description}
                  </p>
                )}

                {/* Metrics grid */}
                {metrics.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${Math.min(metrics.length, 3)}, 1fr)`,
                      gap: 24,
                      marginBottom: 24,
                    }}
                  >
                    {metrics.map((m, mi) => (
                      <div
                        key={mi}
                        style={{
                          padding: "16px 0",
                          borderTop: `1px solid ${isDark ? "rgba(58,107,138,0.3)" : "rgba(27,43,58,0.12)"}`,
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "2px",
                            color: labelColor,
                            marginBottom: 8,
                          }}
                        >
                          {m.label}
                        </p>
                        <p
                          style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "2.4rem",
                            fontWeight: 300,
                            color: textColor,
                            lineHeight: 1.1,
                          }}
                        >
                          {m.value}
                        </p>
                        {m.target && (
                          <>
                            <p
                              style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.75rem",
                                color: mutedColor,
                                marginTop: 6,
                                marginBottom: 6,
                              }}
                            >
                              Target: {m.target}
                            </p>
                            {isDark ? (
                              <ProgressBar value={m.value} target={m.target} />
                            ) : (
                              <ProgressBarLight value={m.value} target={m.target} />
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Barriers */}
                {prog.barriers && (
                  <div style={{ marginBottom: 16 }}>
                    <p
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        color: labelColor,
                        marginBottom: 6,
                      }}
                    >
                      Challenges
                    </p>
                    <p
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.875rem",
                        color: mutedColor,
                        lineHeight: 1.5,
                      }}
                    >
                      {prog.barriers}
                    </p>
                  </div>
                )}

                {/* Client voice quote */}
                {prog.quote && (
                  <blockquote
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "1.4rem",
                      fontWeight: 300,
                      fontStyle: "italic",
                      color: "#E9C03A",
                      borderLeft: "3px solid #E9C03A",
                      paddingLeft: 20,
                      marginTop: 24,
                      marginBottom: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    &ldquo;{prog.quote.text}&rdquo;
                    <span
                      style={{
                        display: "block",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 400,
                        fontStyle: "normal",
                        color: mutedColor,
                        marginTop: 8,
                        letterSpacing: "1px",
                      }}
                    >
                      — {prog.quote.attribution}
                    </span>
                  </blockquote>
                )}
              </div>
            </section>
          );
        })}

        {/* ── SECTION 4: CEO MESSAGE (dark) ── */}
        {org.ceo_message && (
          <CeoMessageSection
            ceoMessage={org.ceo_message}
            ceoName={org.ceo_name ?? undefined}
            ceoTitle={org.ceo_title ?? undefined}
            ceoPhotoUrl={org.ceo_photo_url ?? undefined}
          />
        )}

        {/* ── SECTION 5: FOOTER (dark) ── */}
        <section
          style={{
            backgroundColor: "#1B2B3A",
            padding: "48px 40px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.7rem",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: "rgba(255,255,255,0.3)",
              marginBottom: 12,
            }}
          >
            Powered by Candela
          </p>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.2rem",
              fontWeight: 600,
              color: "#EDE8DE",
              marginBottom: 8,
            }}
          >
            {org.name} &mdash; {period_label}
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Printed {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </section>
      </div>
    </>
  );
}
