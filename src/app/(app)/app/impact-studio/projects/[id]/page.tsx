import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectDetailMode1 from "./ProjectDetailMode1";
import ProjectDetailMode2 from "./ProjectDetailMode2";

interface ProjectRun {
  id: string;
  version_number: number;
  is_latest: boolean;
  theme_id: string;
  created_at: string;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch project
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, project_type, status, created_at, org_id")
    .eq("id", params.id)
    .single();

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p
          className="text-sm text-[#1B2B3A]/40"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          Project not found.
        </p>
      </div>
    );
  }

  // Fetch all runs
  const { data: runs } = await supabase
    .from("project_runs")
    .select("id, version_number, is_latest, theme_id, created_at")
    .eq("project_id", project.id)
    .order("version_number", { ascending: false });

  const allRuns = (runs ?? []) as ProjectRun[];

  // Find latest run
  const latestRun =
    allRuns.find((r) => r.is_latest) ?? allRuns[0] ?? null;

  // Fetch generated_views for latest run
  let outputHtml: string | null = null;
  let outputData: unknown = null;
  let viewType: string | null = null;

  if (latestRun) {
    const { data: view } = await supabase
      .from("generated_views")
      .select("output_html, output_data, view_type")
      .eq("run_id", latestRun.id)
      .limit(1)
      .single();

    if (view) {
      outputHtml = view.output_html ?? null;
      outputData = view.output_data ?? null;
      viewType = view.view_type ?? null;
    }
  }

  // Branch: Mode 1 (narrative/document) vs Mode 2 (interactive)
  const isMode2 =
    project.project_type === "output_generator" ||
    (outputData !== null && outputHtml === null);

  if (isMode2) {
    return (
      <ProjectDetailMode2
        project={project}
        runs={allRuns.map((r) => ({
          id: r.id,
          version_number: r.version_number,
          is_latest: r.is_latest,
          created_at: r.created_at,
        }))}
        viewType={viewType}
        outputData={outputData}
      />
    );
  }

  return (
    <ProjectDetailMode1
      project={project}
      runs={allRuns.map((r) => ({
        id: r.id,
        version_number: r.version_number,
        is_latest: r.is_latest,
        created_at: r.created_at,
      }))}
      initialHtml={outputHtml}
    />
  );
}
