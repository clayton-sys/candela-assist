"use client";

import { COLOR_SCHEMES, type ColorSchemePreset } from "@/lib/colorSchemes";

interface ColorSchemePickerProps {
  selectedId: string;
  brandPrimary: string | null;
  brandAccent: string | null;
  onSelect: (id: string) => void;
}

const dmSans = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

export default function ColorSchemePicker({
  selectedId,
  brandPrimary,
  brandAccent,
  onSelect,
}: ColorSchemePickerProps) {
  function getSwatchColors(scheme: ColorSchemePreset) {
    if (scheme.id === "brand-kit" && brandPrimary && brandAccent) {
      return { primary: brandPrimary, accent: brandAccent };
    }
    return { primary: scheme.primary, accent: scheme.accent };
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {COLOR_SCHEMES.map((scheme) => {
          const isSelected = selectedId === scheme.id;
          const { primary, accent } = getSwatchColors(scheme);

          return (
            <button
              key={scheme.id}
              type="button"
              onClick={() => onSelect(scheme.id)}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-[#E9C03A] bg-[#E9C03A]/5"
                  : "border-transparent hover:border-[#1B2B3A]/10"
              }`}
            >
              {/* Swatch: rounded square with accent stripe */}
              <div
                className="w-7 h-7 rounded-md relative overflow-hidden"
                style={{ background: primary }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 h-[6px]"
                  style={{ background: accent }}
                />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {/* Label */}
              <span
                className="text-[9px] text-[#1B2B3A]/50 leading-tight"
                style={dmSans}
              >
                {scheme.label}
              </span>
            </button>
          );
        })}
      </div>
      {selectedId === "brand-kit" && (
        <p
          className="text-[11px] text-[#1B2B3A]/35 mt-2"
          style={dmSans}
        >
          Using your brand colors &mdash; change anytime
        </p>
      )}
    </div>
  );
}
