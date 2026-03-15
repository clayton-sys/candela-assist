"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, Check, Trash2 } from "lucide-react";

interface ParsedTags {
  outcomes: string | null;
  quantitative_data: string | null;
  barriers: string | null;
  client_voice: string | null;
  change_description: string | null;
}

const TAG_CARDS: { key: keyof ParsedTags; label: string; description: string }[] = [
  { key: "outcomes", label: "Outcomes", description: "Measurable results and achievements" },
  { key: "quantitative_data", label: "Metrics", description: "Numbers, percentages, counts" },
  { key: "barriers", label: "Barriers", description: "Challenges, obstacles, unmet needs" },
  { key: "client_voice", label: "Client Voice", description: "Quotes or stories from clients" },
  { key: "change_description", label: "Change Description", description: "Descriptions of change over time" },
];

const dmSans = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;
const cormorant = { fontFamily: "'Cormorant Garamond', Georgia, serif" } as const;

export default function EditProgramDataPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [programName, setProgramName] = useState<string | null>(null);
  const [periodLabel, setPeriodLabel] = useState("");
  const [tags, setTags] = useState<ParsedTags>({
    outcomes: null,
    quantitative_data: null,
    barriers: null,
    client_voice: null,
    change_description: null,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("program_data")
          .select("period_label, outcomes, quantitative_data, barriers, client_voice, change_description, program:programs(name)")
          .eq("id", entryId)
          .single();

        if (!data) {
          router.replace("/app/impact-studio");
          return;
        }

        setPeriodLabel(data.period_label ?? "");
        const prog = data.program as { name: string } | null;
        setProgramName(prog?.name ?? null);
        setTags({
          outcomes: data.outcomes ?? null,
          quantitative_data: data.quantitative_data ?? null,
          barriers: data.barriers ?? null,
          client_voice: data.client_voice ?? null,
          change_description: data.change_description ?? null,
        });
      } catch (err) {
        console.error("Failed to load entry:", err);
        router.replace("/app/impact-studio");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [entryId, router]);

  function updateTag(key: keyof ParsedTags, value: string) {
    setTags((prev) => ({ ...prev, [key]: value || null }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    setSaved(false);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("program_data")
        .update({
          outcomes: tags.outcomes ? String(tags.outcomes).trim() || null : null,
          quantitative_data: tags.quantitative_data ? String(tags.quantitative_data).trim() || null : null,
          barriers: tags.barriers ? String(tags.barriers).trim() || null : null,
          client_voice: tags.client_voice ? String(tags.client_voice).trim() || null : null,
          change_description: tags.change_description ? String(tags.change_description).trim() || null : null,
        })
        .eq("id", entryId);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("program_data")
        .delete()
        .eq("id", entryId);

      if (error) throw error;

      router.push("/app/impact-studio");
    } catch (err) {
      console.error("Failed to delete entry:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to delete entry.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#3A6B8A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/app/impact-studio")}
          className="flex items-center gap-1 text-sm text-midnight/40 hover:text-midnight/60 transition-colors mb-4"
          style={dmSans}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workspace
        </button>
        <h1
          className="text-2xl font-semibold text-midnight mb-1"
          style={cormorant}
        >
          Edit Program Data
        </h1>
      </div>

      <div className="space-y-8">
        {/* ── Section 1 — Scope (read-only) ─────────────────────── */}
        <section>
          <h2
            className="text-base font-semibold text-midnight mb-3"
            style={cormorant}
          >
            Scope
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-midnight/60 mb-1" style={dmSans}>
                Program
              </p>
              <p className="text-sm text-midnight" style={dmSans}>
                {programName ?? "Org-wide"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-midnight/60 mb-1" style={dmSans}>
                Reporting Period
              </p>
              <p className="text-sm text-midnight" style={dmSans}>
                {periodLabel || "—"}
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 2 — Tag Cards ─────────────────────────────── */}
        <section>
          <h2
            className="text-base font-semibold text-midnight mb-1"
            style={cormorant}
          >
            Data Tags
          </h2>
          <p className="text-xs text-midnight/40 mb-4" style={dmSans}>
            Edit each category as needed.
          </p>

          <div className="space-y-4">
            {TAG_CARDS.map((card) => (
              <div
                key={card.key}
                className="border border-midnight/10 rounded-xl overflow-hidden"
              >
                <div className="px-4 py-3 bg-midnight/[0.02] border-b border-midnight/5">
                  <p
                    className="text-sm font-semibold text-midnight"
                    style={dmSans}
                  >
                    {card.label}
                  </p>
                  <p
                    className="text-xs text-midnight/40 mt-0.5"
                    style={dmSans}
                  >
                    {card.description}
                  </p>
                </div>
                <textarea
                  value={tags[card.key] ?? ""}
                  onChange={(e) => updateTag(card.key, e.target.value)}
                  placeholder="Nothing found — add manually if needed"
                  className="w-full min-h-[100px] px-4 py-3 text-sm text-midnight placeholder:text-midnight/25 focus:outline-none resize-y border-none"
                  style={dmSans}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Actions ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-cerulean text-white rounded-lg text-sm font-medium hover:bg-cerulean-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={dmSans}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                "Save Changes"
              )}
            </button>

            {saveError && (
              <span className="text-xs text-red-500" style={dmSans}>
                {saveError}
              </span>
            )}
          </div>

          {/* Delete */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              style={dmSans}
            >
              <Trash2 className="w-4 h-4" />
              Delete Entry
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-500" style={dmSans}>
                Are you sure? This cannot be undone.
              </span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-40"
                style={dmSans}
              >
                {deleting ? "Deleting..." : "Confirm"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-midnight/50 hover:text-midnight/70 transition-colors"
                style={dmSans}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
