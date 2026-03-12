"use client";

import { useState } from "react";
import { X, Check, Copy } from "lucide-react";

interface EmbedPreviewModalProps {
  slug: string;
  programName: string;
  onClose: () => void;
}

export default function EmbedPreviewModal({
  slug,
  programName,
  onClose,
}: EmbedPreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://candela.education";

  const embedCode = `<iframe\n  src="${appUrl}/embed/lm/${slug}"\n  width="100%"\n  height="680"\n  frameborder="0"\n  style="border-radius: 12px; border: 1px solid #EDE8DE;"\n  title="${programName} — Logic Model"\n></iframe>`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(embedCode);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = embedCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-midnight/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div style={{ height: "3px", backgroundColor: "#E9C03A" }} />

        <div className="p-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-fraunces text-base text-midnight">
              Embed Logic Model
            </h3>
            <button
              onClick={onClose}
              className="text-[#9ca3af] hover:text-midnight transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live preview */}
          <div className="rounded-lg border border-[#e5e7eb] overflow-hidden mb-4" style={{ height: "320px" }}>
            <iframe
              src={`/embed/lm/${slug}`}
              className="w-full h-full"
              title="Embed preview"
            />
          </div>

          {/* Code block */}
          <div className="relative">
            <pre className="bg-[#1B2B3A] text-stone/80 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">
              {embedCode}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 inline-flex items-center gap-1.5 font-jost text-[10px] text-stone/60 hover:text-stone bg-midnight-light/50 hover:bg-midnight-light px-2 py-1 rounded transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>

          <p className="font-jost text-[11px] text-[#9ca3af] mt-3">
            Paste this code into any website. The logic model updates
            automatically when you add new data.
          </p>
        </div>
      </div>
    </div>
  );
}
