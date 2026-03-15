"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, Check } from "lucide-react";

interface Program {
  id: string;
  name: string;
}

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

export default function AddProgramDataPage() {
  const router = useRouter();

  // Org + programs
  const [orgId, setOrgId] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Section 1 — Scope
  const [programId, setProgramId] = useState<string>("org-wide");
  const [periodLabel, setPeriodLabel] = useState("");

  // Section 2 — Paste
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  // Section 3 — Review
  const [parsedTags, setParsedTags] = useState<ParsedTags | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Load programs on mount
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const { data: orgUser } = await supabase
          .from("org_users")
          .select("org_id")
          .eq("user_id", user.id)
          .single();
        if (!orgUser) { setLoadingPrograms(false); return; }

        setOrgId(orgUser.org_id);

        const { data: progs } = await supabase
          .from("programs")
          .select("id, name")
          .eq("org_id", orgUser.org_id)
          .order("name");

        setPrograms(progs ?? []);
      } catch (err) {
        console.error("Failed to load programs:", err);
      } finally {
        setLoadingPrograms(false);
      }
    }
    load();
  }, [router]);

  const scopeComplete = periodLabel.trim().length > 0;
  const canParse = scopeComplete && rawText.trim().length > 0 && !parsing;

  async function handleParse() {
    if (!canParse) return;
    setParsing(true);
    setParseError("");
    setParsedTags(null);

    try {
      const res = await fetch("/api/impact/parse-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });

      if (!res.ok) {
        const err = await res.json();
        setParseError(err.error ?? "Parse failed");
        setParsing(false);
        return;
      }

      const data = await res.json();
      setParsedTags({
        outcomes: data.outcomes ?? null,
        quantitative_data: data.quantitative_data ?? null,
        barriers: data.barriers ?? null,
        client_voice: data.client_voice ?? null,
        change_description: data.change_description ?? null,
      });
    } catch {
      setParseError("Failed to parse data. Please try again.");
    } finally {
      setParsing(false);
    }
  }

  function updateTag(key: keyof ParsedTags, value: string) {
    setParsedTags((prev) => prev ? { ...prev, [key]: value || null } : prev);
  }

  const hasAnyContent = parsedTags
    ? Object.values(parsedTags).some((v) => v && String(v).trim())
    : false;

  async function handleSave() {
    if (!orgId || !parsedTags) return;
    setSaving(true);
    setSaveError("");
    setSaved(false);

    try {
      const supabase = createClient();

      const { error } = await supabase.from("program_data").insert({
        org_id: orgId,
        program_id: programId === "org-wide" ? null : programId,
        period_label: periodLabel.trim(),
        data_type: "qualitative",
        outcomes: parsedTags.outcomes ? String(parsedTags.outcomes).trim() || null : null,
        quantitative_data: parsedTags.quantitative_data ? String(parsedTags.quantitative_data).trim() || null : null,
        barriers: parsedTags.barriers ? String(parsedTags.barriers).trim() || null : null,
        client_voice: parsedTags.client_voice ? String(parsedTags.client_voice).trim() || null : null,
        change_description: parsedTags.change_description ? String(parsedTags.change_description).trim() || null : null,
      });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => {
        router.push("/app/impact-studio");
      }, 1500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save data.");
    } finally {
      setSaving(false);
    }
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
          Add Program Data
        </h1>
        <p className="text-sm text-midnight/50" style={dmSans}>
          Add data once, reuse it across all your projects.
        </p>
      </div>

      <div className="space-y-8">
        {/* ── Section 1 — Scope ──────────────────────────────────── */}
        <section>
          <h2
            className="text-base font-semibold text-midnight mb-3"
            style={cormorant}
          >
            Scope
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Program dropdown */}
            <div>
              <label
                className="block text-xs font-medium text-midnight/60 mb-1.5"
                style={dmSans}
              >
                Program <span className="text-[#D85A30]">*</span>
              </label>
              {loadingPrograms ? (
                <div className="flex items-center gap-2 text-xs text-midnight/30 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading...
                </div>
              ) : (
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-midnight/10 rounded-lg text-sm text-midnight bg-white focus:outline-none focus:ring-2 focus:ring-cerulean/30 focus:border-cerulean"
                  style={dmSans}
                >
                  <option value="org-wide">Org-wide</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Period label */}
            <div>
              <label
                className="block text-xs font-medium text-midnight/60 mb-1.5"
                style={dmSans}
              >
                Reporting Period <span className="text-[#D85A30]">*</span>
              </label>
              <input
                type="text"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="e.g. Q1 2026"
                className="w-full px-3 py-2.5 border border-midnight/10 rounded-lg text-sm text-midnight placeholder:text-midnight/25 focus:outline-none focus:ring-2 focus:ring-cerulean/30 focus:border-cerulean"
                style={dmSans}
              />
            </div>
          </div>
        </section>

        {/* ── Section 2 — Paste Your Data ────────────────────────── */}
        <section>
          <h2
            className="text-base font-semibold text-midnight mb-1"
            style={cormorant}
          >
            Paste Your Data
          </h2>
          <p className="text-xs text-midnight/40 mb-3" style={dmSans}>
            Paste anything — numbers, narratives, client stories, challenges.
            The more context you provide, the stronger your reports will be.
          </p>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your program data here..."
            className="w-full min-h-[200px] px-4 py-3 border border-midnight/10 rounded-xl text-sm text-midnight placeholder:text-midnight/25 focus:outline-none focus:ring-2 focus:ring-cerulean/30 focus:border-cerulean resize-y"
            style={dmSans}
          />

          {parseError && (
            <p className="text-xs text-red-500 mt-2" style={dmSans}>
              {parseError}
            </p>
          )}

          <div className="flex justify-end mt-3">
            <button
              onClick={handleParse}
              disabled={!canParse}
              className="flex items-center gap-2 px-5 py-2.5 bg-cerulean text-white rounded-lg text-sm font-medium hover:bg-cerulean-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={dmSans}
            >
              {parsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                "Parse Data"
              )}
            </button>
          </div>
        </section>

        {/* ── Section 3 — Review Tags ────────────────────────────── */}
        {parsedTags && (
          <section>
            <h2
              className="text-base font-semibold text-midnight mb-1"
              style={cormorant}
            >
              Review Tags
            </h2>
            <p className="text-xs text-midnight/40 mb-4" style={dmSans}>
              Review and adjust each category before saving.
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
                    value={parsedTags[card.key] ?? ""}
                    onChange={(e) => updateTag(card.key, e.target.value)}
                    placeholder="Nothing found — add manually if needed"
                    className="w-full min-h-[100px] px-4 py-3 text-sm text-midnight placeholder:text-midnight/25 focus:outline-none resize-y border-none"
                    style={dmSans}
                  />
                </div>
              ))}
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving || !hasAnyContent}
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
                  "Save to Data Library"
                )}
              </button>

              {saveError && (
                <span className="text-xs text-red-500" style={dmSans}>
                  {saveError}
                </span>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
