export const THEMES: Record<string, { name: string; instructions: string }> = {
  "candela-classic": {
    name: "Candela Classic",
    instructions: `Use the Candela brand colors. Clean, professional layout with a centered header, clear section dividers, and a balanced two-column data grid. Typography is Cormorant Garamond for headings, DM Sans for body. White background with subtle warm stone (#EDE8DE) section backgrounds.`,
  },
  foundation: {
    name: "Foundation",
    instructions: `Timeless, understated layout. Large serif heading block at top. Generous margins. Horizontal rules between sections. Single-column narrative with right-aligned stat callouts. Feels like a high-quality annual report. Use brand colors sparingly — primarily for accent lines and stat highlights.`,
  },
  editorial: {
    name: "Editorial",
    instructions: `Classical editorial style. Strong typographic hierarchy. Pull quotes styled prominently. Data presented in clean inline tables. Narrow content column with wide outer margins. Feels like a well-designed magazine spread. Brand primary color used for drop caps and section labels only.`,
  },
  civic: {
    name: "Civic",
    instructions: `Authoritative and trustworthy. Government-report aesthetic. Clear labeled sections with bold uppercase headers. Data in structured tables with clear borders. Blue/neutral palette derived from brand colors. Dense but readable. Feels like an official program report.`,
  },
  blueprint: {
    name: "Blueprint",
    instructions: `Professional services aesthetic. Left sidebar strip in brand primary color containing section labels. Main content area white with bold stat blocks. Clean sans-serif throughout. Data presented in card grid with subtle shadows. Feels like a consultant deliverable.`,
  },
  momentum: {
    name: "Momentum",
    instructions: `Modern nonprofit aesthetic. Bold full-width header with brand primary color background. Stats displayed as large number + label pairs in a horizontal strip. Progress bars for metrics. Clean white body with brand accent color for highlights. Forward-moving, optimistic energy.`,
  },
  command: {
    name: "Command",
    instructions: `Dark header panel (brand primary: Midnight Ink #1B2B3A) with light text, transitioning to white body. Stats in prominent cards with colored top borders. Bold section headers. Data-forward layout that feels authoritative and confident. Brand gold (#E9C03A) used for key numbers and CTA elements.`,
  },
  aurora: {
    name: "Aurora",
    instructions: `Tech-forward aesthetic. Dense information grid. Hard edges, no rounded corners. Monospace labels for data fields. Stats in tight bordered boxes. Brand colors used as background fills for data cells. Feels like a live dashboard printed to PDF.`,
  },
  "neon-civic": {
    name: "Neon Civic",
    instructions: `Bold, high-contrast civic aesthetic. Dark background (Midnight Ink) with bright brand accent color (Solar Gold) for all key numbers and section headers. White body text. Feels like an urgent, attention-commanding impact brief. Data pops visually.`,
  },
  obsidian: {
    name: "Obsidian",
    instructions: `Stark minimal. Near-white background, almost no decoration. Extremely generous whitespace. Data presented as simple labeled pairs — no cards, no borders, no backgrounds. Single thin horizontal rule between sections. Brand color appears only on the main headline stat. Confidence through restraint.`,
  },
  void: {
    name: "Void",
    instructions: `Alive minimal. Dark background (Midnight Ink) throughout. Light text (Warm Stone). Minimal UI — just content and space. Brand accent color (Solar Gold) used only for the single most important number on the page. Everything else is quiet. The data speaks.`,
  },
  spectra: {
    name: "Spectra",
    instructions: `Cutting-edge data presentation. Stats displayed as large typographic elements with thin colored underlines in brand colors. Section labels small and uppercase. Content feels like a data studio output. Grid-based layout with deliberate asymmetry. Brand colors rotated across stat blocks for visual rhythm.`,
  },
  gravity: {
    name: "Gravity",
    instructions: `Dramatic and weighty. Full-bleed header section with brand primary color background and oversized display type (Cormorant Garamond, very large). Body transitions to white. Stats displayed as oversized numbers with small descriptive labels beneath. Feels like a major announcement or campaign launch.`,
  },
  plasma: {
    name: "Plasma",
    instructions: `Kinetic energy. Use CSS clip-path diagonal cuts between sections to create angular transitions. Brand primary and accent colors used as section background fills alternating. Bold, offset typography. Feels like motion even in a static document. Stats in offset overlapping blocks.`,
  },
  inferno: {
    name: "Inferno",
    instructions: `Maximum visual impact. High-contrast, full-bleed color sections. Brand colors used aggressively — primary and accent as large background blocks. White and dark text alternating per section for contrast. Oversized stats. Zero subtlety. Designed to stop a room. Use for board presentations and major funder meetings only.`,
  },
};

export function getThemeInstructions(themeId: string): string {
  // Normalize underscores to hyphens for backward compatibility
  const normalized = themeId.replace(/_/g, "-");
  return (
    THEMES[normalized]?.instructions ?? THEMES["candela-classic"].instructions
  );
}
