import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { LogicModelData } from "@/components/grant-suite/LogicModelGrid";
import LogicModelHub from "@/components/grant-suite/LogicModelHub";
import ShareDropdown from "@/components/grant-suite/ShareDropdown";
import PresentationMode from "@/components/grant-suite/PresentationMode";
import LiveDataBadge from "@/components/grant-suite/LiveDataBadge";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import Link from "next/link";

interface PageProps {
  params: { slug: string };
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
      siteName: `${orgName} Grant Suite`,
      url: `${appUrl}/lm/${model.slug}`,
    },
    twitter: {
      card: "summary",
    },
  };
}

export default async function PublicLogicModelPage({ params }: PageProps) {
  const supabase = createClient();

  const { data: model, error } = await supabase
    .from("logic_models")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !model) {
    notFound();
  }

  const data = model.data as LogicModelData & Record<string, string>;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://candela.education";
  const shareUrl = `${appUrl}/lm/${model.slug}`;
  const evaluationPlans = (model.evaluation_plans as Record<string, never>) ?? {};

  // Fetch reporting data (public read via RLS policy)
  const { data: reportingRows } = await supabase
    .from("reporting_data")
    .select("*")
    .eq("logic_model_id", model.id)
    .order("updated_at", { ascending: false });

  // Compute live data badge metrics
  const latestReporting = reportingRows?.[0];
  const liveMetrics: Array<{ label: string; value: string }> = [];
  if (reportingRows && reportingRows.length > 0) {
    const seen = new Set<string>();
    for (const row of reportingRows) {
      const rd = row.data as Record<string, unknown> | null;
      if (rd && typeof rd === "object") {
        const metrics = rd.metrics as Array<{ label: string; value: string | number }> | undefined;
        if (Array.isArray(metrics)) {
          for (const m of metrics) {
            if (!seen.has(m.label) && liveMetrics.length < 4) {
              seen.add(m.label);
              liveMetrics.push({ label: m.label, value: String(m.value) });
            }
          }
        }
      }
    }
  }

  return (
    <PresentationMode
      programName={model.program_name}
      orgName={model.org_name}
    >
      <div
        className="min-h-screen flex flex-col"
        style={{ fontFamily: "var(--font-jost), system-ui, sans-serif" }}
      >
        {/* ── Site nav ── */}
        <PublicNav variant="logic-model" />

        {/* ── Program info sub-header ── */}
        <header className="flex-shrink-0 bg-midnight border-b border-gold/20 print-hidden">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-[10px] text-gold/60 uppercase tracking-[0.18em] flex-shrink-0">
                Grant Suite
              </span>
              <span className="text-stone/20 hidden sm:block">|</span>
              <div className="hidden sm:block min-w-0">
                <p className="font-fraunces text-stone text-[18px] leading-none truncate max-w-xs">
                  {model.program_name}
                </p>
                {(model.org_name || model.vertical) && (
                  <p className="font-jost text-xs text-stone/50 mt-0.5">
                    {[model.org_name, model.vertical].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {latestReporting && (
                <div className="hidden sm:block">
                  <LiveDataBadge
                    lastUpdated={latestReporting.updated_at}
                    metrics={liveMetrics}
                  />
                </div>
              )}
              <ShareDropdown
                shareUrl={shareUrl}
                slug={model.slug}
                variant="public"
              />
            </div>
          </div>
        </header>

        {/* 3px gold line */}
        <div className="h-[3px] bg-gold flex-shrink-0" />

        {/* Program title on mobile */}
        <div className="sm:hidden px-6 py-4 bg-midnight border-b border-stone/10 print-hidden">
          <p className="font-fraunces text-stone text-[18px] leading-none">
            {model.program_name}
          </p>
          {(model.org_name || model.vertical) && (
            <p className="font-jost text-xs text-stone/50 mt-0.5">
              {[model.org_name, model.vertical].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {/* ── Exportable content ── */}
        <div id="export-target" className="flex-1 bg-stone pb-6">
          <LogicModelHub
            data={data}
            logicModelId={model.id}
            initialEvaluationPlans={evaluationPlans}
            initialReportingData={reportingRows ?? []}
            programContext={{
              programName: data.programName ?? model.program_name,
              vertical: data.vertical ?? model.vertical ?? "",
              population: data.population ?? "",
              theoryOfChange: data.theoryOfChange ?? "",
            }}
            readOnly
          />
        </div>

        {/* ── Conversion banner ── */}
        <div className="bg-stone px-4 sm:px-8 pb-8 print-hidden">
          <div className="max-w-3xl mx-auto bg-white border border-[#d4cfc6] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="font-fraunces text-base text-midnight">
              Want a logic model like this for your organization?
            </p>
            <Link
              href="/pricing"
              className="font-jost text-sm font-medium text-cerulean hover:text-cerulean-dark transition-colors flex-shrink-0"
            >
              Learn more &rarr;
            </Link>
          </div>
        </div>

        {/* ── Footer ── */}
        <PublicFooter />
      </div>
    </PresentationMode>
  );
}
