"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Link as LinkIcon, Code, ExternalLink, Maximize2, Check } from "lucide-react";

interface ShareDropdownProps {
  shareUrl: string;
  slug: string;
  /** Show all 4 options (staff view) or limited set (public view) */
  variant?: "staff" | "public";
  /** Called when user clicks "Copy embed code" — opens embed preview modal */
  onCopyEmbed?: () => void;
}

export default function ShareDropdown({
  shareUrl,
  slug,
  variant = "staff",
  onCopyEmbed,
}: ShareDropdownProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    setOpen(false);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://candela.education";
  const embedCode = `<iframe src="${appUrl}/embed/lm/${slug}" width="100%" height="680" frameborder="0" style="border-radius: 12px; border: 1px solid #EDE8DE;" title="Logic Model"></iframe>`;

  return (
    <div ref={ref} className="relative print-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 font-jost font-semibold text-xs text-stone/70 hover:text-stone border border-stone/20 hover:border-stone/40 px-3 py-2 rounded-lg transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400">Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5" />
            Share
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-lg shadow-lg border border-[#e5e7eb] overflow-hidden z-50">
          {/* Copy link */}
          <button
            onClick={() => copyToClipboard(shareUrl, "link")}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 font-jost text-xs text-midnight hover:bg-stone/30 transition-colors text-left"
          >
            <LinkIcon className="w-3.5 h-3.5 text-[#6b7280]" />
            Copy link
          </button>

          {/* Copy embed code (staff only) */}
          {variant === "staff" && (
            <button
              onClick={() => {
                if (onCopyEmbed) {
                  onCopyEmbed();
                  setOpen(false);
                } else {
                  copyToClipboard(embedCode, "embed");
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 font-jost text-xs text-midnight hover:bg-stone/30 transition-colors text-left"
            >
              <Code className="w-3.5 h-3.5 text-[#6b7280]" />
              Copy embed code
            </button>
          )}

          {/* Open public view (staff only) */}
          {variant === "staff" && (
            <button
              onClick={() => {
                window.open(shareUrl, "_blank");
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 font-jost text-xs text-midnight hover:bg-stone/30 transition-colors text-left"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#6b7280]" />
              Open public view
            </button>
          )}

          {/* Presentation mode */}
          <button
            onClick={() => {
              window.open(`${shareUrl}?mode=presentation`, "_blank");
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 font-jost text-xs text-midnight hover:bg-stone/30 transition-colors text-left"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#6b7280]" />
            Presentation mode
          </button>
        </div>
      )}
    </div>
  );
}
