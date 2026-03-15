"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGrantsWizard } from "../context/GrantsWizardContext";
import { createClient } from "@/lib/supabase/client";
import { Save, Download, Send } from "lucide-react";

const VIEW_LABELS: Record<string, string> = {
  staff_dashboard: "Staff Dashboard",
  funder_public: "Funder Public View",
  embed_widget: "Embed Widget",
  board_deck: "Board Deck Slide",
  command_center: "Funder Command Center",
  logic_model: "Logic Model",
};

export default function OutputPage() {
  const router = useRouter();
  const { runId, selectedViews } = useGrantsWizard();
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>("");
  const [editInstruction, setEditInstruction] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const viewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("grs-outputs");
    if (stored) {
      const parsed = JSON.parse(stored);
      setOutputs(parsed);
      setActiveTab(Object.keys(parsed)[0] ?? "");
    } else if (selectedViews.length === 0) {
      router.replace("/app/impact-studio/views");
    }
  }, [selectedViews, router]);

  // ---------------------------------------------------------------------------
  // Register bulletproof global fallbacks for every handler the AI might use.
  // These are defined once on window so onclick="toggleNode(...)" never throws.
  // If the AI's own <script> redefines them, that's fine — it just overwrites.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    /* ---------- toggleNode ---------- */
    (window as never as Record<string, unknown>).toggleNode = function toggleNode(id: string) {
      // Close any previously-open detail card
      document
        .querySelectorAll(".detail-card, .detail-panel, [data-detail]")
        .forEach((el) => {
          if (el.id !== `detail-${id}`) (el as HTMLElement).style.display = "none";
        });

      // Toggle 'active' class on the clicked node
      const node =
        document.getElementById(id) ||
        document.getElementById(`node-${id}`) ||
        document.querySelector(`[data-node="${id}"]`);
      if (node) node.classList.toggle("active");

      // Show / hide the matching detail panel
      const detail =
        document.getElementById(`detail-${id}`) ||
        document.querySelector(`[data-detail="${id}"]`);
      if (detail) {
        detail.style.display =
          detail.style.display === "none" || !detail.style.display
            ? "block"
            : "none";
      }
    };

    /* ---------- closeDetail ---------- */
    (window as never as Record<string, unknown>).closeDetail = function closeDetail(id?: string) {
      if (id) {
        const el =
          document.getElementById(`detail-${id}`) ||
          document.querySelector(`[data-detail="${id}"]`);
        if (el) el.style.display = "none";
      } else {
        document
          .querySelectorAll(".detail-card, .detail-panel, [data-detail]")
          .forEach((el) => ((el as HTMLElement).style.display = "none"));
      }
      document
        .querySelectorAll(".active")
        .forEach((el) => el.classList.remove("active"));
    };

    /* ---------- toggleStoryMode ---------- */
    (window as never as Record<string, unknown>).toggleStoryMode = function toggleStoryMode() {
      const overlay =
        document.getElementById("story-overlay") ||
        document.getElementById("story-mode") ||
        document.querySelector("[data-story]") ||
        document.querySelector(".story-bar, .story-mode-bar");
      if (overlay) {
        overlay.style.display =
          overlay.style.display === "none" || !overlay.style.display
            ? "flex"
            : "none";
      }
    };

    /* ---------- changePeriod ---------- */
    (window as never as Record<string, unknown>).changePeriod = function changePeriod(period: string) {
      document
        .querySelectorAll("[data-period]")
        .forEach((el) => {
          (el as HTMLElement).style.display =
            el.getAttribute("data-period") === period || el.getAttribute("data-period") === "all"
              ? ""
              : "none";
        });
      // Update any period label
      const label = document.getElementById("current-period") || document.querySelector(".period-label");
      if (label) label.textContent = period;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // After the generated HTML is set as innerHTML, find every <script> tag inside
  // the container, create a real <script> element, and append it so the browser
  // actually executes the AI-generated JavaScript.
  // ---------------------------------------------------------------------------
  const activateScripts = useCallback(() => {
    const container = viewContainerRef.current;
    if (!container) return;

    const scripts = container.querySelectorAll("script");
    scripts.forEach((orig) => {
      const replacement = document.createElement("script");
      // Copy attributes (e.g. type, src)
      Array.from(orig.attributes).forEach((attr) =>
        replacement.setAttribute(attr.name, attr.value)
      );
      replacement.textContent = orig.textContent;
      orig.parentNode?.replaceChild(replacement, orig);
    });
  }, []);

  // Re-activate scripts every time the active tab or outputs change
  useEffect(() => {
    activateScripts();
  }, [activeTab, outputs, activateScripts]);

  async function handleMinorEdit() {
    if (!editInstruction.trim() || !activeTab) return;
    setEditing(true);
    try {
      const res = await fetch("/api/impact/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewHtml: outputs[activeTab],
          instruction: editInstruction,
          viewType: activeTab,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOutputs((prev) => ({ ...prev, [activeTab]: data.html }));
        setEditInstruction("");
      }
    } catch {
      // silently fail
    }
    setEditing(false);
  }

  async function handleSave() {
    if (!runId) return;
    setSaving(true);
    const supabase = createClient();

    const entries = Object.entries(outputs);
    for (const [viewType, html] of entries) {
      await supabase.from("generated_views").upsert(
        { run_id: runId, view_type: viewType, output_html: html },
        { onConflict: "run_id,view_type" }
      );
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const tabs = Object.keys(outputs);

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-cerulean border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1
            className="text-2xl font-semibold text-midnight mb-1"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Generated Output
          </h1>
          <p className="text-sm text-midnight/50" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Review and refine your generated views.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !runId}
            className="flex items-center gap-2 px-4 py-2 bg-cerulean text-white rounded-lg text-sm font-medium hover:bg-cerulean-dark transition-colors disabled:opacity-40"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
          {/* TODO: Implement export functionality */}
          <button
            className="flex items-center gap-2 px-4 py-2 border border-midnight/10 text-midnight/50 rounded-lg text-sm font-medium hover:bg-midnight/5 transition-colors"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-1 mb-4 bg-midnight/[0.03] rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white text-midnight shadow-sm"
                  : "text-midnight/40 hover:text-midnight/60"
              }`}
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              {VIEW_LABELS[tab] ?? tab}
            </button>
          ))}
        </div>
      )}

      {/* View output */}
      <div className="bg-white rounded-xl border border-midnight/5 overflow-hidden mb-4">
        <div
          ref={viewContainerRef}
          className="p-6"
          dangerouslySetInnerHTML={{ __html: outputs[activeTab] ?? "" }}
        />
      </div>

      {/* Minor edit */}
      <div className="flex gap-2">
        <input
          type="text"
          value={editInstruction}
          onChange={(e) => setEditInstruction(e.target.value)}
          placeholder="Describe a minor edit (e.g., 'Change the title to Q1 Report')"
          className="flex-1 px-4 py-2.5 border border-midnight/10 rounded-lg text-sm text-midnight placeholder:text-midnight/25 focus:outline-none focus:ring-2 focus:ring-cerulean/30 focus:border-cerulean bg-white"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          onKeyDown={(e) => e.key === "Enter" && handleMinorEdit()}
        />
        <button
          onClick={handleMinorEdit}
          disabled={!editInstruction.trim() || editing}
          className="flex items-center gap-2 px-4 py-2.5 bg-midnight text-stone rounded-lg text-sm font-medium hover:bg-midnight-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {editing ? (
            <div className="w-4 h-4 border-2 border-stone border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Apply
        </button>
      </div>
    </div>
  );
}
