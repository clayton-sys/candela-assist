import { createClient } from '@/lib/supabase/server'
import { BrandTokens, DEFAULT_BRAND } from './types'

export async function getBrandTokens(orgId: string): Promise<BrandTokens> {
  const supabase = createClient()

  const { data: org } = await supabase
    .from('orgs')
    .select('plan, brand_primary, brand_accent, brand_success, brand_text_on_primary, brand_logo_url, org_display_name, white_label_enabled')
    .eq('id', orgId)
    .single()

  // Starter plan always gets default brand — gate enforced server-side
  if (!org || org.plan === 'starter') return DEFAULT_BRAND

  return {
    primary:        org.brand_primary        ?? DEFAULT_BRAND.primary,
    accent:         org.brand_accent         ?? DEFAULT_BRAND.accent,
    success:        org.brand_success        ?? DEFAULT_BRAND.success,
    textOnPrimary:  org.brand_text_on_primary ?? DEFAULT_BRAND.textOnPrimary,
    logoUrl:        org.brand_logo_url       ?? null,
    orgDisplayName: org.org_display_name     ?? '',
    whiteLabel:     org.white_label_enabled  ?? false,
  }
}
