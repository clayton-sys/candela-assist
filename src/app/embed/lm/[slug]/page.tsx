import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

interface LogicModelData {
  inputs?: Array<{ title: string; detail: string }>;
  activities?: Array<{ title: string; detail: string }>;
  outputs?: Array<{ title: string; metric: string; target: string }>;
  shortTermOutcomes?: Array<{ title: string; indicator: string; timeframe: string }>;
  longTermOutcomes?: Array<{ title: string; indicator: string; timeframe: string }>;
  theoryOfChange?: string;
  programName?: string;
  [key: string]: unknown;
}

export default async function EmbedLogicModelPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: model, error } = await supabase
    .from("logic_models")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !model) notFound();

  const data = model.data as LogicModelData;
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Candela";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://candela.education";

  const columns = [
    { key: "inputs" as const, label: "Inputs", color: "#185FA5" },
    { key: "activities" as const, label: "Activities", color: "#0F6E56" },
    { key: "outputs" as const, label: "Outputs", color: "#854F0B" },
    { key: "shortTermOutcomes" as const, label: "Short-Term Outcomes", color: "#3C3489" },
    { key: "longTermOutcomes" as const, label: "Long-Term Outcomes", color: "#993C1D" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, color: "#1B2B3A", marginBottom: 16 }}>
        {data.programName ?? model.program_name}
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
        {columns.map((col) => {
          const items = (data[col.key] as Array<Record<string, string>>) ?? [];
          return (
            <div key={col.key}>
              <div style={{ backgroundColor: col.color, color: "#fff", padding: "8px 12px", borderRadius: "8px 8px 0 0", fontSize: 12, fontWeight: 600 }}>
                {col.label}
              </div>
              <div style={{ border: `1px solid ${col.color}20`, borderTop: "none", borderRadius: "0 0 8px 8px", padding: 8 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#1B2B3A", padding: "4px 0", borderBottom: i < items.length - 1 ? "1px solid #EDE8DE" : "none" }}>
                    <strong>{item.title}</strong>
                    <br />
                    <span style={{ opacity: 0.6 }}>{item.detail || item.metric || item.indicator}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ textAlign: "right", marginTop: 8 }}>
        <a href={appUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#9ca3af" }}>
          Powered by {orgName}
        </a>
      </div>
    </div>
  );
}
