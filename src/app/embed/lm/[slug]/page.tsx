import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LogicModelData } from "@/components/grant-suite/LogicModelGrid";
import LogicModelHub from "@/components/grant-suite/LogicModelHub";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export default async function EmbedLogicModelPage({ params }: PageProps) {
  const supabase = createClient();

  const { data: model, error } = await supabase
    .from("logic_models")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !model) notFound();

  const data = model.data as LogicModelData & Record<string, string>;
  const evaluationPlans = (model.evaluation_plans as Record<string, never>) ?? {};

  const { data: reportingRows } = await supabase
    .from("reporting_data")
    .select("*")
    .eq("logic_model_id", model.id)
    .order("updated_at", { ascending: false });

  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Candela";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://candela.education";

  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      style={{
        fontFamily: "var(--font-jost), system-ui, sans-serif",
        minWidth: "320px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div className="flex-1">
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
          embed
        />
      </div>

      {/* Powered-by badge */}
      <div className="flex-shrink-0 px-4 py-2 text-right">
        <a
          href={appUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-jost text-[10px] text-[#9ca3af] hover:text-[#6b7280] transition-colors"
        >
          Powered by {orgName}
        </a>
      </div>
    </div>
  );
}
