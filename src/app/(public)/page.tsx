import Link from "next/link";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { GradientDivider } from "@/components/ui/GradientDivider";
import Button from "@/components/ui/Button";
import MetricCards from "@/components/ui/MetricCards";
import ProductCard from "@/components/ui/ProductCard";

export const metadata = {
  title: "Candela — AI for Nonprofits",
  description:
    "Candela builds AI tools, educational content, and consulting services purpose-built for nonprofit case managers and the organizations that support them.",
};

/* ── Product card data ───────────────────────────────────────────────── */
const PRODUCTS = [
  {
    number: "01",
    name: "Candela Grants & Reporting Suite",
    description:
      "Logic models, evaluation plans, grant reports, and funder-ready dashboards — generated from your program data in minutes.",
    ctaLabel: "Learn more →",
    ctaHref: "/app/impact-studio",
    accentColor: "#5a8fad",
    bgGradient: "linear-gradient(135deg, rgba(58,107,138,0.12) 0%, rgba(15,28,39,0.6) 100%)",
    borderGradient: "linear-gradient(90deg, #3A6B8A, transparent) 1",
  },
  {
    number: "02",
    name: "Candela Assist",
    description:
      "AI-powered documentation tools for nonprofit case managers. Write professional case notes, referral letters, and safety plans in minutes — not hours.",
    ctaLabel: "Learn more →",
    ctaHref: "/app/assist",
    accentColor: "#E9C03A",
    bgGradient: "linear-gradient(135deg, rgba(233,192,58,0.08) 0%, rgba(15,28,39,0.6) 100%)",
    borderGradient: "linear-gradient(90deg, #E9C03A, transparent) 1",
  },
  {
    number: "03",
    name: "Candela Academy",
    description:
      "Video training library for case managers navigating HCV, SNAP, CCAP, Medicaid, TANF, WIOA, and other complex benefits programs.",
    ctaLabel: "Learn more →",
    ctaHref: "/academy",
    accentColor: "#1D9E75",
    bgGradient: "linear-gradient(135deg, rgba(29,158,117,0.1) 0%, rgba(15,28,39,0.6) 100%)",
    borderGradient: "linear-gradient(90deg, #1D9E75, transparent) 1",
  },
];

/* ── Stats data ──────────────────────────────────────────────────────── */
const STATS = [
  { number: "3×", label: "Faster grant report writing" },
  { number: "89%", label: "Average employment outcomes" },
  { number: "40+", label: "Hours saved per month" },
  { number: "$0", label: "Extra cost to get started" },
];

/* ── Trust bar chips ─────────────────────────────────────────────────── */
const TRUST_CHIPS = [
  "Workforce Development",
  "Housing Nonprofits",
  "Youth Services",
  "Health Equity",
];

export default function HomePage() {
  return (
    <div>
      {/* ── SECTION: HERO ─────────────────────────────────────────────── */}
      <section
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 30%, rgba(58,107,138,0.18) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 20% 80%, rgba(233,192,58,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 80% 70%, rgba(237,232,222,0.04) 0%, transparent 60%),
            linear-gradient(175deg, #0f1c27 0%, #1B2B3A 50%, #0f1c27 100%)
          `,
        }}
        className="relative overflow-hidden"
      >
        {/* Fine grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(237,232,222,1) 1px, transparent 1px), linear-gradient(90deg, rgba(237,232,222,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.04,
          }}
          aria-hidden="true"
        />

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            paddingTop: 120,
            paddingBottom: 80,
            textAlign: "center",
            maxWidth: 900,
            margin: "0 auto",
            padding: "120px 24px 80px",
          }}
        >
          <SectionEyebrow color="gold">AI tools built for nonprofits</SectionEyebrow>

          {/* H1 */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "clamp(48px, 7vw, 80px)",
              lineHeight: 1.08,
              color: "var(--stone)",
              marginTop: 24,
              marginBottom: 0,
            }}
          >
            The tools nonprofits need to work{" "}
            <em
              style={{
                fontStyle: "italic",
                background: "linear-gradient(135deg, #f5e08a, #E9C03A, #b8741a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              smarter
            </em>
            .
          </h1>

          {/* Subhead */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              fontSize: 17,
              color: "rgba(237,232,222,0.5)",
              maxWidth: 480,
              margin: "16px auto 0",
              lineHeight: 1.7,
            }}
          >
            Candela builds AI tools, educational content, and consulting
            services purpose-built for nonprofit case managers and the
            organizations that support them.
          </p>

          {/* CTA row */}
          <div
            style={{
              marginTop: 32,
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button variant="primary" size="lg" href="/app/assist">
              Try It Free &rarr;
            </Button>
            <Button variant="ghost" size="lg" href="mailto:hello@candela.education">
              Start a Conversation
            </Button>
          </div>

          {/* 3D floating metric cards */}
          <MetricCards />
        </div>
      </section>

      {/* ── SECTION: TRUST BAR ────────────────────────────────────────── */}
      <GradientDivider />
      <section
        style={{
          padding: "24px 0",
          background: "var(--ink-deep)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
            padding: "0 24px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "rgba(237,232,222,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Trusted by
          </span>
          {TRUST_CHIPS.map((chip) => (
            <span
              key={chip}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "rgba(237,232,222,0.2)",
                border: "0.5px solid rgba(237,232,222,0.2)",
                borderRadius: 100,
                padding: "4px 14px",
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      {/* ── SECTION: PRODUCTS ─────────────────────────────────────────── */}
      <GradientDivider />
      <section
        style={{
          background: "var(--ink-deep)",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <SectionEyebrow>Our products</SectionEyebrow>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "clamp(32px, 5vw, 48px)",
              color: "var(--stone)",
              marginTop: 16,
              marginBottom: 48,
              lineHeight: 1.15,
            }}
          >
            Three ways Candela serves your organization.
          </h2>

          {/* 3-column grid with 1px gap lines */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 1,
              background: "rgba(237,232,222,0.04)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {PRODUCTS.map((p) => (
              <ProductCard key={p.number} {...p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION: STATS ────────────────────────────────────────────── */}
      <GradientDivider />
      <section
        style={{
          background: `radial-gradient(ellipse 60% 80% at 30% 50%, rgba(58,107,138,0.12) 0%, transparent 70%), #0f1c27`,
          padding: "80px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 64,
          }}
          className="md:[grid-template-columns:45%_55%]"
        >
          {/* Left column */}
          <div>
            <SectionEyebrow>By the numbers</SectionEyebrow>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: "clamp(32px, 5vw, 48px)",
                color: "var(--stone)",
                marginTop: 16,
                marginBottom: 16,
                lineHeight: 1.15,
              }}
            >
              Built for impact, measured by outcomes.
            </h2>

            <p
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                fontSize: 15,
                color: "rgba(237,232,222,0.6)",
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              Candela tools help nonprofits spend less time on paperwork and
              more time on the work that matters. Here&apos;s what our partners
              are seeing.
            </p>

            <Button variant="primary" size="md" href="mailto:hello@candela.education">
              Get started &rarr;
            </Button>
          </div>

          {/* Right column — 2×2 stat grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                style={{
                  background: "rgba(237,232,222,0.03)",
                  border: "0.5px solid rgba(237,232,222,0.06)",
                  borderRadius: 8,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontSize: 42,
                    color: "#E9C03A",
                    lineHeight: 1,
                  }}
                >
                  {s.number}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "rgba(237,232,222,0.5)",
                    marginTop: 6,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CANDELA ASSIST DETAIL ─────────────────────────── */}
      <section
        id="assist"
        style={{
          background: "linear-gradient(135deg, #0e1e2a 0%, #1B2B3A 100%)",
        }}
        className="py-20 sm:py-28"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-5xl sm:text-6xl text-[#E9C03A] uppercase tracking-[0.22em] leading-none mb-5">
            Candela Assist
          </p>

          <h2 className="font-fraunces font-normal text-3xl sm:text-4xl lg:text-5xl text-[#EDE8DE] leading-[1.15] tracking-tight mb-12">
            Documentation that works as hard as you do.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-16">
            <div>
              <p className="font-jost font-light text-[#EDE8DE]/70 leading-[1.8] mb-10">
                Case managers spend 30–45 minutes writing a single progress
                note. Multiply that across a full caseload and documentation
                becomes the job — leaving less time for the people who need
                help. Candela Assist changes that. Speak or paste your notes
                after a meeting and receive a professional draft in seconds.
              </p>

              <div className="flex flex-col gap-6">
                <div className="border-l-2 border-[#E9C03A] pl-5">
                  <p className="font-mono text-[10px] text-[#E9C03A] uppercase tracking-[0.2em] mb-1">
                    Case Manager App
                  </p>
                  <p className="font-fraunces font-medium text-lg text-[#EDE8DE] mb-1">
                    Documentation Assistant
                  </p>
                  <p className="font-jost font-light text-xs text-[#EDE8DE]/50 mb-2">
                    Available now
                  </p>
                  <Link
                    href="/app/assist"
                    className="font-mono text-[11px] text-[#3A6B8A] hover:text-[#EDE8DE] uppercase tracking-[0.18em] transition-colors duration-200"
                  >
                    Open the app →
                  </Link>
                </div>

                <div className="border-l-2 border-[#3A6B8A]/40 pl-5">
                  <p className="font-mono text-[10px] text-[#3A6B8A] uppercase tracking-[0.2em] mb-1">
                    Grant Writers App
                  </p>
                  <p className="font-fraunces font-medium text-lg text-[#EDE8DE]/50 mb-1">
                    Grant Report Writing Assistant
                  </p>
                  <p className="font-jost font-light text-xs text-[#EDE8DE]/30">
                    Coming soon
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 content-start">
              {[
                "Voice Dictation",
                "DAP Progress Notes",
                "Referral Letters",
                "Safety Plan Summaries",
                "Transcript Review",
                "Privacy First",
              ].map((pill) => (
                <span
                  key={pill}
                  className="font-mono text-[10px] text-[#1B2B3A] bg-[#EDE8DE] uppercase tracking-[0.14em] px-4 py-2 rounded-full"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: CANDELA ACADEMY DETAIL ────────────────────────── */}
      <section id="academy" className="bg-[#EDE8DE] py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-5xl sm:text-6xl text-[#3A6B8A] uppercase tracking-[0.22em] leading-none mb-5">
            Candela Academy
          </p>

          <h2 className="font-fraunces font-normal text-3xl sm:text-4xl lg:text-5xl text-[#1B2B3A] leading-[1.15] tracking-tight mb-6">
            Know the programs. Serve the people.
          </h2>

          <p className="font-jost font-light text-[#1B2B3A]/70 leading-[1.8] max-w-2xl mb-12">
            Case managers navigate some of the most complex programs in the
            social safety net. Candela Academy is a video training library
            built to help frontline staff actually understand these programs —
            not just process paperwork.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {[
              { acronym: "HCV", name: "Housing Choice Voucher Program" },
              { acronym: "SNAP", name: "Supplemental Nutrition Assistance" },
              { acronym: "CCAP", name: "Colorado Child Care Assistance" },
              { acronym: "Medicaid", name: "Colorado Health Coverage" },
              { acronym: "TANF", name: "Temporary Assistance for Needy Families" },
              { acronym: "WIOA", name: "Workforce Innovation and Opportunity Act" },
            ].map(({ acronym, name }) => (
              <div
                key={acronym}
                className="bg-white rounded-xl border-l-4 border-[#3A6B8A] px-5 py-4"
              >
                <p className="font-mono text-[10px] text-[#3A6B8A] uppercase tracking-[0.2em] mb-1">
                  {acronym}
                </p>
                <p className="font-jost font-light text-sm text-[#1B2B3A]/70 leading-[1.5]">
                  {name}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-[#1B2B3A]/10 pt-10">
            <p className="font-jost font-light text-[#1B2B3A]/60 text-sm mb-6">
              Candela Academy is in development. Join the waitlist to be
              notified at launch.
            </p>
            <a
              href="mailto:hello@candela.education"
              className="inline-flex items-center justify-center gap-2 bg-[#3A6B8A] text-white font-jost font-semibold text-xs uppercase tracking-[0.08em] px-6 py-3 rounded-lg hover:bg-[#2A5570] transition-colors duration-200"
            >
              Join the Waitlist
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: CANDELA CONSULTING DETAIL ─────────────────────── */}
      <section
        id="consulting"
        style={{
          background: "linear-gradient(135deg, #0e1e2a 0%, #1B2B3A 100%)",
        }}
        className="py-20 sm:py-28"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-5xl sm:text-6xl text-[#E9C03A] uppercase tracking-[0.22em] leading-none mb-5">
            Candela Consulting
          </p>

          <h2 className="font-fraunces font-normal text-3xl sm:text-4xl lg:text-5xl text-[#EDE8DE] leading-[1.15] tracking-tight mb-6 max-w-3xl">
            Strategy and implementation for nonprofits ready to work smarter.
          </h2>

          <p className="font-jost font-light text-[#EDE8DE]/70 leading-[1.8] max-w-2xl mb-12">
            Most nonprofits know AI could help — but don&apos;t know where to
            start, what&apos;s safe, or how to get their team on board. Candela
            Consulting bridges the gap between AI potential and nonprofit
            reality.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
            {[
              {
                label: "Assessment",
                title: "AI Readiness Assessment",
                body: "A structured evaluation of your workflows, staff capacity, and data practices — with a prioritized roadmap for AI adoption.",
              },
              {
                label: "Implementation",
                title: "Implementation Sprint",
                body: "A focused 4–6 week engagement to deploy an AI tool or workflow — with training and documentation included.",
              },
              {
                label: "Advisory",
                title: "Retainer Engagement",
                body: "Ongoing strategic and technical support for organizations building long-term AI capacity.",
              },
            ].map(({ label, title, body }) => (
              <div
                key={label}
                className="bg-[#EDE8DE] rounded-xl border-l-4 border-[#E9C03A] px-6 py-6"
              >
                <p className="font-mono text-[10px] text-[#3A6B8A] uppercase tracking-[0.2em] mb-2">
                  {label}
                </p>
                <h3 className="font-fraunces font-medium text-lg text-[#1B2B3A] mb-3 leading-snug">
                  {title}
                </h3>
                <p className="font-jost font-light text-sm text-[#1B2B3A]/60 leading-[1.7]">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <a
            href="mailto:hello@candela.education"
            className="inline-flex items-center justify-center gap-2 bg-[#E9C03A] text-[#1B2B3A] font-jost font-semibold text-xs uppercase tracking-[0.08em] px-7 py-3.5 rounded-lg hover:bg-[#C9A020] transition-colors duration-200"
          >
            Start a Conversation
          </a>
        </div>
      </section>

      {/* ── SECTION: STONE BAND (PULLQUOTE) ──────────────────────────── */}
      <GradientDivider />
      <section
        style={{
          background: "rgba(237,232,222,0.03)",
          padding: "64px 0",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 48,
            alignItems: "center",
          }}
          className="md:[grid-template-columns:60%_40%]"
        >
          {/* Left: pullquote */}
          <blockquote
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 26,
              color: "rgba(237,232,222,0.85)",
              maxWidth: 560,
              lineHeight: 1.45,
              margin: 0,
            }}
          >
            &ldquo;Nonprofits don&apos;t need more software. They need tools
            that understand the mission.&rdquo;
          </blockquote>

          {/* Right: CTA */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Button variant="primary" size="lg" href="/app/assist">
              Start for free &rarr;
            </Button>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "rgba(237,232,222,0.3)",
                marginTop: 8,
              }}
            >
              No credit card required
            </span>
          </div>
        </div>
      </section>

      {/* ── SECTION: TESTIMONIAL ─────────────────────────────────────── */}
      <GradientDivider />
      <section
        style={{
          padding: "80px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <SectionEyebrow>From the field</SectionEyebrow>

          {/* Glass card */}
          <div
            style={{
              background: "rgba(237,232,222,0.04)",
              border: "0.5px solid rgba(237,232,222,0.08)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
              borderRadius: 16,
              padding: 40,
              marginTop: 24,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top border gradient effect */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: "linear-gradient(90deg, #E9C03A, #3A6B8A)",
                borderRadius: "16px 16px 0 0",
              }}
              aria-hidden="true"
            />

            <p
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 20,
                color: "rgba(237,232,222,0.8)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              &ldquo;Candela cut our grant reporting time in half. Our team now
              spends that time with clients, not spreadsheets.&rdquo;
            </p>

            {/* Attribution */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 24,
                justifyContent: "center",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#3A6B8A",
                  color: "var(--stone)",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                MR
              </div>
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "rgba(237,232,222,0.9)",
                  }}
                >
                  Maria Rodriguez
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    color: "rgba(237,232,222,0.4)",
                  }}
                >
                  Denver Community Works
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: PRICING PREVIEW ─────────────────────────────────── */}
      <GradientDivider />
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <SectionEyebrow>Simple pricing</SectionEyebrow>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "clamp(32px, 5vw, 48px)",
              color: "var(--stone)",
              marginTop: 16,
              marginBottom: 48,
              lineHeight: 1.15,
            }}
          >
            Plans that grow with your organization
          </h2>

          {/* 3-column pricing grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {/* Starter */}
            <div
              style={{
                background: "rgba(237,232,222,0.03)",
                border: "0.5px solid rgba(237,232,222,0.08)",
                borderRadius: 12,
                padding: 32,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(237,232,222,0.5)",
                }}
              >
                Starter
              </div>
              <div style={{ marginTop: 8, display: "flex", alignItems: "baseline" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontSize: 42,
                    color: "var(--stone)",
                  }}
                >
                  $79
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "rgba(237,232,222,0.4)",
                    marginLeft: 4,
                  }}
                >
                  /mo
                </span>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "24px 0",
                }}
              >
                {["Candela Assist", "Grant Suite (basic)", "50 AI generations/mo", "1 user"].map(
                  (f) => (
                    <li
                      key={f}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        color: "rgba(237,232,222,0.7)",
                        padding: "6px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ color: "#1D9E75" }}>✓</span>
                      {f}
                    </li>
                  )
                )}
              </ul>
              <Button variant="ghost" size="md" href="/pricing">
                Get started
              </Button>
            </div>

            {/* Growth — Featured */}
            <div
              style={{
                background: "rgba(237,232,222,0.03)",
                border: "0.5px solid #E9C03A",
                boxShadow: "0 0 40px rgba(233,192,58,0.12)",
                borderRadius: 12,
                padding: 32,
                textAlign: "left",
                position: "relative",
              }}
            >
              {/* Most popular badge */}
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  background: "#E9C03A",
                  color: "#0f1c27",
                  fontFamily: "var(--font-body)",
                  fontSize: 9,
                  textTransform: "uppercase",
                  fontWeight: 500,
                  padding: "4px 10px",
                  borderRadius: "0 10px 0 8px",
                }}
              >
                Most popular
              </span>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(237,232,222,0.5)",
                }}
              >
                Growth
              </div>
              <div style={{ marginTop: 8, display: "flex", alignItems: "baseline" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontSize: 42,
                    color: "#E9C03A",
                  }}
                >
                  $149
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "rgba(237,232,222,0.4)",
                    marginLeft: 4,
                  }}
                >
                  /mo
                </span>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "24px 0",
                }}
              >
                {[
                  "Everything in Starter",
                  "Brand kit",
                  "Impact Command Center",
                  "200 AI generations/mo",
                  "5 users",
                ].map((f) => (
                  <li
                    key={f}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "rgba(237,232,222,0.7)",
                      padding: "6px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#1D9E75" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="primary" size="md" href="/pricing">
                Get started
              </Button>
            </div>

            {/* Pro */}
            <div
              style={{
                background: "rgba(237,232,222,0.03)",
                border: "0.5px solid rgba(58,107,138,0.5)",
                borderRadius: 12,
                padding: 32,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(237,232,222,0.5)",
                }}
              >
                Pro
              </div>
              <div style={{ marginTop: 8, display: "flex", alignItems: "baseline" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontSize: 42,
                    color: "var(--stone)",
                  }}
                >
                  $249
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "rgba(237,232,222,0.4)",
                    marginLeft: 4,
                  }}
                >
                  /mo
                </span>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "24px 0",
                }}
              >
                {[
                  "Everything in Growth",
                  "White-label",
                  "Unlimited generations",
                  "20 users",
                  "Priority support",
                ].map((f) => (
                  <li
                    key={f}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "rgba(237,232,222,0.7)",
                      padding: "6px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#1D9E75" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="ghost" size="md" href="/pricing">
                Get started
              </Button>
            </div>
          </div>

          {/* View full pricing link */}
          <div style={{ marginTop: 24 }}>
            <Link
              href="/pricing"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--cerulean-light)",
                textDecoration: "none",
              }}
            >
              View full pricing &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

