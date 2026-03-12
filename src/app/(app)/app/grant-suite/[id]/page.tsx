import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LogicModelData } from "@/components/grant-suite/LogicModelGrid";
import LogicModelHub from "@/components/grant-suite/LogicModelHub";
import ExportOptionsModal from "@/components/grant-suite/ExportOptionsModal";
import ShareDropdownWrapper from "./ShareDropdownWrapper";
import Breadcrumbs from "@/components/grant-suite/Breadcrumbs";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function LogicModelHubPage({ params }: PageProps) {
  const supabase = createClient();

  const { data: model, error } = await supabase
    .from("logic_models")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !model) {
    notFound();
  }

  const data = model.data as LogicModelData & {
    programName: string;
    orgName: string;
    vertical: string;
    population: string;
    activities: string;
    inputs: string;
    outcomes: string;
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://candela.education";
  const logoUrl = process.env.NEXT_PUBLIC_ORG_LOGO_URL || "/candela-logo-primary.svg";
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Candela";
  const shareUrl = `${appUrl}/lm/${model.slug}`;

  // Edit params — pre-populate intake form
  const editParams = new URLSearchParams({
    programName: data.programName ?? model.program_name ?? "",
    orgName: data.orgName ?? model.org_name ?? "",
    population: data.population ?? "",
    vertical: data.vertical ?? model.vertical ?? "",
    activities: data.activities ?? "",
    inputs: data.inputs ?? "",
    outcomes: data.outcomes ?? "",
    editId: model.id,
  });

  const evaluationPlans = (model.evaluation_plans as Record<string, unknown>) ?? {};
  const hasEvaluationPlans = Object.keys(evaluationPlans).length > 0;

  // Fetch reporting data for this logic model
  const { data: reportingRows } = await supabase
    .from("reporting_data")
    .select("*")
    .eq("logic_model_id", model.id)
    .order("updated_at", { ascending: false });

  const hasReportingData = (reportingRows ?? []).length > 0;

  return (
    <div className="min-h-full flex flex-col">
      {/* ── Hub header ─────────────────────────────────────────────────────── */}
      <div className="print-hidden flex-shrink-0 bg-midnight border-b border-gold/20">
        <div className="px-6 py-4 flex flex-wrap items-center gap-4">
          {/* Logo + product label */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Image
              src={logoUrl}
              alt={orgName}
              width={22}
              height={22}
            />
            <span className="font-mono text-[10px] text-gold/60 uppercase tracking-[0.18em]">
              Grant Suite
            </span>
          </div>

          {/* Divider */}
          <span className="text-stone/20 hidden sm:block">|</span>

          {/* Program info */}
          <div className="flex-1 min-w-0">
            <Breadcrumbs
              items={[
                { label: "Grant Suite", href: "/app/grant-suite" },
                { label: model.program_name },
              ]}
            />
            <p className="font-fraunces text-stone text-[20px] leading-none truncate mt-0.5">
              {model.program_name}
            </p>
            {(model.org_name || model.vertical) && (
              <p className="font-jost text-xs text-stone/50 mt-0.5">
                {[model.org_name, model.vertical].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 print-hidden">
            <ShareDropdownWrapper
              shareUrl={shareUrl}
              slug={model.slug}
              programName={model.program_name}
            />
            <ExportOptionsModal
              logicModelId={model.id}
              programName={model.program_name}
              hasEvaluationPlans={hasEvaluationPlans}
              hasReportingData={hasReportingData}
            />
            <Link
              href={`/app/grant-suite/new?${editParams.toString()}`}
              className="hidden sm:inline-flex items-center gap-1.5 font-jost font-semibold text-xs text-stone/70 hover:text-stone border border-stone/20 hover:border-stone/40 px-3 py-2 rounded-lg transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* 3px Solar Gold line */}
      <div className="h-[3px] bg-gold flex-shrink-0" />

      {/* ── Exportable section ─────────────────────────────────────────────── */}
      <div id="export-target" className="flex-1 bg-stone pb-6">
        <LogicModelHub
          data={data}
          logicModelId={model.id}
          initialEvaluationPlans={evaluationPlans as Record<string, never>}
          initialReportingData={reportingRows ?? []}
          programContext={{
            programName: data.programName ?? model.program_name,
            vertical: data.vertical ?? model.vertical ?? "",
            population: data.population ?? "",
            theoryOfChange: data.theoryOfChange ?? "",
          }}
        />
      </div>

      {/* ── App footer ─────────────────────────────────────────────────────── */}
      <div className="print-hidden flex-shrink-0 bg-midnight border-t border-stone/5 px-6 py-3">
        <p className="font-jost text-xs text-stone/25">
          {orgName} ·{" "}
          {process.env.NEXT_PUBLIC_APP_TITLE ?? "Candela Assist"}
        </p>
      </div>
    </div>
  );
}
