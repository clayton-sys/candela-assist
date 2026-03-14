import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import Link from "next/link";

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
  population?: string;
  vertical?: string;
  [key: string]: unknown;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: model } = await supabase
    .from("logic_models")
    .select("program_name, org_name, data, slug")
    .eq("slug", params.slug)
    .single();

  if (!model) return { title: "Logic Model" };

  const data = model.data as { theoryOfChange?: string };
  const firstSentence = data.theoryOfChange?.split(/[.!?]/)[0] ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://candela.education";
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Candela";

  return {
    title: `${model.program_name} — Logic Model`,
    description: firstSentence,
    openGraph: {
      title: model.program_name,
      description: firstSentence,
      type: "website",
      siteName: `${orgName} Grants & Reporting Suite`,
      url: `${appUrl}/lm/${model.slug}`,
    },
    twitter: { card: "summary" },
  };
}

const COLUMNS = [
  { key: "inputs" as const, label: "Inputs", headerBg: "#185FA5", bodyBg: "#f0f7ff" },
  { key: "activities" as const, label: "Activities", headerBg: "#0F6E56", bodyBg: "#eafaf3" },
  { key: "outputs" as const, label: "Outputs", headerBg: "#854F0B", bodyBg: "#fff7eb" },
  { key: "shortTermOutcomes" as const, label: "Short-Term Outcomes", headerBg: "#3C3489", bodyBg: "#f3f2fe" },
  { key: "longTermOutcomes" as const, label: "Long-Term Outcomes", headerBg: "#993C1D", bodyBg: "#fff0eb" },
];

export default async function PublicLogicModelPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: model, error } = await supabase
    .from("logic_models")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !model) notFound();

  const data = model.data as LogicModelData;

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-jost), system-ui, sans-serif" }}>
      <PublicNav variant="logic-model" />

      {/* Program header */}
      <header className="bg-midnight border-b border-gold/20">
        <div className="px-6 py-3 flex items-center gap-3">
          <span className="font-mono text-[10px] text-gold/60 uppercase tracking-[0.18em]">
            Grants &amp; Reporting Suite
          </span>
          <span className="text-stone/20 hidden sm:block">|</span>
          <div className="hidden sm:block">
            <p className="font-fraunces text-stone text-[18px] leading-none">{model.program_name}</p>
            {(model.org_name || model.vertical) && (
              <p className="font-jost text-xs text-stone/50 mt-0.5">
                {[model.org_name, model.vertical].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="h-[3px] bg-gold" />

      {/* Logic model grid */}
      <div className="flex-1 bg-stone p-6">
        {data.theoryOfChange && (
          <div className="max-w-4xl mx-auto mb-6 bg-white border border-midnight/5 rounded-xl p-4">
            <h2 className="font-fraunces text-sm font-semibold text-midnight mb-2">Theory of Change</h2>
            <p className="text-sm text-midnight/60 font-jost leading-relaxed">{data.theoryOfChange}</p>
          </div>
        )}

        <div className="max-w-6xl mx-auto grid grid-cols-5 gap-3">
          {COLUMNS.map((col) => {
            const items = (data[col.key] as Array<Record<string, string>>) ?? [];
            return (
              <div key={col.key} className="rounded-xl overflow-hidden border border-black/5">
                <div className="px-3 py-2 text-white text-xs font-semibold" style={{ backgroundColor: col.headerBg }}>
                  {col.label}
                </div>
                <div className="p-2 space-y-1.5" style={{ backgroundColor: col.bodyBg }}>
                  {items.map((item, i) => (
                    <div key={i} className="bg-white rounded-lg p-2.5 border border-black/5">
                      <p className="text-xs font-semibold text-midnight">{item.title}</p>
                      <p className="text-[11px] text-midnight/50 mt-0.5">
                        {item.detail || item.metric || item.indicator}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-stone px-4 sm:px-8 pb-8">
        <div className="max-w-3xl mx-auto bg-white border border-[#d4cfc6] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-fraunces text-base text-midnight">
            Want a logic model like this for your organization?
          </p>
          <Link href="/pricing" className="font-jost text-sm font-medium text-cerulean hover:text-cerulean-dark transition-colors">
            Learn more &rarr;
          </Link>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
