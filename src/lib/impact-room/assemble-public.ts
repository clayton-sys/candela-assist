import { createClient } from "@supabase/supabase-js";

export type OrgPhoto = {
  id: string;
  storage_url: string;
  alt_text: string | null;
  tags: string[];
};

export type ImpactRoomPublicPayload = {
  org: {
    name: string;
    slug: string;
    mission_short: string | null;
    logo_url: string | null;
    hero_photo_url: string | null;
    community_photo_url: string | null;
    primary_color: string;
    secondary_color: string;
    ceo_message: string | null;
    ceo_name: string | null;
    ceo_title: string | null;
    ceo_photo_url: string | null;
  };
  period_label: string;
  programs: Array<{
    id: string;
    name: string;
    name_descriptor: string | null;
    name_bold: string;
    photo_url: string | null;
    headline_metric: { label: string; value: string; target?: string | null } | null;
    outcome_sentence: string | null;
    quote: { text: string; attribution: string } | null;
  }>;
  org_photos: OrgPhoto[];
  closing_testimonial: {
    text: string;
    attribution: string;
    photo_url: string | null;
  } | null;
};

function splitProgramName(name: string): {
  descriptor: string | null;
  bold: string;
} {
  // If the name has a colon or dash, split there
  const colonIdx = name.indexOf(":");
  if (colonIdx > 0) {
    return {
      descriptor: name.slice(0, colonIdx).trim(),
      bold: name.slice(colonIdx + 1).trim(),
    };
  }
  const dashIdx = name.indexOf("—");
  if (dashIdx > 0) {
    return {
      descriptor: name.slice(0, dashIdx).trim(),
      bold: name.slice(dashIdx + 1).trim(),
    };
  }
  // No separator — everything is bold
  return { descriptor: null, bold: name };
}

export async function assemblePublicPayload(
  slug: string
): Promise<ImpactRoomPublicPayload | null> {
  const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
  // ── Org + brand kit ────────────────────────────────────────────
  const { data: orgRow } = await supabase
    .from('orgs')
    .select('*, brand_kits(*)')
    .eq('slug', slug)
    .single()

  if (!orgRow) return null;

  const brandKit = Array.isArray(orgRow.brand_kits)
    ? orgRow.brand_kits[0]
    : orgRow.brand_kits;

  const orgId = orgRow.id;
  const primaryColor = brandKit?.brand_primary ?? "#1B2B3A";
  const secondaryColor = brandKit?.brand_accent ?? "#E9C03A";
  const logoUrl = brandKit?.logo_url ?? null;

  // ── Hero photo — prefer orgs.hero_photo_url, fall back to org_photos tag ──
  let heroPhotoUrl: string | null = orgRow.hero_photo_url ?? null;
  if (!heroPhotoUrl) {
    try {
      const { data: heroRow } = await supabase
        .from("org_photos")
        .select("storage_url")
        .eq("org_id", orgId)
        .contains("tags", ["hero"])
        .limit(1)
        .single();
      heroPhotoUrl = heroRow?.storage_url ?? null;
    } catch {
      // Table may not exist yet
    }
  }

  // ── Community photo ────────────────────────────────────────────
  let communityPhotoUrl: string | null = null;
  try {
    const { data: communityRow } = await supabase
      .from("org_photos")
      .select("storage_url")
      .eq("org_id", orgId)
      .contains("tags", ["community"])
      .limit(1)
      .single();
    communityPhotoUrl = communityRow?.storage_url ?? null;
  } catch {
    // Table may not exist yet
  }

  // ── All org_photos for scrollytelling ──────────────────────────
  let orgPhotos: OrgPhoto[] = [];
  try {
    const { data: photoRows } = await supabase
      .from("org_photos")
      .select("id, storage_url, alt_text, tags")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    orgPhotos = (photoRows ?? []).map((r) => ({
      id: r.id,
      storage_url: r.storage_url,
      alt_text: r.alt_text,
      tags: r.tags ?? [],
    }));
  } catch {
    // Table may not exist yet
  }

  // ── Programs ───────────────────────────────────────────────────
  const { data: programRows } = await supabase
    .from("programs")
    .select("id, name, display_order")
    .eq("org_id", orgId)
    .eq("is_archived", false)
    .order("display_order", { ascending: true });

  const programs: ImpactRoomPublicPayload["programs"] = [];
  let periodLabel = "";

  for (const prog of programRows ?? []) {
    // Most recent program_data for this program
    const { data: dataRow } = await supabase
      .from("program_data")
      .select(
        "id, period_label, outcomes, client_voice, change_description"
      )
      .eq("program_id", prog.id)
      .order("entered_at", { ascending: false })
      .limit(1)
      .single();

    if (dataRow?.period_label && !periodLabel) {
      periodLabel = dataRow.period_label;
    }

    // Headline metric (is_featured = true)
    let headlineMetric: { label: string; value: string; target?: string | null } | null = null;
    if (dataRow) {
      const { data: metricRow } = await supabase
        .from("program_data_points")
        .select(
          "value, metric:program_metrics(metric_name, target_value)"
        )
        .eq("data_entry_id", dataRow.id)
        .eq("metric.is_featured", true)
        .limit(1)
        .single();

      if (metricRow?.value) {
        const metric = Array.isArray(metricRow.metric)
          ? metricRow.metric[0]
          : metricRow.metric;
        headlineMetric = {
          label: metric?.metric_name ?? "Impact",
          value: metricRow.value,
          target: metric?.target_value ?? null,
        };
      }
    }

    // Program photo
    let programPhotoUrl: string | null = null;
    try {
      const { data: photoRow } = await supabase
        .from("org_photos")
        .select("storage_url")
        .eq("org_id", orgId)
        .contains("tags", ["program", prog.id])
        .limit(1)
        .single();
      programPhotoUrl = photoRow?.storage_url ?? null;
    } catch {
      // Table may not exist
    }

    // Parse outcome sentence
    const outcomeSentence = dataRow?.outcomes
      ? dataRow.outcomes.split("\n")[0]?.replace(/^[-•*]\s*/, "").trim() || null
      : null;

    // Parse quote from client_voice
    let quote: { text: string; attribution: string } | null = null;
    if (dataRow?.client_voice) {
      const voiceLines = dataRow.client_voice
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);
      if (voiceLines.length > 0) {
        const raw = voiceLines[0].replace(/^[-•*""\s]+/, "").replace(/[""]+$/, "");
        quote = {
          text: raw,
          attribution: "Program participant",
        };
      }
    }

    const { descriptor, bold } = splitProgramName(prog.name);

    programs.push({
      id: prog.id,
      name: prog.name,
      name_descriptor: descriptor,
      name_bold: bold,
      photo_url: programPhotoUrl,
      headline_metric: headlineMetric,
      outcome_sentence: outcomeSentence,
      quote,
    });
  }

  // ── Closing testimonial ────────────────────────────────────────
  let closingTestimonial: ImpactRoomPublicPayload["closing_testimonial"] =
    null;
  try {
    const { data: testimonialRow } = await supabase
      .from("org_testimonials")
      .select("quote_text, client_identifier")
      .eq("org_id", orgId)
      .limit(1)
      .single();

    if (testimonialRow?.quote_text) {
      closingTestimonial = {
        text: testimonialRow.quote_text,
        attribution: testimonialRow.client_identifier ?? "Community member",
        photo_url: communityPhotoUrl,
      };
    }
  } catch {
    // Table may not exist
  }

  return {
    org: {
      name: orgRow.name,
      slug: orgRow.slug ?? slug,
      mission_short: orgRow.mission ?? null,
      logo_url: logoUrl,
      hero_photo_url: heroPhotoUrl,
      community_photo_url: communityPhotoUrl,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      ceo_message: orgRow.ceo_message ?? null,
      ceo_name: orgRow.ceo_name ?? null,
      ceo_title: orgRow.ceo_title ?? null,
      ceo_photo_url: orgRow.ceo_photo_url ?? null,
    },
    period_label: periodLabel || "Current Period",
    programs,
    org_photos: orgPhotos,
    closing_testimonial: closingTestimonial,
  };
}
