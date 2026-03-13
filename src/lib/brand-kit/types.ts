export type BrandTokens = {
  primary: string
  accent: string
  success: string
  textOnPrimary: string
  logoUrl: string | null
  orgDisplayName: string
  whiteLabel: boolean
}

export const DEFAULT_BRAND: BrandTokens = {
  primary: '#1B2B3A',
  accent: '#E9C03A',
  success: '#1D9E75',
  textOnPrimary: '#EDE8DE',
  logoUrl: null,
  orgDisplayName: '',
  whiteLabel: false,
}

export const BRAND_PRESETS = [
  { name: 'Default', primary: '#1B2B3A', accent: '#E9C03A', success: '#1D9E75' },
  { name: 'Ocean',   primary: '#0a2540', accent: '#00b4d8', success: '#06d6a0' },
  { name: 'Purple',  primary: '#1a0533', accent: '#c77dff', success: '#06d6a0' },
  { name: 'Forest',  primary: '#0d2b1a', accent: '#95d5b2', success: '#52b788' },
  { name: 'Crimson', primary: '#1a0a0a', accent: '#e63946', success: '#06d6a0' },
  { name: 'Navy',    primary: '#03045e', accent: '#caf0f8', success: '#0096c7' },
]

export const SWATCH_OPTIONS = {
  primary: ['#1B2B3A','#0a2540','#1a0533','#0d2b1a','#1a0a0a','#03045e','#111111'],
  accent:  ['#E9C03A','#00b4d8','#c77dff','#95d5b2','#e63946','#caf0f8','#ff6b35'],
  success: ['#1D9E75','#06d6a0','#52b788','#0096c7','#56cfe1','#80b918','#f4a261'],
}
