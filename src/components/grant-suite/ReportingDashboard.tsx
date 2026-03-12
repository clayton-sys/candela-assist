"use client";

import { useState, useRef, useCallback } from "react";
import { COLUMNS, type LogicModelData, type SelectedCard } from "./LogicModelGrid";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportingRow {
  id?: string;
  card_key: string;
  reporting_period: string;
  current_value: number | null;
  target_value: number | null;
  notes: string | null;
  narrative: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ReportingDashboardProps {
  selectedCard: SelectedCard;
  data: LogicModelData;
  logicModelId: string;
  programContext: {
    programName: string;
    vertical: string;
    population: string;
    theoryOfChange: string;
  };
  reportingData: ReportingRow[];
  onDataSaved: () => void;
  readOnly?: boolean;
  onNavigateToCard?: (column: string, index: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPercentColor(pct: number): string {
  if (pct >= 90) return "#16a34a";
  if (pct >= 70) return "#d97706";
  return "#dc2626";
}

function getTrend(current: number, previous: number): string {
  if (current > previous) return "↑";
  if (current < previous) return "↓";
  return "→";
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ReportingDashboard({
  selectedCard,
  data,
  logicModelId,
  programContext,
  reportingData,
  onDataSaved,
  readOnly = false,
  onNavigateToCard,
}: ReportingDashboardProps) {
  const colConfig = COLUMNS.find((c) => c.key === selectedCard.column);
  const accent = colConfig?.accent ?? "#1B2B3A";

  // ─── Step 5: Inputs/activities contextual message ─────────────────────
  if (selectedCard.column === "inputs" || selectedCard.column === "activities") {
    return (
      <InputsActivitiesMessage
        data={data}
        onNavigateToCard={onNavigateToCard}
      />
    );
  }

  const cardKey = `${selectedCard.column}_${selectedCard.index}`;
  const items = data[selectedCard.column as keyof LogicModelData];
  const cardItem = Array.isArray(items)
    ? (items[selectedCard.index] as Record<string, string>)
    : null;

  // Get target from card data
  const cardTarget = cardItem?.target
    ? parseFloat(cardItem.target.replace(/[^0-9.]/g, ""))
    : 0;

  // Filter reporting data for this card
  const cardReporting = reportingData
    .filter((r) => r.card_key === cardKey)
    .sort(
      (a, b) =>
        new Date(b.updated_at ?? b.created_at ?? "").getTime() -
        new Date(a.updated_at ?? a.created_at ?? "").getTime()
    );

  const latestEntry = cardReporting[0] ?? null;

  if (readOnly) {
    return (
      <ReadOnlyDashboard
        latestEntry={latestEntry}
        cardItem={cardItem}
        accent={accent}
      />
    );
  }

  return (
    <EditableDashboard
      selectedCard={selectedCard}
      cardKey={cardKey}
      cardItem={cardItem}
      cardTarget={cardTarget}
      accent={accent}
      logicModelId={logicModelId}
      programContext={programContext}
      data={data}
      cardReporting={cardReporting}
      latestEntry={latestEntry}
      onDataSaved={onDataSaved}
    />
  );
}

// ─── Editable Dashboard ──────────────────────────────────────────────────────

function EditableDashboard({
  selectedCard,
  cardKey,
  cardItem,
  cardTarget,
  accent,
  logicModelId,
  programContext,
  data,
  cardReporting,
  latestEntry,
  onDataSaved,
}: {
  selectedCard: SelectedCard;
  cardKey: string;
  cardItem: Record<string, string> | null;
  cardTarget: number;
  accent: string;
  logicModelId: string;
  programContext: ReportingDashboardProps["programContext"];
  data: LogicModelData;
  cardReporting: ReportingRow[];
  latestEntry: ReportingRow | null;
  onDataSaved: () => void;
}) {
  const [period, setPeriod] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [narrative, setNarrative] = useState(latestEntry?.narrative ?? null);
  const [narrativePeriod, setNarrativePeriod] = useState(
    latestEntry?.reporting_period ?? null
  );
  const [copied, setCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyNarrative, setHistoryNarrative] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<Array<Record<string, string>> | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Current display values (from latest entry or just-saved data)
  const displayCurrentValue =
    latestEntry?.current_value ?? null;
  const displayTargetValue =
    latestEntry?.target_value ?? cardTarget;
  const percentToGoal =
    displayTargetValue && displayTargetValue > 0 && displayCurrentValue != null
      ? Math.round((displayCurrentValue / displayTargetValue) * 100)
      : null;

  async function handleSave() {
    if (!period.trim()) return;
    setSaving(true);
    setSavedAt(null);

    try {
      const targetVal = cardTarget || parseFloat(currentValue) || 0;
      const res = await fetch("/api/grant-suite/generate-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logicModelId,
          cardColumn: selectedCard.column,
          cardIndex: selectedCard.index,
          cardData: cardItem,
          reportingPeriod: period,
          currentValue: parseFloat(currentValue) || 0,
          targetValue: targetVal,
          notes,
          programContext,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setNarrative(result.narrative);
        setNarrativePeriod(period);
        setSavedAt(new Date().toLocaleTimeString());
        onDataSaved();
      } else {
        const err = await res.json();
        console.error("Save failed:", err.error);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateNarrative() {
    if (!narrativePeriod) return;
    setSaving(true);
    try {
      const targetVal = cardTarget || parseFloat(currentValue) || 0;
      const res = await fetch("/api/grant-suite/generate-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logicModelId,
          cardColumn: selectedCard.column,
          cardIndex: selectedCard.index,
          cardData: cardItem,
          reportingPeriod: narrativePeriod,
          currentValue: displayCurrentValue ?? parseFloat(currentValue) ?? 0,
          targetValue: displayTargetValue,
          notes,
          programContext,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setNarrative(result.narrative);
        onDataSaved();
      }
    } catch (err) {
      console.error("Regenerate error:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    if (!narrative) return;
    navigator.clipboard.writeText(narrative).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── CSV helpers ──────────────────────────────────────────────────────────

  function downloadTemplate() {
    const outputCards = (data.outputs ?? []).map((c, i) => ({
      card_key: `outputs_${i}`,
      card_title: c.title,
      reporting_period: "",
      current_value: "",
      target_value: c.target?.replace(/[^0-9.]/g, "") ?? "",
      notes: "",
    }));
    const stCards = (data.shortTermOutcomes ?? []).map((c, i) => ({
      card_key: `shortTermOutcomes_${i}`,
      card_title: c.title,
      reporting_period: "",
      current_value: "",
      target_value: "",
      notes: "",
    }));
    const ltCards = (data.longTermOutcomes ?? []).map((c, i) => ({
      card_key: `longTermOutcomes_${i}`,
      card_title: c.title,
      reporting_period: "",
      current_value: "",
      target_value: "",
      notes: "",
    }));
    const allRows = [...outputCards, ...stCards, ...ltCards];
    const header = "card_key,card_title,reporting_period,current_value,target_value,notes";
    const csv =
      header +
      "\n" +
      allRows
        .map(
          (r) =>
            `${r.card_key},"${r.card_title}",${r.reporting_period},${r.current_value},${r.target_value},${r.notes}`
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${programContext.programName.replace(/\s+/g, "-")}-reporting-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1).map((line) => {
        const vals = line.match(/(".*?"|[^,]+)/g) ?? [];
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = (vals[i] ?? "").trim().replace(/^"|"$/g, "");
        });
        return row;
      });
      // Filter rows that have actual data
      const validRows = rows.filter(
        (r) => r.card_key && r.reporting_period && r.current_value
      );
      setCsvPreview(validRows);
    };
    reader.readAsText(file);
    // Reset input
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleImport() {
    if (!csvPreview?.length) return;
    setImporting(true);
    try {
      const res = await fetch("/api/grant-suite/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logicModelId,
          rows: csvPreview.map((r) => ({
            card_key: r.card_key,
            card_title: r.card_title || "",
            reporting_period: r.reporting_period,
            current_value: parseFloat(r.current_value) || 0,
            target_value: parseFloat(r.target_value) || 0,
            notes: r.notes || "",
          })),
          programContext,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setCsvPreview(null);
        onDataSaved();
        setSavedAt(
          `Imported ${result.imported} of ${result.total} rows`
        );
      }
    } catch (err) {
      console.error("Import error:", err);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Section A — Entry form */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#3A6B8A] block mb-1">
              Reporting period
            </label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g. Q1 2026 or March 2026"
              className="w-full font-jost text-[13px] text-midnight border border-[#e5e7eb] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#3A6B8A] block mb-1">
              Current value
            </label>
            <input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder={cardTarget ? `of ${cardTarget} target` : "Enter value"}
              className="w-full font-jost text-[13px] text-midnight border border-[#e5e7eb] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#3A6B8A] block mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context for this number?"
              className="w-full font-jost text-[13px] text-midnight border border-[#e5e7eb] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !period.trim()}
            className="inline-flex items-center gap-2 font-jost font-semibold text-xs px-4 py-2 rounded-md transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#E9C03A", color: "#1B2B3A" }}
          >
            {saving ? "Saving..." : "Save & generate narrative"}
          </button>
          {savedAt && (
            <span className="font-jost text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded">
              Saved {savedAt}
            </span>
          )}
        </div>
      </div>

      {/* Section B — Live metrics */}
      {(displayCurrentValue != null && displayTargetValue != null && percentToGoal != null) && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-3 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9ca3af] mb-1">
                Current
              </p>
              <p
                className="font-jost font-bold text-2xl"
                style={{ color: accent }}
              >
                {displayCurrentValue.toLocaleString()}
              </p>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-3 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9ca3af] mb-1">
                Target
              </p>
              <p className="font-jost font-bold text-2xl text-midnight">
                {displayTargetValue.toLocaleString()}
              </p>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-3 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9ca3af] mb-1">
                % to Goal
              </p>
              <p
                className="font-jost font-bold text-2xl"
                style={{ color: getPercentColor(percentToGoal) }}
              >
                {percentToGoal}%
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="font-jost text-[11px] text-midnight">
                {cardItem?.metric ?? cardItem?.title ?? "Progress"}
              </p>
              <p
                className="font-jost text-[11px] font-medium"
                style={{ color: getPercentColor(percentToGoal) }}
              >
                {percentToGoal}% to goal
              </p>
            </div>
            <div
              className="w-full h-2 rounded-full bg-[#e5e7eb] overflow-hidden"
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(percentToGoal, 100)}%`,
                  backgroundColor: accent,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Section C — AI narrative */}
      {narrative && (
        <div>
          <div className="rounded-lg p-3" style={{ backgroundColor: "#EDE8DE" }}>
            <div className="flex items-center justify-between mb-2">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.1em] flex items-center gap-1"
                style={{ color: "#3A6B8A" }}
              >
                <span>✦</span> AI narrative for funder report
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="font-jost text-[10px] text-[#3A6B8A] hover:text-midnight transition-colors px-2 py-0.5 rounded border border-[#3A6B8A]/20 hover:border-[#3A6B8A]/40"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleRegenerateNarrative}
                  disabled={saving}
                  className="font-jost text-[10px] text-[#6b7280] hover:text-midnight transition-colors px-2 py-0.5 rounded border border-[#e5e7eb] hover:border-[#9ca3af]"
                >
                  Regenerate
                </button>
              </div>
            </div>
            <p className="font-jost text-[13px] text-midnight leading-[1.65]">
              {narrative}
            </p>
          </div>
        </div>
      )}

      {/* Section D — Reporting history */}
      {cardReporting.length > 0 && (
        <div>
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center gap-1.5 font-jost text-xs text-[#6b7280] hover:text-midnight transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: historyOpen ? "rotate(90deg)" : "rotate(0)",
                transition: "transform 0.15s ease",
              }}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            View reporting history ({cardReporting.length} period
            {cardReporting.length !== 1 ? "s" : ""})
          </button>

          {historyOpen && (
            <div className="mt-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#e5e7eb]">
                    <th className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#9ca3af] py-2 pr-3">
                      Period
                    </th>
                    <th className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#9ca3af] py-2 pr-3">
                      Value
                    </th>
                    <th className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#9ca3af] py-2 pr-3">
                      % to Goal
                    </th>
                    <th className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#9ca3af] py-2">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cardReporting.map((row, i) => {
                    const val = row.current_value ?? 0;
                    const tgt = row.target_value ?? cardTarget;
                    const pct =
                      tgt > 0 ? Math.round((val / tgt) * 100) : 0;
                    const prev = cardReporting[i + 1];
                    const trend = prev
                      ? getTrend(val, prev.current_value ?? 0)
                      : "→";

                    return (
                      <tr
                        key={row.id ?? i}
                        className="border-b border-[#f3f4f6] cursor-pointer hover:bg-[#f9fafb] transition-colors"
                        onClick={() =>
                          setHistoryNarrative(
                            historyNarrative === row.narrative
                              ? null
                              : row.narrative
                          )
                        }
                      >
                        <td className="font-jost text-[12px] text-midnight py-2 pr-3">
                          {row.reporting_period}
                        </td>
                        <td className="font-jost text-[12px] text-midnight py-2 pr-3">
                          {val.toLocaleString()}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className="font-jost text-[12px] font-medium"
                            style={{ color: getPercentColor(pct) }}
                          >
                            {pct}%
                          </span>
                        </td>
                        <td className="font-jost text-[14px] py-2">
                          {trend}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {historyNarrative && (
                <div
                  className="mt-2 rounded-lg p-3 font-jost text-[12px] text-midnight leading-[1.6]"
                  style={{ backgroundColor: "#EDE8DE" }}
                >
                  {historyNarrative}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CSV section */}
      <div className="border-t border-[#e5e7eb] pt-4">
        <p className="font-jost text-[12px] text-[#6b7280]">
          Prefer to upload data?{" "}
          <button
            onClick={downloadTemplate}
            className="text-[#3A6B8A] hover:text-midnight underline transition-colors"
          >
            Download CSV template
          </button>{" "}
          and upload it here.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="mt-2 font-jost text-[12px] text-[#6b7280] file:mr-3 file:py-1 file:px-3 file:rounded-md file:border file:border-[#e5e7eb] file:text-[11px] file:font-jost file:font-medium file:text-midnight file:bg-white hover:file:bg-[#f9fafb] file:cursor-pointer file:transition-colors"
        />

        {/* CSV preview */}
        {csvPreview && csvPreview.length > 0 && (
          <div className="mt-3">
            <p className="font-jost text-[11px] text-midnight font-medium mb-2">
              Preview ({csvPreview.length} rows)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#e5e7eb]">
                    <th className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#9ca3af] py-1.5 pr-2">
                      Card
                    </th>
                    <th className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#9ca3af] py-1.5 pr-2">
                      Period
                    </th>
                    <th className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#9ca3af] py-1.5 pr-2">
                      Value
                    </th>
                    <th className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#9ca3af] py-1.5">
                      Target
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row, i) => (
                    <tr key={i} className="border-b border-[#f3f4f6]">
                      <td className="font-jost text-[11px] text-midnight py-1.5 pr-2">
                        {row.card_title || row.card_key}
                      </td>
                      <td className="font-jost text-[11px] text-midnight py-1.5 pr-2">
                        {row.reporting_period}
                      </td>
                      <td className="font-jost text-[11px] text-midnight py-1.5 pr-2">
                        {row.current_value}
                      </td>
                      <td className="font-jost text-[11px] text-midnight py-1.5">
                        {row.target_value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleImport}
                disabled={importing}
                className="font-jost font-semibold text-[11px] px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#E9C03A", color: "#1B2B3A" }}
              >
                {importing ? "Importing..." : "Import data"}
              </button>
              <button
                onClick={() => setCsvPreview(null)}
                className="font-jost text-[11px] text-[#6b7280] hover:text-midnight transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Read-only dashboard (Step 7) ────────────────────────────────────────────

function ReadOnlyDashboard({
  latestEntry,
  cardItem,
  accent,
}: {
  latestEntry: ReportingRow | null;
  cardItem: Record<string, string> | null;
  accent: string;
}) {
  if (!latestEntry) {
    return (
      <div className="text-center py-8">
        <p className="font-jost text-sm text-[#9ca3af]">
          Reporting data not yet entered for this program.
        </p>
      </div>
    );
  }

  const val = latestEntry.current_value ?? 0;
  const tgt = latestEntry.target_value ?? 0;
  const pct = tgt > 0 ? Math.round((val / tgt) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9ca3af]">
        {latestEntry.reporting_period}
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#e5e7eb] rounded-lg p-3 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9ca3af] mb-1">
            Current
          </p>
          <p className="font-jost font-bold text-2xl" style={{ color: accent }}>
            {val.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-[#e5e7eb] rounded-lg p-3 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9ca3af] mb-1">
            Target
          </p>
          <p className="font-jost font-bold text-2xl text-midnight">
            {tgt.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-[#e5e7eb] rounded-lg p-3 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9ca3af] mb-1">
            % to Goal
          </p>
          <p
            className="font-jost font-bold text-2xl"
            style={{ color: getPercentColor(pct) }}
          >
            {pct}%
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="font-jost text-[11px] text-midnight">
            {cardItem?.metric ?? cardItem?.title ?? "Progress"}
          </p>
          <p
            className="font-jost text-[11px] font-medium"
            style={{ color: getPercentColor(pct) }}
          >
            {pct}% to goal
          </p>
        </div>
        <div className="w-full h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: accent,
            }}
          />
        </div>
      </div>

      {/* Narrative */}
      {latestEntry.narrative && (
        <div className="rounded-lg p-3" style={{ backgroundColor: "#EDE8DE" }}>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.1em] flex items-center gap-1 mb-2"
            style={{ color: "#3A6B8A" }}
          >
            <span>✦</span> AI narrative for funder report
          </p>
          <p className="font-jost text-[13px] text-midnight leading-[1.65]">
            {latestEntry.narrative}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Inputs/Activities contextual message ────────────────────────────

function InputsActivitiesMessage({
  data,
  onNavigateToCard,
}: {
  data: LogicModelData;
  onNavigateToCard?: (column: string, index: number) => void;
}) {
  const links: Array<{ label: string; column: string; index: number }> = [];

  if (data.outputs?.length > 0) {
    links.push({
      label: data.outputs[0].title,
      column: "outputs",
      index: 0,
    });
  }
  if (data.shortTermOutcomes?.length > 0) {
    links.push({
      label: data.shortTermOutcomes[0].title,
      column: "shortTermOutcomes",
      index: 0,
    });
  }
  if (data.longTermOutcomes?.length > 0) {
    links.push({
      label: data.longTermOutcomes[0].title,
      column: "longTermOutcomes",
      index: 0,
    });
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
      <span
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: "#EDE8DE" }}
      >
        📋
      </span>
      <h3 className="font-fraunces text-base text-midnight">
        Reporting tracked at output level
      </h3>
      <p className="font-jost text-sm text-[#6b7280] max-w-sm leading-relaxed">
        Program inputs and activities are documented through your outputs and
        outcomes. Select an output or outcome card to enter reporting data.
      </p>
      {links.length > 0 && onNavigateToCard && (
        <div className="flex flex-wrap gap-2 justify-center">
          {links.map((link) => (
            <button
              key={`${link.column}_${link.index}`}
              onClick={() => onNavigateToCard(link.column, link.index)}
              className="font-jost text-[11px] px-3 py-1.5 rounded-full border border-[#3A6B8A]/30 text-[#3A6B8A] hover:bg-[#3A6B8A]/10 transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
