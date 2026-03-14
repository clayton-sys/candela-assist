"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGrantsWizard } from "./context/GrantsWizardContext";
import { Plus, ChevronDown, ChevronRight, Clock, Eye, Layers } from "lucide-react";
import ProjectCard from "@/components/grants-reporting-suite/ProjectCard";
import NewProjectModal from "@/components/grants-reporting-suite/NewProjectModal";

interface ProjectRun {
  id: string;
  version_number: number;
  period_label: string | null;
  created_at: string;
  is_latest: boolean;
  view_count: number;
}

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  runs: ProjectRun[];
}

export default function WorkspacePage() {
  const router = useRouter();
  const { setProjectId, setRunId, reset } = useGrantsWizard();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  const fetchProjects = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: orgUser } = await supabase
      .from("org_users")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!orgUser) return;

    const { data: projectsData } = await supabase
      .from("projects")
      .select("id, name, created_at, updated_at")
      .eq("org_id", orgUser.org_id)
      .order("updated_at", { ascending: false });

    if (!projectsData) return;

    const enriched: Project[] = await Promise.all(
      projectsData.map(async (p) => {
        const { data: runs } = await supabase
          .from("project_runs")
          .select("id, version_number, period_label, created_at, is_latest")
          .eq("project_id", p.id)
          .order("version_number", { ascending: false });

        const runsWithViews: ProjectRun[] = await Promise.all(
          (runs ?? []).map(async (r) => {
            const { count } = await supabase
              .from("generated_views")
              .select("id", { count: "exact", head: true })
              .eq("run_id", r.id);
            return { ...r, view_count: count ?? 0 };
          })
        );

        return { ...p, runs: runsWithViews };
      })
    );

    setProjects(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  function handleOpenRun(projectId: string, runId: string) {
    reset();
    setProjectId(projectId);
    setRunId(runId);
    router.push("/app/grants-reporting-suite/input");
  }

  async function handleAddPeriod(projectId: string) {
    const supabase = createClient();

    // Set all existing runs to not latest
    await supabase
      .from("project_runs")
      .update({ is_latest: false })
      .eq("project_id", projectId);

    // Get max version
    const { data: maxRun } = await supabase
      .from("project_runs")
      .select("version_number")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (maxRun?.version_number ?? 0) + 1;

    const { data: newRun } = await supabase
      .from("project_runs")
      .insert({
        project_id: projectId,
        version_number: nextVersion,
        is_latest: true,
      })
      .select("id")
      .single();

    // Update project timestamp
    await supabase
      .from("projects")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", projectId);

    if (newRun) {
      reset();
      setProjectId(projectId);
      setRunId(newRun.id);
      router.push("/app/grants-reporting-suite/input");
    }
  }

  async function handleCreateProject(name: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: orgUser } = await supabase
      .from("org_users")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!orgUser) return;

    const { data: project } = await supabase
      .from("projects")
      .insert({ org_id: orgUser.org_id, name })
      .select("id")
      .single();

    if (!project) return;

    const { data: run } = await supabase
      .from("project_runs")
      .insert({ project_id: project.id, version_number: 1, is_latest: true })
      .select("id")
      .single();

    if (run) {
      reset();
      setProjectId(project.id);
      setRunId(run.id);
      router.push("/app/grants-reporting-suite/input");
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold text-midnight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Workspace
          </h1>
          <p className="text-sm text-midnight/50 mt-1" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Your projects and reporting periods
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cerulean text-white rounded-lg text-sm font-medium hover:bg-cerulean-dark transition-colors"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white/40 rounded-xl border border-midnight/5">
          <Layers className="w-10 h-10 text-midnight/15 mx-auto mb-3" />
          <p className="text-midnight/40 text-sm" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            No projects yet. Create your first one to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpenRun={handleOpenRun}
              onAddPeriod={handleAddPeriod}
            />
          ))}
        </div>
      )}

      {showNewModal && (
        <NewProjectModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  );
}
