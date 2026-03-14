/**
 * Step 19 — Inferno Palette Generator
 * Takes a brand_primary hex color and generates a 4-stop flame gradient.
 * Default (no brand kit): Inferno orange-red (#ff8800 → #cc2000)
 */

export interface InfernoPalette {
  lightest: string
  primary: string
  darker: string
  darkest: string
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
  )
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  )
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}

const DEFAULT_INFERNO: InfernoPalette = {
  lightest: '#ffcc66',
  primary: '#ff8800',
  darker: '#cc4400',
  darkest: '#cc2000',
}

export function generateInfernoPalette(brandPrimary?: string): InfernoPalette {
  if (!brandPrimary) return DEFAULT_INFERNO

  return {
    lightest: lighten(brandPrimary, 0.4),
    primary: brandPrimary,
    darker: darken(brandPrimary, 0.3),
    darkest: darken(brandPrimary, 0.6),
  }
}
