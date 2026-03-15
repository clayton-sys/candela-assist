"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/lib/hooks/useOrg";
import {
  Building2,
  FolderKanban,
  Palette,
  MessageSquareText,
  Users,
  Plus,
  Trash2,
  Archive,
  ArchiveRestore,
  Upload,
  Check,
  Send,
  X,
  Crown,
} from "lucide-react";
import { BRAND_PRESETS, SWATCH_OPTIONS, DEFAULT_BRAND } from "@/lib/brand-kit/types";

/* ───────────── shared style helpers ───────────── */
const inputStyle: React.CSSProperties = {
  background: "rgba(237,232,222,0.06)",
  border: "1px solid rgba(237,232,222,0.12)",
  color: "#EDE8DE",
};

const labelStyle: React.CSSProperties = {
  color: "rgba(237,232,222,0.5)",
  letterSpacing: "0.08em",
};

const goldBtn: React.CSSProperties = {
  background: "#E9C03A",
  color: "#1B2B3A",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(237,232,222,0.04)",
  border: "1px solid rgba(237,232,222,0.1)",
  borderRadius: 10,
};

/* ───────────── types ───────────── */
type Metric = { name: string; value: string; target: string };
type Program = {
  id?: string;
  name: string;
  description: string;
  metrics: Metric[];
  archived: boolean;
  isNew?: boolean;
};
type SwatchRole = "primary" | "accent" | "success";
type TeamMember = { id: string; email: string; role: string; user_id: string };
type PendingInvite = { id: string; email: string; role: string; created_at: string };

const TABS = [
  { key: "org", label: "Org Profile", icon: Building2 },
  { key: "programs", label: "Programs", icon: FolderKanban },
  { key: "brand", label: "Brand Kit", icon: Palette },
  { key: "voice", label: "Voice & Style", icon: MessageSquareText },
  { key: "team", label: "Team", icon: Users },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const ORG_TYPES = [
  "social services",
  "housing",
  "workforce",
  "education",
  "health",
  "arts",
  "environment",
  "other",
];

/* ═══════════════════════════════════════════════════
   Main Settings Page
   ═══════════════════════════════════════════════════ */
export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { orgId, plan, loading: orgLoading } = useOrg();
  const [activeTab, setActiveTab] = useState<TabKey>("org");

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
        <p className="text-sm" style={{ color: "rgba(237,232,222,0.4)" }}>
          Loading settings…
        </p>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
        <p className="text-sm" style={{ color: "rgba(237,232,222,0.4)" }}>
          No organization found. Please complete onboarding.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="text-2xl font-semibold mb-1"
        style={{ color: "#EDE8DE", fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        Organization Settings
      </h1>
      <p className="text-sm mb-8" style={{ color: "rgba(237,232,222,0.45)" }}>
        Manage your organization profile, programs, branding, and team.
      </p>

      <div className="flex gap-8">
        {/* ── Left tab nav ── */}
        <nav className="flex flex-col gap-1" style={{ width: 200, flexShrink: 0 }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors"
                style={{
                  background: active ? "rgba(237,232,222,0.08)" : "transparent",
                  color: active ? "#EDE8DE" : "rgba(237,232,222,0.5)",
                  fontWeight: active ? 500 : 400,
                }}
              >
                <Icon className="w-4 h-4" style={{ flexShrink: 0 }} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* ── Content panel ── */}
        <div className="flex-1 min-w-0">
          {activeTab === "org" && <OrgProfileSection orgId={orgId} />}
          {activeTab === "programs" && <ProgramsSection orgId={orgId} />}
          {activeTab === "brand" && <BrandKitSection orgId={orgId} plan={plan} />}
          {activeTab === "voice" && <VoiceStyleSection orgId={orgId} plan={plan} />}
          {activeTab === "team" && <TeamSection orgId={orgId} />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Section 1 — Org Profile
   ═══════════════════════════════════════════════════ */
function OrgProfileSection({ orgId }: { orgId: string }) {
  const supabase = createClient();
  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [website, setWebsite] = useState("");
  const [orgType, setOrgType] = useState("");
  const [mission, setMission] = useState("");
  const [intakePaste, setIntakePaste] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("orgs")
        .select("legal_name, org_display_name, website, org_type, mission")
        .eq("id", orgId)
        .single();
      if (data) {
        setLegalName(data.legal_name ?? "");
        setDisplayName(data.org_display_name ?? "");
        setWebsite(data.website ?? "");
        setOrgType(data.org_type ?? "");
        setMission(data.mission ?? "");
      }
      setLoading(false);
    }
    load();
  }, [orgId, supabase]);

  function handleIntakePaste(text: string) {
    setIntakePaste(text);
    // Try to auto-populate fields from structured paste
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.startsWith("legal name:") || lower.startsWith("legal name :")) {
        setLegalName(line.split(":").slice(1).join(":").trim());
      } else if (lower.startsWith("display name:") || lower.startsWith("display name :")) {
        setDisplayName(line.split(":").slice(1).join(":").trim());
      } else if (lower.startsWith("website:") || lower.startsWith("website :") || lower.startsWith("url:")) {
        setWebsite(line.split(":").slice(1).join(":").trim());
      } else if (lower.startsWith("org type:") || lower.startsWith("type:") || lower.startsWith("organization type:")) {
        const val = line.split(":").slice(1).join(":").trim().toLowerCase();
        if (ORG_TYPES.includes(val)) setOrgType(val);
      } else if (lower.startsWith("mission:") || lower.startsWith("mission statement:")) {
        setMission(line.split(":").slice(1).join(":").trim());
      }
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await supabase
      .from("orgs")
      .update({
        legal_name: legalName,
        org_display_name: displayName,
        website,
        org_type: orgType,
        mission,
      })
      .eq("id", orgId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <SectionLoader />;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Org Profile" description="Basic information about your organization." />

      {/* Intake paste field */}
      <Field label="Quick import (paste structured text)">
        <textarea
          value={intakePaste}
          onChange={(e) => handleIntakePaste(e.target.value)}
          placeholder={"Legal Name: Example Org\nDisplay Name: Example\nWebsite: https://example.org\nOrg Type: education\nMission: Our mission is..."}
          rows={4}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
          style={inputStyle}
        />
        <p className="text-xs mt-1" style={{ color: "rgba(237,232,222,0.35)" }}>
          Paste structured data to auto-fill the fields below.
        </p>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Legal name">
          <input
            type="text"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="Legal entity name"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </Field>
        <Field label="Display name">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Public-facing name"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </Field>
        <Field label="Website">
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourorg.org"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </Field>
        <Field label="Organization type">
          <select
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none appearance-none"
            style={inputStyle}
          >
            <option value="">Select type…</option>
            {ORG_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Mission statement (optional)">
        <textarea
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          placeholder="Brief mission statement…"
          rows={3}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
          style={inputStyle}
        />
        <p className="text-xs mt-1" style={{ color: "rgba(237,232,222,0.35)" }}>
          Used as fallback center text in Orbit View.
        </p>
      </Field>

      <SaveBar saving={saving} saved={saved} onClick={handleSave} label="Save org profile" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Section 2 — Programs
   ═══════════════════════════════════════════════════ */
function ProgramsSection({ orgId }: { orgId: string }) {
  const supabase = createClient();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("programs")
        .select("id, name, description, metrics, archived")
        .eq("org_id", orgId)
        .order("created_at", { ascending: true });
      if (data) {
        setPrograms(
          data.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            name: (p.name as string) ?? "",
            description: (p.description as string) ?? "",
            metrics: (p.metrics as Metric[]) ?? [],
            archived: (p.archived as boolean) ?? false,
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, [orgId, supabase]);

  function addProgram() {
    setPrograms((prev) => [
      ...prev,
      { name: "", description: "", metrics: [{ name: "", value: "", target: "" }], archived: false, isNew: true },
    ]);
  }

  function updateProgram(index: number, field: keyof Program, value: unknown) {
    setPrograms((prev) => {
      const next = [...prev];
      (next[index] as Record<string, unknown>)[field] = value;
      return next;
    });
  }

  function addMetric(programIndex: number) {
    setPrograms((prev) => {
      const next = [...prev];
      if (next[programIndex].metrics.length < 5) {
        next[programIndex] = {
          ...next[programIndex],
          metrics: [...next[programIndex].metrics, { name: "", value: "", target: "" }],
        };
      }
      return next;
    });
  }

  function updateMetric(programIndex: number, metricIndex: number, field: keyof Metric, value: string) {
    setPrograms((prev) => {
      const next = [...prev];
      const metrics = [...next[programIndex].metrics];
      metrics[metricIndex] = { ...metrics[metricIndex], [field]: value };
      next[programIndex] = { ...next[programIndex], metrics };
      return next;
    });
  }

  function removeMetric(programIndex: number, metricIndex: number) {
    setPrograms((prev) => {
      const next = [...prev];
      const metrics = next[programIndex].metrics.filter((_, i) => i !== metricIndex);
      next[programIndex] = { ...next[programIndex], metrics };
      return next;
    });
  }

  function toggleArchive(index: number) {
    setPrograms((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], archived: !next[index].archived };
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      for (const program of programs) {
        const payload = {
          name: program.name,
          description: program.description,
          metrics: program.metrics,
          archived: program.archived,
          org_id: orgId,
        };
        if (program.id && !program.isNew) {
          await supabase.from("programs").update(payload).eq("id", program.id);
        } else {
          const { data } = await supabase.from("programs").insert(payload).select("id").single();
          if (data) program.id = data.id;
          program.isNew = false;
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SectionLoader />;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Programs"
        description="Define the programs your org runs. The first metric for each program is the top-line outcome metric."
      />

      {programs.map((program, pi) => (
        <div key={pi} style={cardStyle} className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={program.name}
                onChange={(e) => updateProgram(pi, "name", e.target.value)}
                placeholder="Program name"
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                value={program.description}
                onChange={(e) => updateProgram(pi, "description", e.target.value)}
                placeholder="Short description"
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <button
              onClick={() => toggleArchive(pi)}
              className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors"
              style={{
                color: program.archived ? "#1D9E75" : "rgba(237,232,222,0.4)",
                background: "rgba(237,232,222,0.04)",
              }}
              title={program.archived ? "Restore program" : "Archive program"}
            >
              {program.archived ? (
                <><ArchiveRestore className="w-3.5 h-3.5" /> Restore</>
              ) : (
                <><Archive className="w-3.5 h-3.5" /> Archive</>
              )}
            </button>
          </div>

          {program.archived && (
            <p className="text-xs mb-3 px-1" style={{ color: "rgba(237,232,222,0.35)" }}>
              This program is archived and won&apos;t appear in project creation.
            </p>
          )}

          {/* Metrics */}
          <div className="flex flex-col gap-2">
            {program.metrics.map((metric, mi) => (
              <div key={mi} className="flex items-center gap-2">
                {mi === 0 && (
                  <span
                    className="text-[10px] uppercase px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(233,192,58,0.15)", color: "#E9C03A", whiteSpace: "nowrap" }}
                  >
                    Top-line
                  </span>
                )}
                <input
                  type="text"
                  value={metric.name}
                  onChange={(e) => updateMetric(pi, mi, "name", e.target.value)}
                  placeholder="Metric name"
                  className="flex-1 rounded px-2.5 py-1.5 text-sm outline-none"
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={metric.value}
                  onChange={(e) => updateMetric(pi, mi, "value", e.target.value)}
                  placeholder="Value"
                  className="w-20 rounded px-2.5 py-1.5 text-sm outline-none"
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={metric.target}
                  onChange={(e) => updateMetric(pi, mi, "target", e.target.value)}
                  placeholder="Target"
                  className="w-20 rounded px-2.5 py-1.5 text-sm outline-none"
                  style={inputStyle}
                />
                <button
                  onClick={() => removeMetric(pi, mi)}
                  className="p-1 rounded transition-colors hover:bg-red-500/10"
                  style={{ color: "rgba(237,232,222,0.3)" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {program.metrics.length < 5 && (
              <button
                onClick={() => addMetric(pi)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded self-start transition-colors"
                style={{ color: "rgba(237,232,222,0.45)" }}
              >
                <Plus className="w-3 h-3" /> Add metric
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={addProgram}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium self-start transition-colors"
        style={{
          border: "1px dashed rgba(237,232,222,0.2)",
          color: "rgba(237,232,222,0.6)",
          background: "transparent",
        }}
      >
        <Plus className="w-4 h-4" /> Create new program
      </button>

      <SaveBar saving={saving} saved={saved} onClick={handleSave} label="Save programs" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Section 3 — Brand Kit
   ═══════════════════════════════════════════════════ */
function BrandKitSection({ orgId, plan }: { orgId: string; plan: string | null }) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [primary, setPrimary] = useState(DEFAULT_BRAND.primary);
  const [accent, setAccent] = useState(DEFAULT_BRAND.accent);
  const [success, setSuccess] = useState(DEFAULT_BRAND.success);
  const [textOnPrimary, setTextOnPrimary] = useState(DEFAULT_BRAND.textOnPrimary);
  const [orgDisplayName, setOrgDisplayName] = useState("");
  const [centerText, setCenterText] = useState("");
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hexInputs, setHexInputs] = useState({ primary: "", accent: "", success: "" });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("brand_kits")
        .select(
          "brand_primary, brand_accent, brand_success, brand_text, logo_url, org_display_name, remove_candela_footer, custom_center_text"
        )
        .eq("org_id", orgId)
        .single();
      if (data) {
        const p = data.brand_primary ?? DEFAULT_BRAND.primary;
        const a = data.brand_accent ?? DEFAULT_BRAND.accent;
        const s = data.brand_success ?? DEFAULT_BRAND.success;
        setPrimary(p);
        setAccent(a);
        setSuccess(s);
        setHexInputs({ primary: p, accent: a, success: s });
        setTextOnPrimary(data.brand_text ?? DEFAULT_BRAND.textOnPrimary);
        setOrgDisplayName(data.org_display_name ?? "");
        setCenterText(data.custom_center_text ?? "");
        setWhiteLabel(data.remove_candela_footer ?? false);
        setLogoUrl(data.logo_url ?? null);
      }
      setLoading(false);
    }
    load();
  }, [orgId, supabase]);

  // Plan gating — starter cannot access brand kit
  if (!loading && plan === "starter") {
    return (
      <div className="flex flex-col gap-4">
        <SectionHeader title="Brand Kit" description="Customize how your reports and dashboards look." />
        <div className="rounded-xl p-8 text-center" style={cardStyle}>
          <Crown className="w-8 h-8 mx-auto mb-3" style={{ color: "#E9C03A" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "#EDE8DE" }}>
            Upgrade to Growth to unlock Brand Kit
          </p>
          <p className="text-xs mb-4" style={{ color: "rgba(237,232,222,0.45)" }}>
            Custom colors, logo upload, and branded reports are available on Growth and Pro plans.
          </p>
          <button
            className="text-sm font-medium px-5 py-2 rounded-lg"
            style={goldBtn}
            onClick={() => {
              // Future: link to billing/upgrade
            }}
          >
            Upgrade plan
          </button>
        </div>
      </div>
    );
  }

  function isValidHex(hex: string) {
    return /^#[0-9a-fA-F]{6}$/.test(hex);
  }

  function handleHexInput(role: SwatchRole, value: string) {
    const normalized = value.startsWith("#") ? value : `#${value}`;
    setHexInputs((prev) => ({ ...prev, [role]: normalized }));
    if (isValidHex(normalized)) {
      if (role === "primary") setPrimary(normalized);
      else if (role === "accent") setAccent(normalized);
      else setSuccess(normalized);
    }
  }

  function selectSwatch(role: SwatchRole, color: string) {
    if (role === "primary") setPrimary(color);
    else if (role === "accent") setAccent(color);
    else setSuccess(color);
    setHexInputs((prev) => ({ ...prev, [role]: color }));
  }

  function applyPreset(preset: (typeof BRAND_PRESETS)[number]) {
    setPrimary(preset.primary);
    setAccent(preset.accent);
    setSuccess(preset.success);
    setHexInputs({ primary: preset.primary, accent: preset.accent, success: preset.success });
  }

  const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
  const MAX_SIZE = 2 * 1024 * 1024;

  function handleFile(file: File) {
    setLogoError("");
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLogoError("Only PNG, JPEG, or SVG files are accepted.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setLogoError("File must be under 2MB.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop() ?? "png";
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("brand-assets")
          .upload(`${orgId}/logo-${Date.now()}.${ext}`, logoFile, { cacheControl: "3600", upsert: true });
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("brand-assets").getPublicUrl(uploadData.path);
        finalLogoUrl = publicUrl;
      }

      const brandPayload = {
        brand_primary: primary,
        brand_accent: accent,
        brand_success: success,
        brand_text: textOnPrimary,
        logo_url: finalLogoUrl,
        org_display_name: orgDisplayName,
        custom_center_text: centerText,
        remove_candela_footer: whiteLabel,
      };

      // Check if a brand_kits row exists for this org
      const { data: existing } = await supabase
        .from("brand_kits")
        .select("id")
        .eq("org_id", orgId)
        .single();

      const { error } = existing
        ? await supabase.from("brand_kits").update(brandPayload).eq("org_id", orgId)
        : await supabase.from("brand_kits").insert({ org_id: orgId, ...brandPayload });
      if (error) throw error;

      setLogoUrl(finalLogoUrl);
      setLogoFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save brand settings.");
    } finally {
      setSaving(false);
    }
  }

  const initials = orgDisplayName
    ? orgDisplayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CA";

  const colorRoles: { key: SwatchRole; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "accent", label: "Accent" },
    { key: "success", label: "Success" },
  ];
  const colorValues: Record<SwatchRole, string> = { primary, accent, success };

  if (loading) return <SectionLoader />;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Brand Kit" description="Customize how your reports and dashboards look." />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Controls */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Display name */}
          <Field label="Organization display name">
            <input
              type="text"
              value={orgDisplayName}
              onChange={(e) => setOrgDisplayName(e.target.value)}
              placeholder="e.g. Denver Works"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={inputStyle}
            />
          </Field>

          {/* Custom center text */}
          <Field label="Custom center text (max 6 chars)">
            <input
              type="text"
              value={centerText}
              onChange={(e) => {
                if (e.target.value.length <= 6) setCenterText(e.target.value);
              }}
              placeholder="e.g. HOPE"
              maxLength={6}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: "rgba(237,232,222,0.35)" }}>
              Shown in constellation hub center when no logo is uploaded.
            </p>
          </Field>

          {/* Logo upload */}
          <Field label="Logo">
            {logoPreview || logoUrl ? (
              <div
                className="flex items-center gap-4 rounded-lg px-4 py-4"
                style={{ border: "1px dashed rgba(237,232,222,0.2)", background: "rgba(237,232,222,0.02)" }}
              >
                <img src={logoPreview || logoUrl || ""} alt="Logo" style={{ maxHeight: 80, objectFit: "contain" }} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-3 py-1.5 rounded-md transition-colors"
                  style={{ background: "rgba(237,232,222,0.1)", color: "#EDE8DE", border: "1px solid rgba(237,232,222,0.15)" }}
                >
                  Replace
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors"
                style={{
                  height: 120,
                  border: "1px dashed rgba(237,232,222,0.2)",
                  background: dragOver ? "rgba(237,232,222,0.06)" : "rgba(237,232,222,0.02)",
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-5 h-5 mb-2" style={{ color: "rgba(237,232,222,0.3)" }} />
                <p className="text-xs" style={{ color: "rgba(237,232,222,0.4)" }}>
                  Drag & drop or click to upload
                </p>
                <p className="text-[10px] mt-1" style={{ color: "rgba(237,232,222,0.25)" }}>
                  PNG, JPEG, or SVG — max 2MB
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
            {logoError && (
              <p className="text-xs mt-2" style={{ color: "#e63946" }}>
                {logoError}
              </p>
            )}
          </Field>

          {/* Quick presets */}
          <Field label="Quick presets">
            <div className="flex flex-wrap gap-2">
              {BRAND_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg transition-colors"
                  style={{ background: "rgba(237,232,222,0.04)", border: "1px solid rgba(237,232,222,0.1)" }}
                >
                  <div className="flex gap-1">
                    {[preset.primary, preset.accent, preset.success].map((c, i) => (
                      <span key={i} className="block rounded-full" style={{ width: 14, height: 14, background: c }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(237,232,222,0.7)" }}>{preset.name}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Color pickers */}
          {colorRoles.map(({ key, label }) => (
            <Field key={key} label={label}>
              <div className="flex gap-2 mb-2">
                {SWATCH_OPTIONS[key].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => selectSwatch(key, color)}
                    className="rounded-full transition-all"
                    style={{
                      width: 28,
                      height: 28,
                      background: color,
                      outline: colorValues[key] === color ? "2px solid #E9C03A" : "2px solid transparent",
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="block rounded" style={{ width: 16, height: 16, background: colorValues[key], flexShrink: 0 }} />
                <input
                  type="text"
                  value={hexInputs[key]}
                  onChange={(e) => handleHexInput(key, e.target.value)}
                  className="rounded px-2 py-1 font-mono text-xs outline-none w-24"
                  style={inputStyle}
                />
              </div>
            </Field>
          ))}

          {/* White-label toggle (Pro only) */}
          {plan === "pro" && (
            <div className="flex items-center gap-3">
              <ToggleSwitch checked={whiteLabel} onChange={setWhiteLabel} />
              <span className="text-sm" style={{ color: "rgba(237,232,222,0.7)" }}>
                Remove &quot;Powered by Candela&quot; branding
              </span>
            </div>
          )}

          <SaveBar saving={saving} saved={saved} onClick={handleSave} label="Save brand settings" error={saveError} />
        </div>

        {/* Live preview */}
        <div className="lg:w-[300px] flex-shrink-0">
          <p className="text-xs uppercase mb-3" style={labelStyle}>
            Live preview
          </p>
          <div className="overflow-hidden" style={{ borderRadius: 12, width: 300 }}>
            <div style={{ background: primary, padding: 20 }}>
              {logoPreview || logoUrl ? (
                <img src={logoPreview || logoUrl || ""} alt="Logo" style={{ maxHeight: 36, objectFit: "contain" }} />
              ) : (
                <div
                  className="flex items-center justify-center rounded-full text-sm font-bold"
                  style={{ width: 40, height: 40, background: accent, color: primary }}
                >
                  {initials}
                </div>
              )}
              <p className="font-medium" style={{ fontSize: 14, color: textOnPrimary, marginTop: 8 }}>
                {orgDisplayName || "Your Organization"}
              </p>
              <div className="flex gap-1.5" style={{ marginTop: 16 }}>
                {[
                  { stat: "421", label: "Served" },
                  { stat: "89%", label: "Placement" },
                  { stat: "94%", label: "Satisfaction" },
                ].map((kpi) => (
                  <div key={kpi.label} className="flex-1" style={{ background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: "8px 10px" }}>
                    <p className="font-bold" style={{ fontSize: 13, color: accent }}>
                      {kpi.stat}
                    </p>
                    <p style={{ fontSize: 9, color: textOnPrimary, opacity: 0.6 }}>{kpi.label}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-hidden" style={{ marginTop: 16, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                <div style={{ width: "72%", height: "100%", background: accent, borderRadius: 2 }} />
              </div>
            </div>
            {!whiteLabel && (
              <div style={{ background: primary, padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: 10, color: textOnPrimary, opacity: 0.5 }}>Powered by Candela</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Section 4 — Voice & Style
   ═══════════════════════════════════════════════════ */
function VoiceStyleSection({ orgId, plan }: { orgId: string; plan: string | null }) {
  const supabase = createClient();
  const [tone, setTone] = useState("professional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [terminology, setTerminology] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const isGrowthOrPro = plan === "growth" || plan === "pro";

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("orgs")
        .select("voice_tone, voice_custom_instructions, voice_terminology")
        .eq("id", orgId)
        .single();
      if (data) {
        setTone(data.voice_tone ?? "professional");
        setCustomInstructions(data.voice_custom_instructions ?? "");
        setTerminology(data.voice_terminology ?? "");
      }
      setLoading(false);
    }
    load();
  }, [orgId, supabase]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const payload: Record<string, string> = { voice_tone: tone };
    if (isGrowthOrPro) {
      payload.voice_custom_instructions = customInstructions;
      payload.voice_terminology = terminology;
    }
    await supabase.from("orgs").update(payload).eq("id", orgId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <SectionLoader />;

  const tones = [
    { value: "professional", label: "Professional", desc: "Formal language, structured outputs. Best for government and institutional funders." },
    { value: "warm", label: "Warm", desc: "Empathetic and human tone. Great for community-focused reports and family foundations." },
    { value: "plain", label: "Plain Language", desc: "Clear, simple phrasing. Ideal for public-facing summaries and broad audiences." },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Voice & Style"
        description="Control the tone and style of AI-generated grant narratives."
      />

      {/* Tone selector */}
      <Field label="Tone">
        <div className="flex flex-col gap-2">
          {tones.map((t) => (
            <label
              key={t.value}
              className="flex items-start gap-3 rounded-lg p-4 cursor-pointer transition-colors"
              style={{
                ...cardStyle,
                background: tone === t.value ? "rgba(233,192,58,0.08)" : "rgba(237,232,222,0.04)",
                border: tone === t.value ? "1px solid rgba(233,192,58,0.3)" : "1px solid rgba(237,232,222,0.1)",
              }}
            >
              <input
                type="radio"
                name="tone"
                value={t.value}
                checked={tone === t.value}
                onChange={(e) => setTone(e.target.value)}
                className="mt-0.5 accent-yellow-500"
              />
              <div>
                <p className="text-sm font-medium" style={{ color: "#EDE8DE" }}>
                  {t.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(237,232,222,0.45)" }}>
                  {t.desc}
                </p>
              </div>
            </label>
          ))}
        </div>
      </Field>

      {/* Growth/Pro: custom instructions & terminology */}
      {isGrowthOrPro ? (
        <>
          <Field label="Custom instructions">
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Always refer to participants as 'community members'. Avoid jargon..."
              rows={4}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
              style={inputStyle}
            />
          </Field>
          <Field label="Terminology rules">
            <textarea
              value={terminology}
              onChange={(e) => setTerminology(e.target.value)}
              placeholder={"e.g.\nUse 'participants' not 'clients'\nUse 'unhoused' not 'homeless'"}
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
              style={inputStyle}
            />
          </Field>
        </>
      ) : (
        <div className="rounded-lg p-4" style={cardStyle}>
          <p className="text-xs" style={{ color: "rgba(237,232,222,0.45)" }}>
            <Crown className="w-3.5 h-3.5 inline mr-1" style={{ color: "#E9C03A" }} />
            Custom instructions and terminology rules are available on Growth and Pro plans.
          </p>
        </div>
      )}

      <SaveBar saving={saving} saved={saved} onClick={handleSave} label="Save voice settings" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Section 5 — Team
   ═══════════════════════════════════════════════════ */
function TeamSection({ orgId }: { orgId: string }) {
  const supabase = createClient();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch active members
      const { data: orgUsers } = await supabase
        .from("org_users")
        .select("id, user_id, role, users:user_id(email)")
        .eq("org_id", orgId);

      if (orgUsers) {
        setMembers(
          orgUsers.map((ou: Record<string, unknown>) => ({
            id: ou.id as string,
            user_id: ou.user_id as string,
            role: (ou.role as string) ?? "member",
            email: ((ou.users as Record<string, unknown>)?.email as string) ?? "Unknown",
          }))
        );
      }

      // Fetch pending invites
      const { data: pendingInvites } = await supabase
        .from("team_invites")
        .select("id, email, role, created_at")
        .eq("org_id", orgId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingInvites) {
        setInvites(pendingInvites as PendingInvite[]);
      }

      setLoading(false);
    }
    load();
  }, [orgId, supabase]);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setSending(true);
    setSendError("");
    setSendSuccess(false);
    try {
      const { error } = await supabase.from("team_invites").insert({
        org_id: orgId,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        status: "pending",
      });
      if (error) throw error;
      setInvites((prev) => [
        { id: crypto.randomUUID(), email: inviteEmail.trim().toLowerCase(), role: inviteRole, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setInviteEmail("");
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 2000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send invite.");
    } finally {
      setSending(false);
    }
  }

  async function removeMember(memberId: string) {
    await supabase.from("org_users").delete().eq("id", memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function cancelInvite(inviteId: string) {
    await supabase.from("team_invites").delete().eq("id", inviteId);
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
  }

  if (loading) return <SectionLoader />;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Team" description="Manage team members and invitations." />

      {/* Role descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg p-4" style={cardStyle}>
          <p className="text-sm font-medium mb-1" style={{ color: "#EDE8DE" }}>
            Admin
          </p>
          <p className="text-xs" style={{ color: "rgba(237,232,222,0.45)" }}>
            Manages Org Settings, brand kit, billing, and sees all projects.
          </p>
        </div>
        <div className="rounded-lg p-4" style={cardStyle}>
          <p className="text-sm font-medium mb-1" style={{ color: "#EDE8DE" }}>
            Member
          </p>
          <p className="text-xs" style={{ color: "rgba(237,232,222,0.45)" }}>
            Creates and works on projects. Sees all org projects.
          </p>
        </div>
      </div>

      {/* Invite form */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <p className="text-xs uppercase mb-2" style={labelStyle}>
            Invite by email
          </p>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@org.com"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleInvite();
            }}
          />
        </div>
        <div>
          <p className="text-xs uppercase mb-2" style={labelStyle}>
            Role
          </p>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-sm outline-none appearance-none"
            style={{ ...inputStyle, minWidth: 110 }}
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
        </div>
        <button
          onClick={handleInvite}
          disabled={sending || !inviteEmail.trim()}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          style={{ ...goldBtn, opacity: sending || !inviteEmail.trim() ? 0.5 : 1 }}
        >
          <Send className="w-3.5 h-3.5" />
          {sending ? "Sending…" : "Send invite"}
        </button>
      </div>
      {sendSuccess && (
        <p className="flex items-center gap-1 text-xs" style={{ color: "#1D9E75" }}>
          <Check className="w-3.5 h-3.5" /> Invite sent
        </p>
      )}
      {sendError && (
        <p className="text-xs" style={{ color: "#e63946" }}>
          {sendError}
        </p>
      )}

      {/* Active members */}
      <div>
        <p className="text-xs uppercase mb-3" style={labelStyle}>
          Active members ({members.length})
        </p>
        {members.length === 0 ? (
          <p className="text-sm" style={{ color: "rgba(237,232,222,0.35)" }}>
            No team members yet.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={cardStyle}
              >
                <div>
                  <p className="text-sm" style={{ color: "#EDE8DE" }}>
                    {member.email}
                  </p>
                  <p className="text-xs capitalize" style={{ color: "rgba(237,232,222,0.45)" }}>
                    {member.role}
                  </p>
                </div>
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-xs px-3 py-1 rounded transition-colors hover:bg-red-500/10"
                  style={{ color: "rgba(237,232,222,0.4)" }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div>
          <p className="text-xs uppercase mb-3" style={labelStyle}>
            Pending invites ({invites.length})
          </p>
          <div className="flex flex-col gap-1">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={cardStyle}
              >
                <div>
                  <p className="text-sm" style={{ color: "#EDE8DE" }}>
                    {invite.email}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(237,232,222,0.35)" }}>
                    {invite.role} &middot; Invited{" "}
                    {new Date(invite.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => cancelInvite(invite.id)}
                  className="p-1 rounded transition-colors hover:bg-red-500/10"
                  style={{ color: "rgba(237,232,222,0.4)" }}
                  title="Cancel invite"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Shared sub-components
   ═══════════════════════════════════════════════════ */

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-2">
      <h2
        className="text-xl font-semibold"
        style={{ color: "#EDE8DE", fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        {title}
      </h2>
      <p className="text-sm mt-0.5" style={{ color: "rgba(237,232,222,0.45)" }}>
        {description}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase mb-2" style={labelStyle}>
        {label}
      </p>
      {children}
    </div>
  );
}

function SaveBar({
  saving,
  saved,
  onClick,
  label,
  error,
}: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
  label: string;
  error?: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={saving}
        className="text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
        style={{ ...goldBtn, opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Saving…" : label}
      </button>
      {saved && (
        <span className="flex items-center gap-1 text-sm" style={{ color: "#1D9E75" }}>
          <Check className="w-4 h-4" /> Saved
        </span>
      )}
      {error && (
        <span className="text-sm" style={{ color: "#e63946" }}>
          {error}
        </span>
      )}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative rounded-full transition-colors"
      style={{
        width: 40,
        height: 22,
        background: checked ? "#1D9E75" : "rgba(237,232,222,0.15)",
        flexShrink: 0,
      }}
    >
      <span
        className="absolute top-0.5 block rounded-full bg-white transition-all"
        style={{ width: 18, height: 18, left: checked ? 19 : 3 }}
      />
    </button>
  );
}

function SectionLoader() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
      <p className="text-sm" style={{ color: "rgba(237,232,222,0.4)" }}>Loading…</p>
    </div>
  );
}
