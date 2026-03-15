"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BRAND_PRESETS, SWATCH_OPTIONS, DEFAULT_BRAND } from "@/lib/brand-kit/types";
import type { BrandTokens } from "@/lib/brand-kit/types";
import { Upload, Check } from "lucide-react";

type SwatchRole = "primary" | "accent" | "success";

export default function BrandKitPage() {
  const router = useRouter();
  const supabase = createClient();

  const [orgId, setOrgId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Brand state
  const [primary, setPrimary] = useState(DEFAULT_BRAND.primary);
  const [accent, setAccent] = useState(DEFAULT_BRAND.accent);
  const [success, setSuccess] = useState(DEFAULT_BRAND.success);
  const [textOnPrimary, setTextOnPrimary] = useState(DEFAULT_BRAND.textOnPrimary);
  const [orgDisplayName, setOrgDisplayName] = useState("");
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Hex input state (allows typing partial values)
  const [hexInputs, setHexInputs] = useState({ primary: "", accent: "", success: "" });

  // Logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Display name debounce
  const nameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load org data on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: orgUser } = await supabase
        .from("org_users")
        .select("org_id")
        .eq("user_id", user.id)
        .single();
      if (!orgUser?.org_id) { setLoading(false); return; }

      const { data: org } = await supabase
        .from("orgs")
        .select("plan")
        .eq("id", orgUser.org_id)
        .single();

      if (!org || org.plan === "starter") {
        router.push("/app/settings");
        return;
      }

      setOrgId(orgUser.org_id);
      setPlan(org.plan);

      const { data: brandKit } = await supabase
        .from("brand_kits")
        .select("brand_primary, brand_accent, brand_success, brand_text, logo_url, org_display_name, remove_candela_footer")
        .eq("org_id", orgUser.org_id)
        .single();

      if (brandKit) {
        const p = brandKit.brand_primary ?? DEFAULT_BRAND.primary;
        const a = brandKit.brand_accent ?? DEFAULT_BRAND.accent;
        const s = brandKit.brand_success ?? DEFAULT_BRAND.success;
        setPrimary(p);
        setAccent(a);
        setSuccess(s);
        setHexInputs({ primary: p, accent: a, success: s });
        setTextOnPrimary(brandKit.brand_text ?? DEFAULT_BRAND.textOnPrimary);
        setOrgDisplayName(brandKit.org_display_name ?? "");
        setWhiteLabel(brandKit.remove_candela_footer ?? false);
        setLogoUrl(brandKit.logo_url ?? null);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced display name save
  const handleNameChange = useCallback((value: string) => {
    setOrgDisplayName(value);
    if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    nameTimerRef.current = setTimeout(async () => {
      if (!orgId) return;
      await supabase.from("brand_kits").update({ org_display_name: value }).eq("org_id", orgId);
    }, 500);
  }, [orgId, supabase]);

  // File validation
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

  // Hex validation
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

  // Save all
  async function handleSave() {
    if (!orgId) return;
    setSaving(true);
    setSaveError("");
    setSaved(false);

    try {
      // Upload logo if new file selected
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop() ?? "png";
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("brand-assets")
          .upload(`${orgId}/logo-${Date.now()}.${ext}`, logoFile, { cacheControl: "3600", upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from("brand-assets")
          .getPublicUrl(uploadData.path);
        finalLogoUrl = publicUrl;
      }

      const brandPayload = {
        brand_primary: primary,
        brand_accent: accent,
        brand_success: success,
        brand_text: textOnPrimary,
        logo_url: finalLogoUrl,
        org_display_name: orgDisplayName,
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

  // Org initials for preview
  const initials = orgDisplayName
    ? orgDisplayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "CA";

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: "#0f1c27" }}>
        <p className="font-jost text-sm" style={{ color: "rgba(237,232,222,0.4)" }}>Loading…</p>
      </div>
    );
  }

  const colorRoles: { key: SwatchRole; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "accent", label: "Accent" },
    { key: "success", label: "Success" },
  ];

  const colorValues: Record<SwatchRole, string> = { primary, accent, success };

  return (
    <div className="min-h-full" style={{ background: "#0f1c27" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        {/* Page header */}
        <a
          href="/app"
          className="inline-flex items-center gap-1 font-jost text-xs transition-colors mb-6"
          style={{ color: "rgba(237,232,222,0.4)" }}
        >
          ← Back to Dashboard
        </a>
        <h1
          className="font-fraunces text-2xl mb-1"
          style={{ color: "#EDE8DE" }}
        >
          Brand Kit
        </h1>
        <p
          className="font-jost text-sm mb-10"
          style={{ color: "rgba(237,232,222,0.45)" }}
        >
          Customize how your reports and dashboards look.
        </p>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left: Controls */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Section 1 — Org display name */}
            <section>
              <label
                className="block font-['DM_Sans'] text-xs uppercase mb-2"
                style={{ color: "rgba(237,232,222,0.5)", letterSpacing: "0.08em" }}
              >
                Organization display name
              </label>
              <input
                type="text"
                value={orgDisplayName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Denver Works"
                className="w-full rounded-lg px-3 py-2.5 font-['DM_Sans'] text-sm outline-none transition-colors"
                style={{
                  background: "rgba(237,232,222,0.06)",
                  border: "1px solid rgba(237,232,222,0.12)",
                  color: "#EDE8DE",
                }}
              />
            </section>

            {/* Section 2 — Logo upload */}
            <section>
              <label
                className="block font-['DM_Sans'] text-xs uppercase mb-2"
                style={{ color: "rgba(237,232,222,0.5)", letterSpacing: "0.08em" }}
              >
                Logo
              </label>

              {(logoPreview || logoUrl) ? (
                <div
                  className="flex items-center gap-4 rounded-lg px-4 py-4"
                  style={{
                    border: "1px dashed rgba(237,232,222,0.2)",
                    background: "rgba(237,232,222,0.02)",
                  }}
                >
                  <img
                    src={logoPreview || logoUrl || ""}
                    alt="Logo"
                    style={{ maxHeight: 80, objectFit: "contain" }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-['DM_Sans'] text-xs px-3 py-1.5 rounded-md transition-colors"
                    style={{
                      background: "rgba(237,232,222,0.1)",
                      color: "#EDE8DE",
                      border: "1px solid rgba(237,232,222,0.15)",
                    }}
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors"
                  style={{
                    height: 160,
                    border: "1px dashed rgba(237,232,222,0.2)",
                    background: dragOver ? "rgba(237,232,222,0.06)" : "rgba(237,232,222,0.02)",
                    borderRadius: 8,
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <Upload className="w-5 h-5 mb-2" style={{ color: "rgba(237,232,222,0.3)" }} />
                  <p className="font-['DM_Sans'] text-xs" style={{ color: "rgba(237,232,222,0.4)" }}>
                    Drag & drop or click to upload
                  </p>
                  <p className="font-['DM_Sans'] text-[10px] mt-1" style={{ color: "rgba(237,232,222,0.25)" }}>
                    PNG, JPEG, or SVG — max 2MB
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />

              {logoError && (
                <p className="font-['DM_Sans'] text-xs mt-2" style={{ color: "#e63946" }}>
                  {logoError}
                </p>
              )}
            </section>

            {/* Section 3 — Quick presets */}
            <section>
              <label
                className="block font-['DM_Sans'] text-xs uppercase mb-3"
                style={{ color: "rgba(237,232,222,0.5)", letterSpacing: "0.08em" }}
              >
                Quick presets
              </label>
              <div className="flex flex-wrap gap-2">
                {BRAND_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg transition-colors"
                    style={{
                      background: "rgba(237,232,222,0.04)",
                      border: "1px solid rgba(237,232,222,0.1)",
                    }}
                  >
                    <div className="flex gap-1">
                      {[preset.primary, preset.accent, preset.success].map((c, i) => (
                        <span
                          key={i}
                          className="block rounded-full"
                          style={{ width: 14, height: 14, background: c }}
                        />
                      ))}
                    </div>
                    <span
                      className="font-['DM_Sans']"
                      style={{ fontSize: 11, color: "rgba(237,232,222,0.7)" }}
                    >
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Section 4 — Color pickers */}
            <section className="flex flex-col gap-6">
              {colorRoles.map(({ key, label }) => (
                <div key={key}>
                  <label
                    className="block font-['DM_Sans'] text-xs uppercase mb-2"
                    style={{ color: "rgba(237,232,222,0.5)", letterSpacing: "0.08em" }}
                  >
                    {label}
                  </label>
                  {/* Swatch row */}
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
                  {/* Hex input */}
                  <div className="flex items-center gap-2">
                    <span
                      className="block rounded"
                      style={{
                        width: 16,
                        height: 16,
                        background: colorValues[key],
                        flexShrink: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={hexInputs[key]}
                      onChange={(e) => handleHexInput(key, e.target.value)}
                      className="rounded px-2 py-1 font-mono text-xs outline-none w-24"
                      style={{
                        background: "rgba(237,232,222,0.06)",
                        border: "1px solid rgba(237,232,222,0.12)",
                        color: "#EDE8DE",
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Section 6 — White-label toggle (Pro only) */}
            {plan === "pro" && (
              <section>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setWhiteLabel(!whiteLabel)}
                    className="relative rounded-full transition-colors"
                    style={{
                      width: 40,
                      height: 22,
                      background: whiteLabel ? "#1D9E75" : "rgba(237,232,222,0.15)",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="absolute top-0.5 block rounded-full bg-white transition-all"
                      style={{
                        width: 18,
                        height: 18,
                        left: whiteLabel ? 19 : 3,
                      }}
                    />
                  </button>
                  <span
                    className="font-['DM_Sans'] text-sm"
                    style={{ color: "rgba(237,232,222,0.7)" }}
                  >
                    Remove &quot;Powered by Candela&quot; branding
                  </span>
                </div>
              </section>
            )}

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="font-['DM_Sans'] text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                style={{
                  background: "#E9C03A",
                  color: "#1B2B3A",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving…" : "Save brand settings"}
              </button>

              {saved && (
                <span className="flex items-center gap-1 font-['DM_Sans'] text-sm" style={{ color: "#1D9E75" }}>
                  <Check className="w-4 h-4" />
                  Saved ✓
                </span>
              )}

              {saveError && (
                <span className="font-['DM_Sans'] text-sm" style={{ color: "#e63946" }}>
                  {saveError}
                </span>
              )}
            </div>
          </div>

          {/* Right: Section 5 — Live preview card */}
          <div className="lg:w-[320px] flex-shrink-0">
            <label
              className="block font-['DM_Sans'] text-xs uppercase mb-3"
              style={{ color: "rgba(237,232,222,0.5)", letterSpacing: "0.08em" }}
            >
              Live preview
            </label>
            <div
              className="overflow-hidden"
              style={{ borderRadius: 12, width: 320 }}
            >
              {/* Card body */}
              <div style={{ background: primary, padding: 20 }}>
                {/* Logo or initials */}
                {(logoPreview || logoUrl) ? (
                  <img
                    src={logoPreview || logoUrl || ""}
                    alt="Logo"
                    style={{ maxHeight: 36, objectFit: "contain" }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center rounded-full font-['DM_Sans'] text-sm font-bold"
                    style={{
                      width: 40,
                      height: 40,
                      background: accent,
                      color: primary,
                    }}
                  >
                    {initials}
                  </div>
                )}

                {/* Org name */}
                <p
                  className="font-['DM_Sans'] font-medium"
                  style={{
                    fontSize: 14,
                    color: textOnPrimary,
                    marginTop: 8,
                  }}
                >
                  {orgDisplayName || "Your Organization"}
                </p>

                {/* KPI row */}
                <div className="flex gap-1.5" style={{ marginTop: 16 }}>
                  {[
                    { stat: "421", label: "Lives Changed" },
                    { stat: "89%", label: "Placement" },
                    { stat: "94%", label: "Satisfaction" },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="flex-1 rounded-md"
                      style={{
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: 6,
                        padding: "8px 10px",
                      }}
                    >
                      <p
                        className="font-['DM_Sans'] font-bold"
                        style={{ fontSize: 13, color: accent }}
                      >
                        {kpi.stat}
                      </p>
                      <p
                        className="font-['DM_Sans']"
                        style={{
                          fontSize: 9,
                          color: textOnPrimary,
                          opacity: 0.6,
                        }}
                      >
                        {kpi.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div
                  className="overflow-hidden"
                  style={{
                    marginTop: 16,
                    height: 4,
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 2,
                  }}
                >
                  <div
                    style={{
                      width: "72%",
                      height: "100%",
                      background: accent,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              {!whiteLabel && (
                <div
                  style={{
                    background: primary,
                    padding: "12px 20px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p
                    className="font-['DM_Sans']"
                    style={{
                      fontSize: 10,
                      color: textOnPrimary,
                      opacity: 0.5,
                    }}
                  >
                    Powered by Candela
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
