import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LogicModelData } from "@/components/grant-suite/LogicModelGrid";
import { COLUMNS } from "@/components/grant-suite/LogicModelGrid";
import type { EvaluationPlan } from "@/components/grant-suite/EvaluationPanel";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
  searchParams: { sections?: string };
}

function getPercentColor(pct: number): string {
  if (pct >= 90) return "#16a34a";
  if (pct >= 70) return "#d97706";
  return "#dc2626";
}

export default async function PrintPage({ params, searchParams }: PageProps) {
  const supabase = createClient();

  const { data: model, error } = await supabase
    .from("logic_models")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !model) notFound();

  const data = model.data as LogicModelData & Record<string, string>;
  const evaluationPlans = (model.evaluation_plans ?? {}) as Record<string, EvaluationPlan>;
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Candela";

  const { data: reportingRows } = await supabase
    .from("reporting_data")
    .select("*")
    .eq("logic_model_id", model.id)
    .order("updated_at", { ascending: false });

  const sections = (searchParams.sections ?? "lm,eval,reporting").split(",");
  const showLm = sections.includes("lm");
  const showEval = sections.includes("eval") && Object.keys(evaluationPlans).length > 0;
  const showReporting = sections.includes("reporting") && (reportingRows ?? []).length > 0;

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Group reporting by card_key (most recent per card)
  const reportingByCard: Record<string, typeof reportingRows extends (infer T)[] | null ? T : never> = {};
  for (const row of reportingRows ?? []) {
    if (!reportingByCard[row.card_key]) {
      reportingByCard[row.card_key] = row;
    }
  }

  return (
    <div
      style={{ fontFamily: "var(--font-jost), system-ui, sans-serif", color: "#1B2B3A" }}
    >
      {/* Auto-print on load */}
      <PrintTrigger />

      {/* ── Page 1: Logic Model ───────────────────────────────────── */}
      {showLm && (
        <div className={showEval || showReporting ? "break-after-page" : ""}>
          <PageHeader
            programName={model.program_name}
            orgName={model.org_name}
            vertical={model.vertical}
            label="Logic Model"
            date={today}
          />

          {/* Grid */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            {COLUMNS.map((col) => {
              const items = data[col.key] as unknown[];
              if (!Array.isArray(items)) return null;
              return (
                <div key={col.key} style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      backgroundColor: col.headerBg,
                      color: "white",
                      padding: "6px 10px",
                      borderRadius: "4px 4px 0 0",
                      fontSize: "9px",
                      fontFamily: "var(--font-dm-mono), monospace",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                    }}
                  >
                    {col.label}
                  </div>
                  <div
                    style={{
                      backgroundColor: col.bodyBg,
                      borderRadius: "0 0 4px 4px",
                      padding: "6px",
                      minHeight: "80px",
                    }}
                  >
                    {items.map((item, i) => {
                      const it = item as Record<string, string>;
                      return (
                        <div
                          key={i}
                          style={{
                            borderLeft: `3px solid ${col.accent}`,
                            backgroundColor: "white",
                            borderRadius: "4px",
                            padding: "6px 8px",
                            marginBottom: "4px",
                          }}
                        >
                          {it.target && (
                            <p
                              style={{
                                fontWeight: 700,
                                fontSize: "13px",
                                color: col.accent,
                                margin: 0,
                                lineHeight: 1.2,
                              }}
                            >
                              {it.target}
                            </p>
                          )}
                          <p style={{ fontWeight: 500, fontSize: "10px", margin: 0, lineHeight: 1.4 }}>
                            {it.title}
                          </p>
                          {(it.detail || it.metric || it.indicator) && (
                            <p style={{ fontSize: "9px", color: "#6b7280", margin: "2px 0 0", lineHeight: 1.3 }}>
                              {it.detail || it.metric || it.indicator}
                            </p>
                          )}
                          {it.timeframe && (
                            <p style={{ fontSize: "9px", color: "#e67e5a", fontStyle: "italic", margin: "2px 0 0" }}>
                              {it.timeframe}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Theory of Change */}
          {data.theoryOfChange && (
            <div style={{ marginTop: "16px", padding: "12px 16px", backgroundColor: "#EDE8DE", borderRadius: "8px" }}>
              <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.14em", color: "#3A6B8A", marginBottom: "6px" }}>
                Theory of Change
              </p>
              <p style={{ fontSize: "11px", lineHeight: 1.6 }}>
                {data.theoryOfChange}
              </p>
            </div>
          )}

          <PageFooter orgName={orgName} label="Page 1 — Logic Model" />
        </div>
      )}

      {/* ── Page 2: Evaluation Plan Summary ───────────────────────── */}
      {showEval && (
        <div className={showReporting ? "break-after-page" : ""}>
          <PageHeader
            programName={model.program_name}
            orgName={model.org_name}
            vertical={model.vertical}
            label="Evaluation Plan Summary"
            date={today}
          />

          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {Object.entries(evaluationPlans).map(([key, plan]) => {
              const [colKey, idxStr] = key.split("_");
              const colConfig = COLUMNS.find((c) => c.key === colKey);
              const items = data[colKey as keyof LogicModelData];
              const cardItem = Array.isArray(items) ? (items[parseInt(idxStr)] as Record<string, string>) : null;

              return (
                <div
                  key={key}
                  style={{ borderLeft: `3px solid ${colConfig?.accent ?? "#1B2B3A"}`, paddingLeft: "12px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <p style={{ fontWeight: 600, fontSize: "13px", margin: 0 }}>
                      {cardItem?.title ?? key}
                    </p>
                    <span
                      style={{
                        fontSize: "8px",
                        fontFamily: "var(--font-dm-mono), monospace",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        padding: "2px 6px",
                        borderRadius: "9999px",
                        color: colConfig?.accent,
                        backgroundColor: `${colConfig?.accent}15`,
                      }}
                    >
                      {colConfig?.label}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: "11px", marginBottom: "8px" }}>
                    <div>
                      <p style={{ fontSize: "9px", fontFamily: "var(--font-dm-mono), monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#3A6B8A", margin: "0 0 2px" }}>Indicator</p>
                      <p style={{ margin: 0 }}>{plan.indicator}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "9px", fontFamily: "var(--font-dm-mono), monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#3A6B8A", margin: "0 0 2px" }}>Frequency</p>
                      <p style={{ margin: 0 }}>{plan.frequency}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "9px", fontFamily: "var(--font-dm-mono), monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#3A6B8A", margin: "0 0 2px" }}>Data Source</p>
                      <p style={{ margin: 0 }}>{plan.dataSource}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "9px", fontFamily: "var(--font-dm-mono), monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#3A6B8A", margin: "0 0 2px" }}>Responsible Party</p>
                      <p style={{ margin: 0 }}>{plan.responsibleParty}</p>
                    </div>
                  </div>

                  {plan.collectionMethods?.length > 0 && (
                    <div style={{ fontSize: "10px", marginBottom: "8px" }}>
                      <p style={{ fontSize: "9px", fontFamily: "var(--font-dm-mono), monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#3A6B8A", margin: "0 0 4px" }}>Collection Methods</p>
                      {plan.collectionMethods.map((m, i) => (
                        <span key={i} style={{ marginRight: "8px" }}>
                          {m.icon} {m.name}
                          {i < plan.collectionMethods.length - 1 ? " ·" : ""}
                        </span>
                      ))}
                    </div>
                  )}

                  {plan.funderLanguage && (
                    <div style={{ backgroundColor: "#EDE8DE", borderRadius: "6px", padding: "8px 10px", fontSize: "10px", lineHeight: 1.6, fontStyle: "italic" }}>
                      {plan.funderLanguage}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <PageFooter orgName={orgName} label="Page 2 — Evaluation Plan Summary" />
        </div>
      )}

      {/* ── Page 3: Reporting Summary ──────────────────────────────── */}
      {showReporting && (
        <div>
          <PageHeader
            programName={model.program_name}
            orgName={model.org_name}
            vertical={model.vertical}
            label={`Program Performance${reportingByCard[Object.keys(reportingByCard)[0]]?.reporting_period ? ` — ${reportingByCard[Object.keys(reportingByCard)[0]].reporting_period}` : ""}`}
            date={today}
          />

          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {Object.entries(reportingByCard).map(([cardKey, row]) => {
              const [colKey, idxStr] = cardKey.split("_");
              const colConfig = COLUMNS.find((c) => c.key === colKey);
              const items = data[colKey as keyof LogicModelData];
              const cardItem = Array.isArray(items) ? (items[parseInt(idxStr)] as Record<string, string>) : null;
              const val = row.current_value ?? 0;
              const tgt = row.target_value ?? 0;
              const pct = tgt > 0 ? Math.round((val / tgt) * 100) : 0;

              return (
                <div
                  key={cardKey}
                  style={{ borderLeft: `3px solid ${colConfig?.accent ?? "#1B2B3A"}`, paddingLeft: "12px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}
                >
                  <p style={{ fontWeight: 600, fontSize: "13px", margin: "0 0 6px" }}>
                    {cardItem?.title ?? cardKey}
                  </p>

                  <div style={{ display: "flex", gap: "16px", fontSize: "11px", marginBottom: "8px" }}>
                    <div>
                      <span style={{ fontSize: "9px", fontFamily: "var(--font-dm-mono), monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af" }}>Current </span>
                      <span style={{ fontWeight: 700, color: colConfig?.accent }}>{val.toLocaleString()}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "9px", fontFamily: "var(--font-dm-mono), monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af" }}>Target </span>
                      <span style={{ fontWeight: 700 }}>{tgt.toLocaleString()}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "9px", fontFamily: "var(--font-dm-mono), monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af" }}>Progress </span>
                      <span style={{ fontWeight: 700, color: getPercentColor(pct) }}>{pct}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: "100%", height: "6px", backgroundColor: "#e5e7eb", borderRadius: "3px", marginBottom: "8px", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", backgroundColor: colConfig?.accent ?? "#3A6B8A", borderRadius: "3px" }} />
                  </div>

                  {row.narrative && (
                    <p style={{ fontSize: "10px", lineHeight: 1.6, color: "#374151" }}>
                      {row.narrative}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <PageFooter orgName={orgName} label="Page 3 — Program Performance" />
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PageHeader({
  programName,
  orgName,
  vertical,
  label,
  date,
}: {
  programName: string;
  orgName?: string;
  vertical?: string;
  label: string;
  date: string;
}) {
  return (
    <>
      <div
        style={{
          backgroundColor: "#1B2B3A",
          color: "white",
          padding: "14px 20px",
          borderRadius: "6px 6px 0 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: "18px", fontWeight: 500, margin: 0 }}>
            {programName}
          </p>
          {(orgName || vertical) && (
            <p style={{ fontSize: "11px", opacity: 0.5, margin: "2px 0 0" }}>
              {[orgName, vertical].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.14em", opacity: 0.6, margin: 0 }}>
            {label}
          </p>
          <p style={{ fontSize: "10px", opacity: 0.4, margin: "2px 0 0" }}>{date}</p>
        </div>
      </div>
      <div style={{ height: "3px", backgroundColor: "#E9C03A" }} />
    </>
  );
}

function PageFooter({ orgName, label }: { orgName: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "20px",
        paddingTop: "8px",
        borderTop: "1px solid #e5e7eb",
        fontSize: "9px",
        color: "#9ca3af",
      }}
    >
      <span>Powered by {orgName}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Print trigger (client component inline) ──────────────────────────────────

function PrintTrigger() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 500); });`,
      }}
    />
  );
}
