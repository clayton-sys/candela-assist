export interface ColorSchemePreset {
  id: string;
  label: string;
  primary: string;
  accent: string;
}

export const COLOR_SCHEMES: ColorSchemePreset[] = [
  { id: "brand-kit", label: "Brand Kit", primary: "#1B2B3A", accent: "#E9C03A" },
  { id: "ocean", label: "Ocean", primary: "#0D2B45", accent: "#1A9DAF" },
  { id: "forest", label: "Forest", primary: "#1A3325", accent: "#4A9B6F" },
  { id: "ember", label: "Ember", primary: "#2C2C2C", accent: "#D4622A" },
  { id: "slate", label: "Slate", primary: "#1E2D3D", accent: "#5B9EC9" },
  { id: "dusk", label: "Dusk", primary: "#2A1A3E", accent: "#9B6FD4" },
  { id: "terra", label: "Terra", primary: "#3B2A1A", accent: "#C4895A" },
  { id: "crimson", label: "Crimson", primary: "#2D1A1A", accent: "#C94F4F" },
  { id: "mint", label: "Mint", primary: "#0D2B2B", accent: "#3ABFB0" },
  { id: "gold", label: "Gold", primary: "#1A1A2E", accent: "#C9A84C" },
  { id: "smoke", label: "Smoke", primary: "#1C1C1E", accent: "#8A8A99" },
];

export type ColorSchemeId = typeof COLOR_SCHEMES[number]["id"];

export function getColorSchemeById(id: string): ColorSchemePreset | undefined {
  return COLOR_SCHEMES.find((s) => s.id === id);
}
