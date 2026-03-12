"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface ExportPDFButtonProps {
  programName: string;
  className?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ExportPDFButton({
  programName,
  className = "",
}: ExportPDFButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      // Dynamic imports — never bundled for SSR
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Target the exportable section
      const exportTarget = document.getElementById("export-target");
      if (!exportTarget) {
        console.error("Export target not found");
        return;
      }

      const canvas = await html2canvas(exportTarget, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#EDE8DE",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${slugify(programName)}-logic-model.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`print-hidden inline-flex items-center gap-2 font-jost font-semibold text-xs text-stone/70 hover:text-stone border border-stone/20 hover:border-stone/40 px-3 py-2 rounded-lg transition-colors ${className}`}
    >
      {exporting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      {exporting ? "Exporting…" : "Export PDF"}
    </button>
  );
}
