import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FolderOpen, Calendar } from "lucide-react";

export function generateMetadata(): Metadata {
  const appTitle = process.env.NEXT_PUBLIC_APP_TITLE ?? "Candela Assist";
  return {
    title: `Grant Suite — ${appTitle}`,
  };
}

const VERTICAL_COLORS: Record<string, string> = {
  "Workforce development": "bg-blue-100 text-blue-800",
  "Affordable housing": "bg-amber-100 text-amber-800",
  "Mental health & substance use": "bg-purple-100 text-purple-800",
  "Early childhood education": "bg-green-100 text-green-800",
  "Food security": "bg-orange-100 text-orange-800",
  "Domestic violence services": "bg-rose-100 text-rose-800",
  "Youth development": "bg-teal-100 text-teal-800",
  "Immigrant & refugee services": "bg-indigo-100 text-indigo-800",
  "General nonprofit services": "bg-stone/50 text-midnight/70",
};

export default async function GrantSuiteDashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's org
  const { data: orgUser } = await supabase
    .from("org_users")
    .select("org_id")
    .eq("user_id", user!.id)
    .single();

  // Get logic models for this org
  const { data: logicModels } = orgUser?.org_id
    ? await supabase
        .from("logic_models")
        .select("id, program_name, vertical, created_at, slug")
        .eq("org_id", orgUser.org_id)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Get most recent reporting_data per logic model
  const modelIds = (logicModels ?? []).map((m) => m.id);
  let reportingStatusMap: Record<string, string> = {};
  if (modelIds.length > 0) {
    const { data: reportingRows } = await supabase
      .from("reporting_data")
      .select("logic_model_id, updated_at")
      .in("logic_model_id", modelIds)
      .order("updated_at", { ascending: false });

    if (reportingRows) {
      // Keep only the most recent per model
      for (const row of reportingRows) {
        if (!reportingStatusMap[row.logic_model_id]) {
          reportingStatusMap[row.logic_model_id] = row.updated_at;
        }
      }
    }
  }

  function getStatusBadge(modelId: string) {
    const lastUpdated = reportingStatusMap[modelId];
    if (!lastUpdated) {
      return { label: "No data yet", bg: "bg-[#f3f4f6]", text: "text-[#9ca3af]" };
    }
    const daysSince = Math.floor(
      (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince <= 30) {
      return { label: "Data current", bg: "bg-green-50", text: "text-green-700" };
    }
    return { label: "Needs update", bg: "bg-amber-50", text: "text-amber-700" };
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="bg-midnight px-8 py-6 border-b border-gold/20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-fraunces text-2xl text-stone leading-none mb-1">
              Grant Suite
            </h1>
            <p className="font-jost text-xs text-stone/40">
              Program dashboards &amp; logic models
            </p>
          </div>
          <Link
            href="/app/grant-suite/new"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-midnight font-jost font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* 3px gold accent */}
      <div className="h-[3px] bg-gold" />

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        {!logicModels || logicModels.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-stone/60 flex items-center justify-center mb-5 shadow-sm">
              <FolderOpen className="w-7 h-7 text-midnight/30" />
            </div>
            <h2 className="font-fraunces text-xl text-midnight mb-2">
              No projects yet
            </h2>
            <p className="font-jost text-sm text-midnight/50 max-w-xs leading-relaxed mb-6">
              Create your first project to get started. It takes about 60
              seconds.
            </p>
            <Link
              href="/app/grant-suite/new"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-midnight font-jost font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first project
            </Link>
          </div>
        ) : (
          /* Logic model cards */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {logicModels.map((model) => {
              const status = getStatusBadge(model.id);
              return (
              <div
                key={model.id}
                className="bg-white rounded-xl border border-stone/60 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    {model.vertical && (
                      <span
                        className={`inline-block text-[10px] font-mono uppercase tracking-[0.12em] px-2 py-0.5 rounded-full ${
                          VERTICAL_COLORS[model.vertical] ??
                          "bg-stone/50 text-midnight/70"
                        }`}
                      >
                        {model.vertical}
                      </span>
                    )}
                    <span
                      className={`inline-block text-[10px] font-mono uppercase tracking-[0.12em] px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <h3 className="font-fraunces font-medium text-base text-midnight leading-snug mb-2">
                    {model.program_name}
                  </h3>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone/40">
                  <span className="flex items-center gap-1.5 font-jost text-xs text-midnight/40">
                    <Calendar className="w-3 h-3" />
                    {formatDate(model.created_at)}
                  </span>
                  <Link
                    href={`/app/grant-suite/${model.id}`}
                    className="font-jost font-semibold text-xs text-cerulean hover:text-cerulean-dark transition-colors"
                  >
                    Open →
                  </Link>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
