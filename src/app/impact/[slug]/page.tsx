import { Metadata } from "next";
import { redirect } from "next/navigation";
import { assemblePublicPayload } from "@/lib/impact-room/assemble-public";
import { assembleInternalPayload } from "@/lib/impact-room/assemble-internal";
import { createClient } from "@/lib/supabase/server";
import HeroSection from "@/components/impact-room/HeroSection";
import CeoMessageSection from "@/components/impact-room/CeoMessageSection";
import StatsSection from "@/components/impact-room/StatsSection";
import ProgramsSection from "@/components/impact-room/ProgramsSection";
import SpineNav from "@/components/impact-room/SpineNav";
import TerminalView from "@/components/impact-room/TerminalView";
import BoardView from "@/components/impact-room/BoardView";

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

  if (mode === "board") {
    const payload = await assemblePublicPayload(slug);
    return {
      title: payload ? `${payload.org.name} — Board Impact Summary` : "Board Summary — Not Found",
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

  // ── Board mode ───────────────────────────────────────────────────
  if (mode === "board") {
    const payload = await assemblePublicPayload(slug);
    if (!payload) {
      return (
        <div className="min-h-screen bg-[#1B2B3A] flex items-center justify-center">
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
            Organization not found.
          </p>
        </div>
      );
    }
    return <BoardView payload={payload} />;
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
    ...(payload.org.ceo_message ? [{ id: "section-ceo", label: "Message" }] : []),
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

      {/* Section 1.5 — CEO Message */}
      {payload.org.ceo_message && (
        <CeoMessageSection
          ceoMessage={payload.org.ceo_message}
          ceoName={payload.org.ceo_name ?? undefined}
          ceoTitle={payload.org.ceo_title ?? undefined}
          ceoPhotoUrl={payload.org.ceo_photo_url ?? undefined}
        />
      )}

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
        orgPhotos={payload.org_photos}
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
                fontSize: "11px",
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
              style={{ fontSize: "30px", lineHeight: 1.6 }}
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
                fontSize: "12px",
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
          {/* Candela C-arc logo */}
          <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none">
            <line x1="152" y1="58" x2="192" y2="18" stroke="#E9C03A" strokeWidth="3" strokeLinecap="round" opacity="1"/>
            <line x1="162" y1="72" x2="210" y2="52" stroke="#E9C03A" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
            <line x1="140" y1="50" x2="148" y2="8" stroke="#E9C03A" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
            <line x1="170" y1="90" x2="222" y2="82" stroke="#E9C03A" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
            <line x1="126" y1="46" x2="118" y2="4" stroke="#E9C03A" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
            <line x1="172" y1="110" x2="226" y2="116" stroke="#E9C03A" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
            <line x1="112" y1="46" x2="90" y2="10" stroke="#E9C03A" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
            <circle cx="194" cy="16" r="3" fill="#E9C03A" opacity="0.9"/>
            <circle cx="212" cy="50" r="2.5" fill="#E9C03A" opacity="0.75"/>
            <circle cx="149" cy="6" r="2.5" fill="#E9C03A" opacity="0.75"/>
            <circle cx="224" cy="80" r="2" fill="#E9C03A" opacity="0.5"/>
            <circle cx="117" cy="3" r="2" fill="#E9C03A" opacity="0.5"/>
            <path d="M 154 170 A 56 56 0 1 1 154 70" stroke="#3A6B8A" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.55"/>
            <path d="M 162 180 A 68 68 0 1 1 162 60" stroke="#E9C03A" strokeWidth="16" strokeLinecap="round" fill="none"/>
            <circle cx="162" cy="60" r="8" fill="#E9C03A"/>
            <circle cx="162" cy="180" r="8" fill="#E9C03A"/>
            <circle cx="162" cy="60" r="12" fill="rgba(233,192,58,0.15)"/>
            <circle cx="162" cy="60" r="18" fill="rgba(233,192,58,0.06)"/>
          </svg>

          <h3
            className="font-display font-black"
            style={{ fontSize: "36px", color: "#EDE8DE" }}
          >
            Candela
          </h3>

          <p
            className="font-jakarta uppercase"
            style={{
              fontSize: "16px",
              fontWeight: 200,
              letterSpacing: "3px",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            candela.education
          </p>

          <p
            className="font-quote italic"
            style={{ fontSize: "20px", color: "rgba(255,255,255,0.22)" }}
          >
            La luz que gu&iacute;a
          </p>
        </div>
      </section>
    </div>
  );
}
