"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  Sparkles,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────

type ParsedMetric = {
  metric_name: string;
  unit: string | null;
  target_value: string | null;
};

type ParsedProgram = {
  name: string;
  description: string;
  population_served: string;
  metrics: ParsedMetric[];
};

type ParsedOrg = {
  org_name: string;
  legal_name: string | null;
  mission: string;
  mission_short: string | null;
  org_type: string | null;
  geography: {
    city: string | null;
    state: string | null;
    region: string | null;
  } | null;
  website: string | null;
  population_served: string;
  brand_voice: string;
  programs: ParsedProgram[];
};

type ParsedDataMetric = {
  metric_id: string;
  value: string | null;
};

type ParsedDataProgram = {
  program_id: string;
  program_name: string;
  matched: boolean;
  outcomes: string | null;
  barriers: string | null;
  client_voice: string | null;
  change_description: string | null;
  metrics: ParsedDataMetric[];
};

type ParsedData = {
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  programs: ParsedDataProgram[];
};

type OnboardingPhase = "loading" | "paste1" | "paste1-review" | "paste2" | "paste2-review" | "done";

// ── Component ────────────────────────────────────────────────────────

export default function StudioPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<OnboardingPhase>("loading");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  // Paste 1 state
  const [paste1Text, setPaste1Text] = useState("");
  const [paste1Loading, setPaste1Loading] = useState(false);
  const [paste1Error, setPaste1Error] = useState<string | null>(null);
  const [parsedOrg, setParsedOrg] = useState<ParsedOrg | null>(null);
  const [saving1, setSaving1] = useState(false);

  // Paste 2 state
  const [paste2Text, setPaste2Text] = useState("");
  const [paste2Loading, setPaste2Loading] = useState(false);
  const [paste2Error, setPaste2Error] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [saving2, setSaving2] = useState(false);

  // Expandable program cards
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());

  // ── Check onboarding state ─────────────────────────────────────
  useEffect(() => {
    async function checkState() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has an org
      const { data: orgUser } = await supabase
        .from("org_users")
        .select("org_id")
        .eq("user_id", user.id)
        .single();

      if (!orgUser) {
        setPhase("paste1");
        return;
      }

      setOrgId(orgUser.org_id);

      // Get org slug
      const { data: org } = await supabase
        .from("orgs")
        .select("slug")
        .eq("id", orgUser.org_id)
        .single();

      if (org?.slug) setOrgSlug(org.slug);

      // Check if org has any program data
      const { count } = await supabase
        .from("program_data")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgUser.org_id);

      if (!count || count === 0) {
        setPhase("paste2");
        return;
      }

      setHasData(true);
      setPhase("done");
    }

    checkState();
  }, []);

  // ── Paste 1: Parse org ─────────────────────────────────────────
  const handleParse1 = useCallback(async () => {
    setPaste1Loading(true);
    setPaste1Error(null);

    try {
      const res = await fetch("/api/onboarding/parse-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: paste1Text }),
      });

      const json = await res.json();
      if (!res.ok) {
        setPaste1Error(json.error || "Something went wrong");
        return;
      }

      setParsedOrg(json.parsed);
      setPhase("paste1-review");
    } catch {
      setPaste1Error("Network error. Please try again.");
    } finally {
      setPaste1Loading(false);
    }
  }, [paste1Text]);

  // ── Paste 1: Save org ──────────────────────────────────────────
  const handleSave1 = useCallback(async () => {
    if (!parsedOrg) return;
    setSaving1(true);
    setPaste1Error(null);

    try {
      const res = await fetch("/api/onboarding/save-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedOrg),
      });

      const json = await res.json();
      if (!res.ok) {
        setPaste1Error(json.error || "Failed to save");
        return;
      }

      setOrgId(json.org_id);
      setOrgSlug(json.slug);
      setPhase("paste2");
    } catch {
      setPaste1Error("Network error. Please try again.");
    } finally {
      setSaving1(false);
    }
  }, [parsedOrg]);

  // ── Paste 2: Parse data ────────────────────────────────────────
  const handleParse2 = useCallback(async () => {
    if (!orgId) return;
    setPaste2Loading(true);
    setPaste2Error(null);

    try {
      const res = await fetch("/api/onboarding/parse-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: paste2Text, org_id: orgId }),
      });

      const json = await res.json();
      if (!res.ok) {
        setPaste2Error(json.error || "Something went wrong");
        return;
      }

      setParsedData(json.parsed);
      setPhase("paste2-review");
    } catch {
      setPaste2Error("Network error. Please try again.");
    } finally {
      setPaste2Loading(false);
    }
  }, [paste2Text, orgId]);

  // ── Paste 2: Save data ─────────────────────────────────────────
  const handleSave2 = useCallback(async () => {
    if (!parsedData || !orgId) return;
    setSaving2(true);
    setPaste2Error(null);

    try {
      const res = await fetch("/api/onboarding/save-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          period_label: parsedData.period_label,
          period_start: parsedData.period_start,
          period_end: parsedData.period_end,
          raw_text: paste2Text,
          programs: parsedData.programs,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setPaste2Error(json.error || "Failed to save");
        return;
      }

      // Redirect to Impact Room
      if (orgSlug) {
        router.push(`/impact/${orgSlug}`);
      } else {
        setPhase("done");
        router.push("/app/impact-studio");
      }
    } catch {
      setPaste2Error("Network error. Please try again.");
    } finally {
      setSaving2(false);
    }
  }, [parsedData, orgId, orgSlug, paste2Text, router]);

  // ── Toggle program card expansion ──────────────────────────────
  const toggleProgram = (idx: number) => {
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // ── Loading state ──────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  // ── Done: redirect to workspace ────────────────────────────────
  if (phase === "done") {
    router.push("/app/impact-studio");
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-midnight px-8 py-8 border-b border-gold/20">
        <div className="max-w-2xl mx-auto">
          <p className="font-['DM_Sans'] text-[10px] text-gold/50 uppercase tracking-[0.2em] mb-1">
            Impact Studio
          </p>
          <h1 className="font-['Cormorant_Garamond'] text-2xl text-stone leading-none">
            {phase === "paste1" || phase === "paste1-review"
              ? "Set up your workspace"
              : "Add your program data"}
          </h1>
          <p className="font-['DM_Sans'] text-sm text-stone/60 mt-2">
            {phase === "paste1" || phase === "paste1-review"
              ? "Step 1 of 2"
              : "Step 2 of 2"}
          </p>
        </div>
      </div>
      <div className="h-[3px] bg-gold" />

      <div className="max-w-2xl mx-auto px-8 py-10">
        {/* ── PASTE 1: Org setup ──────────────────────────────── */}
        {phase === "paste1" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-['Cormorant_Garamond'] text-xl text-midnight mb-2">
                Tell us about your organization
              </h2>
              <p className="font-['DM_Sans'] text-sm text-midnight/60">
                Paste anything — your About page, a grant application, your annual
                report. We&apos;ll handle the rest.
              </p>
            </div>

            <div className="relative">
              <textarea
                value={paste1Text}
                onChange={(e) => setPaste1Text(e.target.value.slice(0, 10000))}
                placeholder="Paste anything — your About page, a grant application, your annual report. We'll handle the rest."
                className="w-full h-48 p-4 rounded-lg border border-stone-dim bg-white text-midnight font-['DM_Sans'] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-cerulean/40 focus:border-cerulean placeholder:text-midnight/30"
              />
              <div className="absolute bottom-3 right-3 font-['DM_Sans'] text-xs text-midnight/40">
                {paste1Text.length.toLocaleString()} / 10,000
              </div>
            </div>

            {paste1Error && (
              <div className="flex items-start gap-2 p-3 bg-coral/10 rounded-lg text-coral text-sm font-['DM_Sans']">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {paste1Error}
              </div>
            )}

            <button
              onClick={handleParse1}
              disabled={paste1Text.length < 50 || paste1Loading}
              className="btn-primary flex items-center gap-2"
            >
              {paste1Loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reading your organization...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Parse my organization
                </>
              )}
            </button>
          </div>
        )}

        {/* ── PASTE 1: Review ─────────────────────────────────── */}
        {phase === "paste1-review" && parsedOrg && (
          <div className="space-y-6">
            <div>
              <h2 className="font-['Cormorant_Garamond'] text-xl text-midnight mb-2">
                Does this look right?
              </h2>
              <p className="font-['DM_Sans'] text-sm text-midnight/60">
                Review what we extracted. You can edit details later in Settings.
              </p>
            </div>

            {/* Org card */}
            <div className="rounded-xl border border-stone-dim bg-white overflow-hidden">
              <div className="bg-midnight px-5 py-4 border-t-[3px] border-gold">
                <h3 className="font-['Cormorant_Garamond'] text-lg text-stone">
                  {parsedOrg.org_name}
                </h3>
                {parsedOrg.org_type && (
                  <span className="font-['DM_Sans'] text-xs text-gold/70 uppercase tracking-wider">
                    {parsedOrg.org_type}
                  </span>
                )}
              </div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <label className="font-['DM_Sans'] text-xs text-midnight/50 uppercase tracking-wider">
                    Mission
                  </label>
                  <p className="font-['DM_Sans'] text-sm text-midnight mt-0.5">
                    {parsedOrg.mission}
                  </p>
                </div>
                {parsedOrg.population_served && (
                  <div>
                    <label className="font-['DM_Sans'] text-xs text-midnight/50 uppercase tracking-wider">
                      Population Served
                    </label>
                    <p className="font-['DM_Sans'] text-sm text-midnight mt-0.5">
                      {parsedOrg.population_served}
                    </p>
                  </div>
                )}
                {parsedOrg.geography && (
                  <div>
                    <label className="font-['DM_Sans'] text-xs text-midnight/50 uppercase tracking-wider">
                      Geography
                    </label>
                    <p className="font-['DM_Sans'] text-sm text-midnight mt-0.5">
                      {[parsedOrg.geography.city, parsedOrg.geography.state, parsedOrg.geography.region]
                        .filter(Boolean)
                        .join(", ") || "Not specified"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Program cards */}
            <div>
              <h3 className="font-['Cormorant_Garamond'] text-lg text-midnight mb-3">
                Programs ({parsedOrg.programs.length})
              </h3>
              <div className="space-y-3">
                {parsedOrg.programs.map((prog, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-stone-dim bg-white overflow-hidden"
                  >
                    <button
                      onClick={() => toggleProgram(idx)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-cerulean/10 text-cerulean text-xs flex items-center justify-center font-['DM_Sans'] font-semibold">
                          {idx + 1}
                        </span>
                        <span className="font-['DM_Sans'] text-sm font-medium text-midnight">
                          {prog.name}
                        </span>
                      </div>
                      {expandedPrograms.has(idx) ? (
                        <ChevronUp className="w-4 h-4 text-midnight/40" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-midnight/40" />
                      )}
                    </button>
                    {expandedPrograms.has(idx) && (
                      <div className="px-4 pb-4 space-y-2 border-t border-stone-dim/50">
                        <p className="font-['DM_Sans'] text-sm text-midnight/70 mt-3">
                          {prog.description}
                        </p>
                        {prog.population_served && (
                          <p className="font-['DM_Sans'] text-xs text-midnight/50">
                            Serves: {prog.population_served}
                          </p>
                        )}
                        {prog.metrics.length > 0 && (
                          <div className="mt-2">
                            <label className="font-['DM_Sans'] text-xs text-midnight/50 uppercase tracking-wider">
                              Metrics
                            </label>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {prog.metrics.map((m, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="font-['DM_Sans'] text-xs bg-cerulean/10 text-cerulean px-2 py-0.5 rounded"
                                >
                                  {m.metric_name}
                                  {m.unit ? ` (${m.unit})` : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {paste1Error && (
              <div className="flex items-start gap-2 p-3 bg-coral/10 rounded-lg text-coral text-sm font-['DM_Sans']">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {paste1Error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPhase("paste1")}
                className="btn-outline"
              >
                Back
              </button>
              <button
                onClick={handleSave1}
                disabled={saving1}
                className="btn-primary flex items-center gap-2"
              >
                {saving1 ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up your workspace...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    This looks right — set up my workspace
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── PASTE 2: Period data ────────────────────────────── */}
        {phase === "paste2" && (
          <div className="space-y-6">
            {/* Success banner for completing step 1 */}
            {orgId && (
              <div className="flex items-center gap-2 p-3 bg-teal/10 rounded-lg text-teal text-sm font-['DM_Sans']">
                <Check className="w-4 h-4 shrink-0" />
                Organization set up. Now add your program data.
              </div>
            )}

            <div>
              <h2 className="font-['Cormorant_Garamond'] text-xl text-midnight mb-2">
                Add your program data
              </h2>
              <p className="font-['DM_Sans'] text-sm text-midnight/60">
                Paste your program data — a spreadsheet export, your board update,
                anything with outcomes and numbers. We&apos;ll match it to your programs.
              </p>
            </div>

            <div className="relative">
              <textarea
                value={paste2Text}
                onChange={(e) => setPaste2Text(e.target.value.slice(0, 10000))}
                placeholder="Paste your program data — a spreadsheet export, your board update, anything with outcomes and numbers."
                className="w-full h-48 p-4 rounded-lg border border-stone-dim bg-white text-midnight font-['DM_Sans'] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-cerulean/40 focus:border-cerulean placeholder:text-midnight/30"
              />
              <div className="absolute bottom-3 right-3 font-['DM_Sans'] text-xs text-midnight/40">
                {paste2Text.length.toLocaleString()} / 10,000
              </div>
            </div>

            {paste2Error && (
              <div className="flex items-start gap-2 p-3 bg-coral/10 rounded-lg text-coral text-sm font-['DM_Sans']">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {paste2Error}
              </div>
            )}

            <button
              onClick={handleParse2}
              disabled={paste2Text.length < 20 || paste2Loading}
              className="btn-primary flex items-center gap-2"
            >
              {paste2Loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Matching your data to your programs...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Parse my data
                </>
              )}
            </button>
          </div>
        )}

        {/* ── PASTE 2: Review ─────────────────────────────────── */}
        {phase === "paste2-review" && parsedData && (
          <div className="space-y-6">
            <div>
              <h2 className="font-['Cormorant_Garamond'] text-xl text-midnight mb-2">
                Here&apos;s what we found
              </h2>
              <p className="font-['DM_Sans'] text-sm text-midnight/60">
                {parsedData.period_label}
                {parsedData.period_start && parsedData.period_end && (
                  <span className="text-midnight/40">
                    {" "}
                    ({parsedData.period_start} to {parsedData.period_end})
                  </span>
                )}
              </p>
            </div>

            {/* Program data cards */}
            <div className="space-y-3">
              {parsedData.programs.map((prog, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border overflow-hidden ${
                    prog.matched
                      ? "border-stone-dim bg-white"
                      : "border-coral/30 bg-coral/5"
                  }`}
                >
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {prog.matched ? (
                        <Check className="w-4 h-4 text-teal" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-coral" />
                      )}
                      <span className="font-['DM_Sans'] text-sm font-medium text-midnight">
                        {prog.program_name}
                      </span>
                    </div>
                    {!prog.matched && (
                      <span className="font-['DM_Sans'] text-xs text-coral">
                        No data found — you can add it later
                      </span>
                    )}
                  </div>

                  {prog.matched && (
                    <div className="px-4 pb-4 space-y-2 border-t border-stone-dim/50">
                      {prog.outcomes && (
                        <div className="mt-3">
                          <label className="font-['DM_Sans'] text-xs text-midnight/50 uppercase tracking-wider">
                            Outcomes
                          </label>
                          <p className="font-['DM_Sans'] text-sm text-midnight mt-0.5">
                            {prog.outcomes}
                          </p>
                        </div>
                      )}
                      {prog.barriers && (
                        <div>
                          <label className="font-['DM_Sans'] text-xs text-midnight/50 uppercase tracking-wider">
                            Barriers
                          </label>
                          <p className="font-['DM_Sans'] text-sm text-midnight mt-0.5">
                            {prog.barriers}
                          </p>
                        </div>
                      )}
                      {prog.client_voice && (
                        <div>
                          <label className="font-['DM_Sans'] text-xs text-midnight/50 uppercase tracking-wider">
                            Client Voice
                          </label>
                          <p className="font-['DM_Sans'] text-sm text-midnight/80 mt-0.5 italic">
                            &ldquo;{prog.client_voice}&rdquo;
                          </p>
                        </div>
                      )}
                      {prog.metrics.filter((m) => m.value).length > 0 && (
                        <div>
                          <label className="font-['DM_Sans'] text-xs text-midnight/50 uppercase tracking-wider">
                            Metrics
                          </label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {prog.metrics
                              .filter((m) => m.value)
                              .map((m, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="font-['DM_Sans'] text-xs bg-gold/10 text-midnight px-2 py-1 rounded font-medium"
                                >
                                  {m.value}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {paste2Error && (
              <div className="flex items-start gap-2 p-3 bg-coral/10 rounded-lg text-coral text-sm font-['DM_Sans']">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {paste2Error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPhase("paste2")}
                className="btn-outline"
              >
                Back
              </button>
              <button
                onClick={handleSave2}
                disabled={saving2}
                className="btn-primary flex items-center gap-2"
              >
                {saving2 ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving your data...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Lock in my data — show me my Impact Room
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
