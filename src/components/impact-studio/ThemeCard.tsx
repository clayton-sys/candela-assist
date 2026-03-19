"use client";

import { Lock } from "lucide-react";
import { getThemePreviewColors } from "@/lib/themes";

interface ThemeCardProps {
  themeId: string;
  themeName: string;
  spectrum: string;
  isSelected: boolean;
  isLocked: boolean;
  onClick: () => void;
}

function ThemeMiniature({ themeId }: { themeId: string }) {
  switch (themeId) {
    case "candela-classic":
    case "foundation":
    case "editorial":
    case "civic":
      // Timeless/Classical — large heading block top, horizontal rules, clean columns
      return (
        <div className="w-full h-full flex flex-col p-2 gap-1">
          <div className="h-4 rounded-sm" style={{ background: "var(--tk-primary)" }} />
          <div className="h-px w-full" style={{ background: "var(--tk-accent)", opacity: 0.5 }} />
          <div className="flex-1 flex gap-1">
            <div className="flex-1 rounded-sm" style={{ background: "var(--tk-primary)", opacity: 0.15 }} />
            <div className="flex-1 rounded-sm" style={{ background: "var(--tk-primary)", opacity: 0.1 }} />
          </div>
          <div className="h-px w-full" style={{ background: "var(--tk-accent)", opacity: 0.3 }} />
          <div className="h-2 w-1/2 rounded-sm" style={{ background: "var(--tk-primary)", opacity: 0.2 }} />
        </div>
      );

    case "blueprint":
    case "momentum":
    case "command":
      // Professional/Modern — left sidebar strip, bold stat blocks right
      return (
        <div className="w-full h-full flex">
          <div className="w-3 rounded-l-sm" style={{ background: "var(--tk-accent)" }} />
          <div className="flex-1 p-2 flex flex-col gap-1">
            <div className="h-3 w-3/4 rounded-sm" style={{ background: "var(--tk-primary)", opacity: 0.8 }} />
            <div className="flex-1 grid grid-cols-2 gap-1">
              <div className="rounded-sm" style={{ background: "var(--tk-accent)", opacity: 0.25 }} />
              <div className="rounded-sm" style={{ background: "var(--tk-accent)", opacity: 0.15 }} />
              <div className="rounded-sm" style={{ background: "var(--tk-primary)", opacity: 0.1 }} />
              <div className="rounded-sm" style={{ background: "var(--tk-primary)", opacity: 0.15 }} />
            </div>
          </div>
        </div>
      );

    case "aurora":
      // Tech-forward — dense grid, hard edges, data-heavy feel
      return (
        <div className="w-full h-full p-1.5 grid grid-cols-3 grid-rows-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[2px]"
              style={{
                background: i % 3 === 0 ? "var(--tk-accent)" : "var(--tk-primary)",
                opacity: 0.15 + (i % 4) * 0.1,
              }}
            />
          ))}
        </div>
      );

    case "neon-civic":
    case "gravity":
      // Bold/Dramatic — full-bleed color header, oversized type block
      return (
        <div className="w-full h-full flex flex-col">
          <div className="h-10 w-full" style={{ background: "var(--tk-primary)" }}>
            <div className="h-full flex items-center justify-center">
              <div className="h-3 w-10 rounded-sm" style={{ background: "var(--tk-accent)", opacity: 0.9 }} />
            </div>
          </div>
          <div className="flex-1 p-2 flex flex-col gap-1">
            <div className="h-5 w-full rounded-sm" style={{ background: "var(--tk-accent)", opacity: 0.12 }} />
            <div className="h-2 w-2/3 rounded-sm" style={{ background: "var(--tk-primary)", opacity: 0.1 }} />
          </div>
        </div>
      );

    case "obsidian":
    case "void":
      // Minimal — extreme whitespace, single thin accent line
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-3">
          <div className="h-2 w-8 rounded-sm" style={{ background: "var(--tk-primary)", opacity: 0.6 }} />
          <div className="h-px w-full" style={{ background: "var(--tk-accent)", opacity: 0.4 }} />
          <div className="h-1.5 w-12 rounded-sm" style={{ background: "var(--tk-primary)", opacity: 0.15 }} />
        </div>
      );

    case "spectra":
    case "plasma":
    case "inferno":
      // Kinetic/Maximum — diagonal cut or offset block via CSS clip-path
      return (
        <div className="w-full h-full relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: "var(--tk-primary)",
              clipPath: "polygon(0 0, 100% 0, 100% 60%, 0 100%)",
              opacity: 0.9,
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-3/4 h-1/2"
            style={{
              background: "var(--tk-accent)",
              clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)",
              opacity: 0.3,
            }}
          />
          <div className="absolute top-2 left-2 h-2 w-8 rounded-sm" style={{ background: "var(--tk-accent)", opacity: 0.8 }} />
        </div>
      );

    default:
      return (
        <div className="w-full h-full flex flex-col p-2 gap-1">
          <div className="h-4 rounded-sm" style={{ background: "var(--tk-primary)" }} />
          <div className="flex-1 rounded-sm" style={{ background: "var(--tk-accent)", opacity: 0.15 }} />
        </div>
      );
  }
}

export default function ThemeCard({
  themeId,
  themeName,
  spectrum,
  isSelected,
  isLocked,
  onClick,
}: ThemeCardProps) {
  const preview = getThemePreviewColors(themeId);

  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={`relative w-[160px] h-[110px] rounded-xl border-2 transition-all text-left overflow-hidden flex flex-col ${
        isSelected
          ? "border-[#E9C03A] scale-[1.02] shadow-md"
          : isLocked
          ? "opacity-50 cursor-not-allowed border-[#1B2B3A]/10"
          : "border-[#1B2B3A]/10 hover:border-[#3A6B8A] cursor-pointer"
      }`}
      style={
        {
          "--tk-primary": preview.primary,
          "--tk-accent": preview.accent,
        } as React.CSSProperties
      }
    >
      {/* Lock badge */}
      {isLocked && (
        <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 bg-[#1B2B3A]/80 text-[#E9C03A] rounded-full px-1.5 py-0.5">
          <Lock className="w-2.5 h-2.5" />
          <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }} className="text-[8px] font-semibold">
            Growth+
          </span>
        </div>
      )}

      {/* Miniature preview */}
      <div className="flex-1 bg-white">
        <ThemeMiniature themeId={themeId} />
      </div>

      {/* Label bar */}
      <div className="px-2 py-1.5 bg-white border-t border-[#1B2B3A]/5">
        <p
          className="text-[10px] font-semibold text-[#1B2B3A] truncate leading-tight"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {themeName}
        </p>
        <p
          className="text-[8px] text-[#1B2B3A]/40 truncate leading-tight"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          {spectrum}
        </p>
      </div>
    </button>
  );
}
