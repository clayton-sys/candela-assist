"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGrantsWizard } from "./context/GrantsWizardContext";
import {
  Plus,
  LayoutGrid,
  List,
  Layers,
  ChevronDown,
  ChevronRight,
  Search,
  Database,
  Loader2,
} from "lucide-react";
import ProjectCard from "@/components/impact-studio/ProjectCard";
import type { Project } from "@/components/impact-studio/ProjectCard";
import NewProjectModal from "@/components/impact-studio/NewProjectModal";

type SortKey = "updated_at" | "status" | "funder_name" | "program_name";
type StatusFilter = "all" | "in_progress" | "waiting" | "ready" | "complete";
type TypeFilter = "all" | "output_generator" | "funder_format";

const STATUS_ORDER: Record<string, number> = {
  ready: 0,
  in_progress: 1,
  waiting: 2,
  complete: 3,
};

export default function WorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // GrantsWizard context available via layout
  useGrantsWizard();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortKey>("updated_at");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);

  // Tab switcher
  const [activeTab, setActiveTab] = useState<"projects" | "data">("projects");

  // Data tab state
  interface DataEntry {
    id: string;
    period_label: string | null;
    created_at: string;
    program_name: string | null;
  }
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const fetchDataEntries = useCallback(async () => {
    setLoadingData(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgUser } = await supabase
        .from("org_users")
        .select("org_id")
        .eq("user_id", user.id)
        .single();
      if (!orgUser) return;

      const { data: entries } = await supabase
        .from("program_data")
        .select("id, period_label, created_at, program:programs(name)")
        .eq("org_id", orgUser.org_id)
        .order("created_at", { ascending: false });

      setDataEntries(
        (entries ?? []).map((e: Record<string, unknown>) => ({
          id: e.id as string,
          period_label: e.period_label as string | null,
          created_at: e.created_at as string,
          program_name: (e.program as { name: string } | null)?.name ?? null,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch data entries:", err);
    } finally {
      setLoadingData(false);
      setDataLoaded(true);
    }
  }, []);

  // Fetch data entries when Data tab is first activated
  useEffect(() => {
    if (activeTab === "data" && !dataLoaded) {
      fetchDataEntries();
    }
  }, [activeTab, dataLoaded, fetchDataEntries]);

  const fetchProjects = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgUser } = await supabase
        .from("org_users")
        .select("org_id")
        .eq("user_id", user.id)
        .single();

      if (!orgUser) return;

      // Fetch projects with program join
      const { data: projectsData } = await supabase
        .from("projects")
        .select(
          "id, name, org_id, program_id, project_type, status, blocking_message, created_by, created_at, updated_at"
        )
        .eq("org_id", orgUser.org_id)
        .order("updated_at", { ascending: false });

      if (!projectsData) return;

      // Fetch programs for this org
      const { data: programs } = await supabase
        .from("programs")
        .select("id, name")
        .eq("org_id", orgUser.org_id);

      const programMap = new Map<string, string>();
      (programs ?? []).forEach((p) => programMap.set(p.id, p.name));

      // Get view counts per project (via project_runs -> generated_views)
      const projectIds = projectsData.map((p) => p.id);
      const { data: runs } = await supabase
        .from("project_runs")
        .select("id, project_id")
        .in("project_id", projectIds.length > 0 ? projectIds : ["__none__"]);

      const runIds = (runs ?? []).map((r) => r.id);
      let viewCountMap = new Map<string, number>();

      if (runIds.length > 0) {
        const { data: views } = await supabase
          .from("generated_views")
          .select("id, run_id")
          .in("run_id", runIds);

        // Map run_id -> project_id
        const runToProject = new Map<string, string>();
        (runs ?? []).forEach((r) => runToProject.set(r.id, r.project_id));

        (views ?? []).forEach((v) => {
          const pid = runToProject.get(v.run_id);
          if (pid) {
            viewCountMap.set(pid, (viewCountMap.get(pid) ?? 0) + 1);
          }
        });
      }

      const enriched: Project[] = projectsData.map((p) => ({
        id: p.id,
        name: p.name,
        org_id: p.org_id,
        program_id: p.program_id ?? null,
        program_name: p.program_id ? programMap.get(p.program_id) ?? null : null,
        funder_name: null,
        project_type: p.project_type ?? "output_generator",
        status: p.status ?? "in_progress",
        blocking_message: p.blocking_message ?? null,
        period_label: null,
        created_by: p.created_by ?? null,
        created_by_name: null,
        created_at: p.created_at,
        updated_at: p.updated_at,
        view_count: viewCountMap.get(p.id) ?? 0,
      }));

      setProjects(enriched);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Auto-open modal from sidebar "New Project" button via ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowNewModal(true);
      router.replace("/app/impact-studio", { scroll: false });
    }
  }, [searchParams, router]);

  // Derived data
  const allPrograms = useMemo(() => {
    const names = new Set<string>();
    projects.forEach((p) => {
      if (p.program_name) names.add(p.program_name);
    });
    return Array.from(names).sort();
  }, [projects]);

  const { activeProjects, archivedProjects } = useMemo(() => {
    let filtered = projects;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.funder_name && p.funder_name.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((p) => p.project_type === typeFilter);
    }

    // Program filter
    if (programFilter !== "all") {
      filtered = filtered.filter((p) => p.program_name === programFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "updated_at":
          return (
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
          );
        case "status":
          return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        case "funder_name":
          return (a.funder_name ?? "").localeCompare(b.funder_name ?? "");
        case "program_name":
          return (a.program_name ?? "").localeCompare(b.program_name ?? "");
        default:
          return 0;
      }
    });

    const active = sorted.filter((p) => p.status !== "complete");
    const archived = sorted.filter((p) => p.status === "complete");
    return { activeProjects: active, archivedProjects: archived };
  }, [projects, searchQuery, statusFilter, typeFilter, programFilter, sortBy]);

  // Group active projects by program
  const groupedProjects = useMemo(() => {
    const groups = new Map<string, Project[]>();
    activeProjects.forEach((p) => {
      const key = p.program_name ?? "Unassigned";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });
    return groups;
  }, [activeProjects]);

  function handleProjectClick(project: Project) {
    router.push(`/app/impact-studio/projects/${project.id}`);
  }

  function handleViewStripClick(project: Project) {
    console.log("View strip clicked for project:", project.id, project.name);
  }

  async function handleProjectCreated() {
    await fetchProjects();
  }

  const dmSans = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;
  const cormorant = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  } as const;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold text-[#1B2B3A]"
            style={cormorant}
          >
            Workspace
          </h1>
          <p className="text-sm text-[#1B2B3A]/50 mt-1" style={dmSans}>
            Your projects and reporting periods
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-6 bg-[#1B2B3A]/[0.03] rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "projects"
              ? "bg-white text-[#1B2B3A] shadow-sm"
              : "text-[#1B2B3A]/40 hover:text-[#1B2B3A]/60"
          }`}
          style={dmSans}
        >
          Projects
        </button>
        <button
          onClick={() => setActiveTab("data")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "data"
              ? "bg-white text-[#1B2B3A] shadow-sm"
              : "text-[#1B2B3A]/40 hover:text-[#1B2B3A]/60"
          }`}
          style={dmSans}
        >
          Data
        </button>
      </div>

      {/* ═══ PROJECTS TAB ═══ */}
      {activeTab === "projects" && (
        <>
      {/* Projects header */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#3A6B8A] text-white rounded-lg text-sm font-medium hover:bg-[#2A5570] transition-colors"
          style={dmSans}
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1B2B3A]/30" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#1B2B3A]/10 rounded-lg text-sm text-[#1B2B3A] placeholder:text-[#1B2B3A]/25 focus:outline-none focus:ring-2 focus:ring-[#3A6B8A]/30 focus:border-[#3A6B8A]"
            style={dmSans}
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="px-3 py-2 border border-[#1B2B3A]/10 rounded-lg text-sm text-[#1B2B3A]/70 bg-white focus:outline-none focus:ring-2 focus:ring-[#3A6B8A]/30"
          style={dmSans}
        >
          <option value="updated_at">Last Touched</option>
          <option value="status">Status</option>
          <option value="funder_name">Funder Name</option>
          <option value="program_name">Program</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 border border-[#1B2B3A]/10 rounded-lg text-sm text-[#1B2B3A]/70 bg-white focus:outline-none focus:ring-2 focus:ring-[#3A6B8A]/30"
          style={dmSans}
        >
          <option value="all">All Statuses</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting">Waiting</option>
          <option value="ready">Ready to Generate</option>
          <option value="complete">Complete</option>
        </select>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="px-3 py-2 border border-[#1B2B3A]/10 rounded-lg text-sm text-[#1B2B3A]/70 bg-white focus:outline-none focus:ring-2 focus:ring-[#3A6B8A]/30"
          style={dmSans}
        >
          <option value="all">All Types</option>
          <option value="output_generator">Output Generator</option>
          <option value="funder_format">Funder Format</option>
        </select>

        {/* Program filter */}
        {allPrograms.length > 0 && (
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="px-3 py-2 border border-[#1B2B3A]/10 rounded-lg text-sm text-[#1B2B3A]/70 bg-white focus:outline-none focus:ring-2 focus:ring-[#3A6B8A]/30"
            style={dmSans}
          >
            <option value="all">All Programs</option>
            {allPrograms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}

        {/* View mode toggle */}
        <div className="flex items-center border border-[#1B2B3A]/10 rounded-lg overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 transition-colors ${
              viewMode === "grid"
                ? "bg-[#3A6B8A] text-white"
                : "bg-white text-[#1B2B3A]/40 hover:text-[#1B2B3A]/70"
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors ${
              viewMode === "list"
                ? "bg-[#3A6B8A] text-white"
                : "bg-white text-[#1B2B3A]/40 hover:text-[#1B2B3A]/70"
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`bg-white/50 rounded-xl animate-pulse ${
                viewMode === "grid" ? "h-48" : "h-16"
              }`}
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white/40 rounded-xl border border-[#1B2B3A]/5">
          <Layers className="w-10 h-10 text-[#1B2B3A]/15 mx-auto mb-3" />
          <p className="text-[#1B2B3A]/40 text-sm" style={dmSans}>
            No projects yet. Create your first one to get started.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="mt-4 px-4 py-2 bg-[#3A6B8A] text-white rounded-lg text-sm font-medium hover:bg-[#2A5570] transition-colors"
            style={dmSans}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            New Project
          </button>
        </div>
      ) : activeProjects.length === 0 && archivedProjects.length === 0 ? (
        <div className="text-center py-16 bg-white/40 rounded-xl border border-[#1B2B3A]/5">
          <Search className="w-8 h-8 text-[#1B2B3A]/15 mx-auto mb-3" />
          <p className="text-[#1B2B3A]/40 text-sm" style={dmSans}>
            No projects match your filters.
          </p>
        </div>
      ) : (
        <>
          {/* Active projects grouped by program */}
          {Array.from(groupedProjects.entries()).map(
            ([programName, programProjects]) => (
              <div key={programName} className="mb-8">
                <h2
                  className="text-sm font-medium text-[#1B2B3A]/40 uppercase tracking-wider mb-3 px-1"
                  style={dmSans}
                >
                  {programName}
                </h2>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      : "space-y-2"
                  }
                >
                  {programProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={handleProjectClick}
                      onViewStripClick={handleViewStripClick}
                      variant={viewMode}
                    />
                  ))}
                </div>
              </div>
            )
          )}

          {/* Archived / Complete */}
          {archivedProjects.length > 0 && (
            <div className="mt-8 border-t border-[#1B2B3A]/5 pt-6">
              <button
                onClick={() => setArchiveOpen(!archiveOpen)}
                className="flex items-center gap-2 text-sm font-medium text-[#1B2B3A]/40 hover:text-[#1B2B3A]/60 transition-colors mb-4"
                style={dmSans}
              >
                {archiveOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                Completed ({archivedProjects.length})
              </button>
              {archiveOpen && (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      : "space-y-2"
                  }
                >
                  {archivedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={handleProjectClick}
                      onViewStripClick={handleViewStripClick}
                      variant={viewMode}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

        </>
      )}

      {/* ═══ DATA TAB ═══ */}
      {activeTab === "data" && (
        <>
          {/* Data header */}
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-lg font-semibold text-[#1B2B3A]"
              style={cormorant}
            >
              Program Data
            </h2>
            <button
              onClick={() => router.push("/app/impact-studio/data/add")}
              className="flex items-center gap-2 px-4 py-2 bg-[#3A6B8A] text-white rounded-lg text-sm font-medium hover:bg-[#2A5570] transition-colors"
              style={dmSans}
            >
              <Plus className="w-4 h-4" />
              Add Data
            </button>
          </div>

          {/* Data entries list */}
          {loadingData ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-[#3A6B8A] animate-spin" />
            </div>
          ) : dataEntries.length === 0 ? (
            <div className="text-center py-20 bg-white/40 rounded-xl border border-[#1B2B3A]/5">
              <Database className="w-10 h-10 text-[#1B2B3A]/15 mx-auto mb-3" />
              <p className="text-[#1B2B3A]/40 text-sm" style={dmSans}>
                No data added yet.
              </p>
              <button
                onClick={() => router.push("/app/impact-studio/data/add")}
                className="mt-4 px-4 py-2 bg-[#3A6B8A] text-white rounded-lg text-sm font-medium hover:bg-[#2A5570] transition-colors"
                style={dmSans}
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Data
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dataEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => router.push(`/app/impact-studio/data/${entry.id}/edit`)}
                  className="bg-white rounded-xl border border-[#1B2B3A]/5 p-4 flex items-center justify-between cursor-pointer hover:border-[#3A6B8A]/30 hover:bg-[#3A6B8A]/[0.02] transition-colors"
                >
                  <div>
                    <p
                      className="text-sm font-semibold text-[#1B2B3A]"
                      style={dmSans}
                    >
                      {entry.period_label ?? "Untitled Period"}
                    </p>
                    <p
                      className="text-xs text-[#1B2B3A]/40 mt-0.5"
                      style={dmSans}
                    >
                      {entry.program_name ?? "Org-wide"}
                    </p>
                  </div>
                  <span
                    className="text-xs text-[#1B2B3A]/30"
                    style={dmSans}
                  >
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* New Project Modal */}
      {showNewModal && (
        <NewProjectModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}
