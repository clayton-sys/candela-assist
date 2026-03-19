"use client";

import ThemeCard from "./ThemeCard";

export type ColorScheme = "default" | "brand-kit";

interface ThemePickerProps {
  selectedThemeId: string;
  selectedColorScheme: ColorScheme;
  orgPlan: string;
  hasBrandKit: boolean;
  onSelectTheme: (themeId: string) => void;
  onSelectColorScheme: (scheme: ColorScheme) => void;
}

const THEMES = [
  { id: "candela-classic", name: "Candela Classic", spectrum: "Default" },
  { id: "foundation", name: "Foundation", spectrum: "Timeless" },
  { id: "editorial", name: "Editorial", spectrum: "Classical" },
  { id: "civic", name: "Civic", spectrum: "Classical" },
  { id: "blueprint", name: "Blueprint", spectrum: "Professional" },
  { id: "momentum", name: "Momentum", spectrum: "Modern" },
  { id: "command", name: "Command", spectrum: "Modern" },
  { id: "aurora", name: "Aurora", spectrum: "Tech-forward" },
  { id: "neon-civic", name: "Neon Civic", spectrum: "Bold" },
  { id: "obsidian", name: "Obsidian", spectrum: "Stark minimal" },
  { id: "void", name: "Void", spectrum: "Alive minimal" },
  { id: "spectra", name: "Spectra", spectrum: "Cutting-edge" },
  { id: "gravity", name: "Gravity", spectrum: "Dramatic" },
  { id: "plasma", name: "Plasma", spectrum: "Kinetic" },
  { id: "inferno", name: "Inferno", spectrum: "Maximum impact" },
];

const dmSans = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

const COLOR_SCHEMES: { id: ColorScheme; name: string; description: string }[] =
  [
    {
      id: "default",
      name: "Theme Colors",
      description: "Use the theme's own color palette",
    },
    {
      id: "brand-kit",
      name: "Brand Kit",
      description: "Use your org's brand colors",
    },
  ];

export default function ThemePicker({
  selectedThemeId,
  selectedColorScheme,
  orgPlan,
  hasBrandKit,
  onSelectTheme,
  onSelectColorScheme,
}: ThemePickerProps) {
  return (
    <div className="space-y-6">
      {/* SELECTION 1 — Theme (layout/structure) */}
      <div>
        <h3
          className="text-xs font-medium text-[#1B2B3A]/40 uppercase tracking-wider mb-3"
          style={dmSans}
        >
          Layout &amp; Structure
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 justify-items-center">
          {THEMES.map((theme) => {
            const isLocked =
              theme.id !== "candela-classic" && orgPlan === "starter";

            return (
              <ThemeCard
                key={theme.id}
                themeId={theme.id}
                themeName={theme.name}
                spectrum={theme.spectrum}
                isSelected={selectedThemeId === theme.id}
                isLocked={isLocked}
                onClick={() => onSelectTheme(theme.id)}
              />
            );
          })}
        </div>
      </div>

      {/* SELECTION 2 — Color Scheme */}
      <div>
        <h3
          className="text-xs font-medium text-[#1B2B3A]/40 uppercase tracking-wider mb-3"
          style={dmSans}
        >
          Color Scheme
        </h3>
        <div className="flex gap-3">
          {COLOR_SCHEMES.map((scheme) => {
            const isSelected = selectedColorScheme === scheme.id;
            const disabled = scheme.id === "brand-kit" && !hasBrandKit;

            return (
              <button
                key={scheme.id}
                type="button"
                onClick={disabled ? undefined : () => onSelectColorScheme(scheme.id)}
                disabled={disabled}
                className={`flex-1 text-left p-3 border-2 rounded-xl transition-all ${
                  disabled
                    ? "opacity-40 cursor-not-allowed border-[#1B2B3A]/10"
                    : isSelected
                    ? "border-[#E9C03A] bg-[#E9C03A]/5"
                    : "border-[#1B2B3A]/10 hover:border-[#3A6B8A]"
                }`}
              >
                <p
                  className="text-sm font-medium text-[#1B2B3A]"
                  style={dmSans}
                >
                  {scheme.name}
                </p>
                <p
                  className="text-[11px] text-[#1B2B3A]/40 mt-0.5"
                  style={dmSans}
                >
                  {disabled
                    ? "No brand kit configured"
                    : scheme.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
