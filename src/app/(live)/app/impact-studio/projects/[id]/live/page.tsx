import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LiveViewClient from "./LiveViewClient";

export default async function LivePage({
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
    .select("id, org_id, project_type")
    .eq("id", params.id)
    .single();

  if (!project) {
    return (
      <div
        style={{
          background: "#1B2B3A",
          color: "#EDE8DE",
          fontFamily: "DM Sans, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100vw",
          height: "100vh",
        }}
      >
        <p>Project not found.</p>
      </div>
    );
  }

  // Fetch latest run
  const { data: latestRun } = await supabase
    .from("project_runs")
    .select("id")
    .eq("project_id", project.id)
    .eq("is_latest", true)
    .single();

  let outputData: unknown = null;
  let viewType: string | null = null;

  if (latestRun) {
    const { data: view } = await supabase
      .from("generated_views")
      .select("output_html, view_type")
      .eq("run_id", latestRun.id)
      .limit(1)
      .single();

    if (view) {
      outputData = view.output_html ?? null;
      viewType = view.view_type ?? null;
    }
  }

  // Fetch brand kit
  const { data: brandKitRow } = await supabase
    .from("brand_kits")
    .select(
      "brand_primary, brand_accent, brand_success, brand_text, logo_url, org_display_name"
    )
    .eq("org_id", project.org_id)
    .single();

  const brandKit = brandKitRow ?? null;

  return (
    <LiveViewClient
      projectId={project.id}
      viewType={viewType}
      outputData={outputData}
      brandKit={brandKit}
    />
  );
}
