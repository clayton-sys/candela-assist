"use client";

import ThemeCard from "./ThemeCard";

interface ThemePickerProps {
  selectedThemeId: string;
  orgPlan: string;
  onSelect: (themeId: string) => void;
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

export default function ThemePicker({
  selectedThemeId,
  orgPlan,
  onSelect,
}: ThemePickerProps) {
  return (
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
            onClick={() => onSelect(theme.id)}
          />
        );
      })}
    </div>
  );
}
