"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Upload } from "lucide-react";
import type { BrandKit } from "@/app/(app)/app/grants-reporting-suite/context/GrantsWizardContext";

interface BrandKitFormProps {
  isPro: boolean;
  onContinue: (kit: BrandKit) => void;
}

export default function BrandKitForm({ isPro, onContinue }: BrandKitFormProps) {
  const [primary, setPrimary] = useState("#1B2B3A");
  const [accent, setAccent] = useState("#E9C03A");
  const [success, setSuccess] = useState("#3A6B8A");
  const [orgName, setOrgName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [removeFooter, setRemoveFooter] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `brand-logos/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("brand-assets").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    }
    setUploading(false);
  }

  function handleSubmit() {
    onContinue({
      brandPrimary: primary,
      brandAccent: accent,
      brandSuccess: success,
      brandText: "#EDE8DE",
      logoUrl,
      orgDisplayName: orgName,
      removeCandelaFooter: removeFooter,
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          {/* Logo upload */}
          <div>
            <label className="block text-xs font-medium text-midnight/60 mb-1.5" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Organization Logo
            </label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-midnight/15 rounded-lg text-sm text-midnight/40 hover:border-midnight/30 transition-colors w-full justify-center"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              disabled={uploading}
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-cerulean border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {logoUrl ? "Replace Logo" : "Upload Logo"}
            </button>
            {logoUrl && (
              <div className="mt-2 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo preview" className="h-10 object-contain" />
              </div>
            )}
          </div>

          {/* Org name */}
          <div>
            <label className="block text-xs font-medium text-midnight/60 mb-1.5" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Your Organization"
              className="w-full px-3 py-2 border border-midnight/10 rounded-lg text-sm text-midnight placeholder:text-midnight/25 focus:outline-none focus:ring-2 focus:ring-cerulean/30 focus:border-cerulean bg-white"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            />
          </div>

          {/* Color pickers */}
          <ColorPicker label="Primary Color" value={primary} onChange={setPrimary} />
          <ColorPicker label="Accent Color" value={accent} onChange={setAccent} />
          <ColorPicker label="Success Color" value={success} onChange={setSuccess} />

          {/* Pro: remove footer */}
          {isPro && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={removeFooter}
                onChange={(e) => setRemoveFooter(e.target.checked)}
                className="w-4 h-4 rounded border-midnight/20 text-cerulean focus:ring-cerulean/30"
              />
              <span className="text-xs text-midnight/60" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Remove &quot;Powered by Candela&quot; footer
              </span>
            </label>
          )}
        </div>

        {/* Right: Preview */}
        <div>
          <label className="block text-xs font-medium text-midnight/60 mb-1.5" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Live Preview
          </label>
          <div className="rounded-xl overflow-hidden border border-midnight/5 shadow-sm">
            <div className="p-4" style={{ backgroundColor: primary }}>
              <div className="flex items-center gap-2 mb-3">
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-6 object-contain" />
                )}
                <span className="text-sm font-medium" style={{ color: "#EDE8DE", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {orgName || "Your Organization"}
                </span>
              </div>
              <div className="text-xs" style={{ color: "#EDE8DE", opacity: 0.7, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Impact Report Preview
              </div>
            </div>
            <div className="p-4 bg-white space-y-3">
              <div className="h-3 rounded-full bg-midnight/5 overflow-hidden">
                <div className="h-full rounded-full w-3/4" style={{ backgroundColor: accent }} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: `${success}15` }}>
                  <div className="text-lg font-bold" style={{ color: success, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>247</div>
                  <div className="text-[10px]" style={{ color: `${success}99`, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Served</div>
                </div>
                <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: `${accent}15` }}>
                  <div className="text-lg font-bold" style={{ color: accent, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>89%</div>
                  <div className="text-[10px]" style={{ color: `${accent}99`, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Completion</div>
                </div>
              </div>
              {!removeFooter && (
                <div className="text-[9px] text-midnight/20 text-center pt-2" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Powered by Candela
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2.5 bg-cerulean text-white rounded-lg text-sm font-medium hover:bg-cerulean-dark transition-colors"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-midnight/60 mb-1.5" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-midnight/10"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-1.5 border border-midnight/10 rounded-lg text-xs font-mono text-midnight focus:outline-none focus:ring-2 focus:ring-cerulean/30 focus:border-cerulean bg-white"
        />
      </div>
    </div>
  );
}
