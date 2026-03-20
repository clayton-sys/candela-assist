"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Copy, FileText, FileDown, Check } from "lucide-react";

interface ExportDropdownProps {
  projectName: string;
  viewType: string;
  getHtml: () => string | null;
  getIframeElement: () => HTMLIFrameElement | null;
}

const dmSans = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function dateStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ExportDropdown({
  projectName,
  viewType,
  getHtml,
  getIframeElement,
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const baseName = `${slugify(projectName)}-${slugify(viewType)}-${dateStamp()}`;

  async function handleCopy() {
    const iframe = getIframeElement();
    if (!iframe?.contentDocument?.body) return;

    const text = iframe.contentDocument.body.innerText;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 2000);
  }

  const isInteractive = viewType === "Impact Command Center" || viewType === "Story View";

  function handlePdf() {
    setOpen(false);
    const outputHtml = getHtml();
    if (!outputHtml) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(outputHtml);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 800);
    };
  }

  async function handleDocx() {
    setOpen(false);
    const iframe = getIframeElement();
    if (!iframe?.contentDocument?.body) return;

    const docxModule = await import("docx");
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docxModule;

    const body = iframe.contentDocument.body;
    const paragraphs: typeof Paragraph.prototype[] = [];

    // Walk top-level elements and convert to docx paragraphs
    const elements = body.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li, td, th, blockquote");
    elements.forEach((el) => {
      const text = (el as HTMLElement).innerText?.trim();
      if (!text) return;

      const tag = el.tagName;
      let heading: typeof HeadingLevel[keyof typeof HeadingLevel] | undefined;
      if (tag === "H1") heading = HeadingLevel.HEADING_1;
      else if (tag === "H2") heading = HeadingLevel.HEADING_2;
      else if (tag === "H3") heading = HeadingLevel.HEADING_3;
      else if (tag === "H4") heading = HeadingLevel.HEADING_4;
      else if (tag === "H5") heading = HeadingLevel.HEADING_5;
      else if (tag === "H6") heading = HeadingLevel.HEADING_6;

      paragraphs.push(
        new Paragraph({
          heading,
          children: [
            new TextRun({
              text,
              bold: !!heading,
              size: heading ? undefined : 22,
              font: "Calibri",
            }),
          ],
        })
      );
    });

    if (paragraphs.length === 0) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: body.innerText || "No content", font: "Calibri" })],
        })
      );
    }

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-[#1B2B3A]/15 rounded-lg text-sm text-[#1B2B3A]/60 hover:bg-[#1B2B3A]/5 transition-colors"
        style={dmSans}
      >
        <Download className="w-4 h-4" />
        Export
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-[#1B2B3A]/15 rounded-lg shadow-lg z-50 overflow-hidden">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1B2B3A]/70 hover:bg-[#1B2B3A]/5 transition-colors"
            style={dmSans}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#1D9E75]" />
                <span className="text-[#1D9E75]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy to clipboard
              </>
            )}
          </button>
          {isInteractive ? (
            <div
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1B2B3A]/25 cursor-not-allowed"
              style={dmSans}
              title="PDF not available for interactive views — use Share Link instead"
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </div>
          ) : (
            <button
              onClick={handlePdf}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1B2B3A]/70 hover:bg-[#1B2B3A]/5 transition-colors"
              style={dmSans}
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </button>
          )}
          <button
            onClick={handleDocx}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1B2B3A]/70 hover:bg-[#1B2B3A]/5 transition-colors"
            style={dmSans}
          >
            <FileText className="w-4 h-4" />
            Download DOCX
          </button>
        </div>
      )}
    </div>
  );
}
