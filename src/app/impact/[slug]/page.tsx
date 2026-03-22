import { Metadata } from "next";
import { redirect } from "next/navigation";
import { assemblePublicPayload } from "@/lib/impact-room/assemble-public";
import { assembleInternalPayload } from "@/lib/impact-room/assemble-internal";
import { createClient } from "@/lib/supabase/server";
import HeroSection from "@/components/impact-room/HeroSection";
import StatsSection from "@/components/impact-room/StatsSection";
import ProgramsSection from "@/components/impact-room/ProgramsSection";
import SpineNav from "@/components/impact-room/SpineNav";
import TerminalView from "@/components/impact-room/TerminalView";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { mode } = await searchParams;

  if (mode === "internal") {
    const payload = await assembleInternalPayload(slug);
    return {
      title: payload ? `${payload.org.name} — Impact Terminal` : "Impact Terminal — Not Found",
    };
  }

  const payload = await assemblePublicPayload(slug);
  if (!payload) {
    return { title: "Impact Report — Not Found" };
  }
  return {
    title: `${payload.org.name} — Impact Report`,
    description:
      payload.org.mission_short ?? `Impact report for ${payload.org.name}`,
    openGraph: {
      title: `${payload.org.name} — Impact Report`,
      description: payload.org.mission_short ?? "",
      images: payload.org.hero_photo_url ? [payload.org.hero_photo_url] : [],
    },
  };
}

export default async function ImpactRoomPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { mode } = await searchParams;

  // ── Internal terminal mode ─────────────────────────────────────
  if (mode === "internal") {
    // Auth check
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/login?next=/impact/${slug}?mode=internal`);
    }

    const payload = await assembleInternalPayload(slug);
    if (!payload) {
      return (
        <div className="min-h-screen bg-[#0a0c0f] flex items-center justify-center">
          <p style={{ fontFamily: "ui-monospace, monospace", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
            Organization not found.
          </p>
        </div>
      );
    }

    // Verify org membership
    const { data: orgRow } = await supabase
      .from("orgs")
      .select("id")
      .eq("slug", slug)
      .single();

    if (orgRow) {
      const { data: membership } = await supabase
        .from("org_users")
        .select("id")
        .eq("org_id", orgRow.id)
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        redirect(`/login?next=/impact/${slug}?mode=internal`);
      }
    }

    return <TerminalView payload={payload} slug={slug} />;
  }

  const payload = await assemblePublicPayload(slug);

  if (!payload) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <p className="font-jakarta text-white/40 text-sm">
          Organization not found.
        </p>
      </div>
    );
  }

  // Build stats from headline metrics across all programs
  const stats = payload.programs
    .filter((p) => p.headline_metric)
    .map((p) => {
      const raw = p.headline_metric!.value;
      const numMatch = raw.match(/[\d,]+/);
      const num = numMatch ? parseInt(numMatch[0].replace(/,/g, ""), 10) : 0;
      const unit = raw.replace(/[\d,]+/, "").trim() || "";
      return {
        value: num,
        unit,
        label: p.headline_metric!.label,
      };
    })
    .slice(0, 3);

  const firstOutcome = payload.programs.find((p) => p.outcome_sentence)?.outcome_sentence ?? null;

  // Build spine nav sections
  const navSections = [
    { id: "section-hero", label: "Identity" },
    { id: "section-stats", label: "Numbers" },
    { id: "section-programs", label: "Programs" },
  ];
  if (payload.closing_testimonial) {
    navSections.push({ id: "section-testimonial", label: "Voices" });
  }
  navSections.push({ id: "section-footer", label: "Candela" });

  return (
    <div className="bg-black">
      <SpineNav sections={navSections} />

      {/* Section 1 — Hero */}
      <HeroSection
        orgName={payload.org.name}
        missionShort={payload.org.mission_short}
        logoUrl={payload.org.logo_url}
        heroPhotoUrl={payload.org.hero_photo_url}
        primaryColor={payload.org.primary_color}
        secondaryColor={payload.org.secondary_color}
      />

      {/* Section 2 — Stats */}
      <StatsSection
        periodLabel={payload.period_label}
        stats={stats}
        pullQuoteBold={firstOutcome}
        pullQuoteThin={null}
      />

      {/* Section 3 — Programs */}
      <ProgramsSection
        programs={payload.programs}
        primaryColor={payload.org.primary_color}
      />

      {/* Section 4 — Closing Testimonial */}
      {payload.closing_testimonial && (
        <section
          id="section-testimonial"
          className="min-h-screen relative flex items-center justify-center"
        >
          {/* Background photo */}
          {payload.closing_testimonial.photo_url ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${payload.closing_testimonial.photo_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ) : null}
          <div className="absolute inset-0 bg-black/[0.76]" />

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-[580px]">
            {/* Pre-label */}
            <p
              className="font-jakarta uppercase mb-6"
              style={{
                fontSize: "8px",
                fontWeight: 300,
                color: "rgba(255,255,255,0.22)",
                letterSpacing: "6px",
              }}
            >
              Community Voice
            </p>

            {/* Decorative mark */}
            <span
              className="font-quote font-bold mb-4 select-none"
              style={{
                fontSize: "140px",
                color: "rgba(255,255,255,0.05)",
                lineHeight: 0.45,
              }}
            >
              &ldquo;
            </span>

            {/* Quote */}
            <blockquote
              className="font-quote italic text-white"
              style={{ fontSize: "22px", lineHeight: 1.6 }}
            >
              {payload.closing_testimonial.text}
            </blockquote>

            {/* Gold rule */}
            <div
              className="my-6 mx-auto"
              style={{ width: "24px", height: "1px", backgroundColor: "#E9C03A" }}
            />

            {/* Attribution */}
            <p
              className="font-jakarta uppercase"
              style={{
                fontSize: "9px",
                fontWeight: 300,
                color: "#E9C03A",
                letterSpacing: "4px",
              }}
            >
              — {payload.closing_testimonial.attribution}
            </p>
          </div>
        </section>
      )}

      {/* Section 5 — Footer */}
      <section
        id="section-footer"
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#1B2B3A" }}
      >
        <div className="flex flex-col items-center text-center gap-5">
          {/* C-arc SVG */}
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="14" stroke="#E9C03A" strokeWidth="2.5" />
            <rect x="18" y="3" width="19" height="30" fill="#1B2B3A" />
            <circle cx="18" cy="18" r="7" stroke="#E9C03A" strokeWidth="2" />
            <rect x="18" y="10" width="12" height="16" fill="#1B2B3A" />
          </svg>

          <h3
            className="font-display font-black"
            style={{ fontSize: "24px", color: "#EDE8DE" }}
          >
            Candela
          </h3>

          <p
            className="font-jakarta uppercase"
            style={{
              fontSize: "11px",
              fontWeight: 200,
              letterSpacing: "3px",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            candela.education
          </p>

          <p
            className="font-quote italic"
            style={{ fontSize: "16px", color: "rgba(255,255,255,0.22)" }}
          >
            La luz que gu&iacute;a
          </p>
        </div>
      </section>
    </div>
  );
}
