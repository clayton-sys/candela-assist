import Link from "next/link";
import { Zap, BookOpen, Lightbulb } from "lucide-react";

export const metadata = {
  title: "Candela — AI for Nonprofits",
  description:
    "Candela builds AI tools, educational content, and consulting services purpose-built for nonprofit case managers and the organizations that support them.",
};

export default function HomePage() {
  return (
    <div className="font-jost">

      {/* ── SECTION 1: HERO ──────────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, #0e1e2a 0%, #1B2B3A 100%)",
        }}
        className="relative overflow-hidden"
      >
        {/* Subtle radial texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 60%, #E9C03A 0%, transparent 45%), radial-gradient(circle at 85% 15%, #3A6B8A 0%, transparent 40%)",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          {/* Eyebrow */}
          <p className="font-mono text-[11px] text-[#3A6B8A] uppercase tracking-[0.22em] mb-6">
            AI for nonprofits
          </p>

          {/* Heading */}
          <h1 className="font-fraunces font-medium text-4xl sm:text-5xl lg:text-6xl text-[#EDE8DE] leading-[1.1] tracking-tight mb-6 max-w-3xl">
            The tools, training, and strategy nonprofits need to work smarter.
          </h1>

          {/* Subheading */}
          <p className="font-jost font-light text-lg sm:text-xl text-[#EDE8DE]/70 leading-[1.75] max-w-2xl mb-10">
            Candela builds AI tools, educational content, and consulting
            services purpose-built for nonprofit case managers and the
            organizations that support them.
          </p>

          {/* Tagline */}
          <p className="font-mono text-[11px] text-[#E9C03A] uppercase tracking-[0.22em]">
            La luz que guía
          </p>
        </div>
      </section>

      {/* ── SECTION 2: THREE PRODUCT CARDS ───────────────────────────────── */}
      <section className="bg-[#EDE8DE] py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Eyebrow */}
          <p className="font-mono text-[11px] text-[#3A6B8A] uppercase tracking-[0.22em] mb-5">
            The platform
          </p>

          {/* Heading */}
          <h2 className="font-fraunces font-normal text-3xl sm:text-4xl text-[#1B2B3A] leading-[1.2] tracking-tight mb-12">
            Three ways Candela serves your organization.
          </h2>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            {/* ── Card 1: Candela Assist ── */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-[#E9C03A] p-7 flex flex-col">
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-[#1B2B3A] flex items-center justify-center mb-5">
                <Zap className="w-5 h-5 text-[#E9C03A]" />
              </div>

              {/* Eyebrow */}
              <p className="font-mono text-[10px] text-[#3A6B8A] uppercase tracking-[0.22em] mb-2">
                AI Tools
              </p>

              {/* Title */}
              <h3 className="font-fraunces font-semibold text-xl text-[#1B2B3A] mb-3">
                Candela Assist
              </h3>

              {/* Description */}
              <p className="font-jost font-light text-sm text-[#1B2B3A]/60 leading-[1.7] mb-5 flex-1">
                AI-powered documentation tools for nonprofit case managers.
                Write professional case notes, referral letters, and safety
                plans in minutes — not hours.
              </p>

              {/* Status badge */}
              <div className="mb-5">
                <span className="inline-block font-mono text-[9px] uppercase tracking-[0.18em] bg-[#E9C03A] text-[#1B2B3A] px-3 py-1 rounded-full">
                  Available Now
                </span>
              </div>

              {/* CTA */}
              <Link
                href="/app/assist"
                className="inline-flex items-center justify-center gap-2 bg-[#1B2B3A] text-[#E9C03A] font-jost font-semibold text-xs uppercase tracking-[0.08em] px-5 py-3 rounded-lg hover:bg-[#0e1e2a] transition-colors duration-200"
              >
                Try It Free
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* ── Card 2: Candela Academy ── */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-[#E9C03A] p-7 flex flex-col">
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-[#3A6B8A] flex items-center justify-center mb-5">
                <BookOpen className="w-5 h-5 text-white" />
              </div>

              {/* Eyebrow */}
              <p className="font-mono text-[10px] text-[#3A6B8A] uppercase tracking-[0.22em] mb-2">
                Training
              </p>

              {/* Title */}
              <h3 className="font-fraunces font-semibold text-xl text-[#1B2B3A] mb-3">
                Candela Academy
              </h3>

              {/* Description */}
              <p className="font-jost font-light text-sm text-[#1B2B3A]/60 leading-[1.7] mb-5 flex-1">
                Video training library for case managers navigating HCV, SNAP,
                CCAP, Medicaid, TANF, WIOA, and other complex benefits programs.
              </p>

              {/* Status badge */}
              <div className="mb-5">
                <span className="inline-block font-mono text-[9px] uppercase tracking-[0.18em] bg-[#3A6B8A] text-white px-3 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>

              {/* CTA */}
              <a
                href="mailto:hello@candela.education"
                className="inline-flex items-center justify-center gap-2 bg-[#3A6B8A] text-white font-jost font-semibold text-xs uppercase tracking-[0.08em] px-5 py-3 rounded-lg hover:bg-[#2A5570] transition-colors duration-200"
              >
                Join the Waitlist
              </a>
            </div>

            {/* ── Card 3: Candela Consulting ── */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-[#E9C03A] p-7 flex flex-col">
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-[#1B2B3A] flex items-center justify-center mb-5">
                <Lightbulb className="w-5 h-5 text-[#E9C03A]" />
              </div>

              {/* Eyebrow */}
              <p className="font-mono text-[10px] text-[#3A6B8A] uppercase tracking-[0.22em] mb-2">
                Consulting
              </p>

              {/* Title */}
              <h3 className="font-fraunces font-semibold text-xl text-[#1B2B3A] mb-3">
                Candela Consulting
              </h3>

              {/* Description */}
              <p className="font-jost font-light text-sm text-[#1B2B3A]/60 leading-[1.7] mb-5 flex-1">
                Strategy and implementation for nonprofits ready to leverage AI.
                AI readiness assessments, implementation sprints, and ongoing
                advisory engagements.
              </p>

              {/* Status badge */}
              <div className="mb-5">
                <span className="inline-block font-mono text-[9px] uppercase tracking-[0.18em] bg-[#1B2B3A] text-[#EDE8DE] px-3 py-1 rounded-full">
                  Accepting Clients
                </span>
              </div>

              {/* CTA */}
              <a
                href="mailto:hello@candela.education"
                className="inline-flex items-center justify-center gap-2 bg-[#1B2B3A] text-[#EDE8DE] font-jost font-semibold text-xs uppercase tracking-[0.08em] px-5 py-3 rounded-lg hover:bg-[#0e1e2a] transition-colors duration-200"
              >
                Start a Conversation
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 3: CANDELA ASSIST DETAIL ─────────────────────────────── */}
      <section
        id="assist"
        style={{
          background: "linear-gradient(135deg, #0e1e2a 0%, #1B2B3A 100%)",
        }}
        className="py-20 sm:py-28"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Product name */}
          <p className="font-mono text-5xl sm:text-6xl text-[#E9C03A] uppercase tracking-[0.22em] leading-none mb-5">
            Candela Assist
          </p>

          {/* Heading */}
          <h2 className="font-fraunces font-normal text-3xl sm:text-4xl lg:text-5xl text-[#EDE8DE] leading-[1.15] tracking-tight mb-12">
            Documentation that works as hard as you do.
          </h2>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-16">

            {/* Left: body + sub-products */}
            <div>
              <p className="font-jost font-light text-[#EDE8DE]/70 leading-[1.8] mb-10">
                Case managers spend 30–45 minutes writing a single progress
                note. Multiply that across a full caseload and documentation
                becomes the job — leaving less time for the people who need
                help. Candela Assist changes that. Speak or paste your notes
                after a meeting and receive a professional draft in seconds.
              </p>

              {/* Sub-product rows */}
              <div className="flex flex-col gap-6">
                {/* Row 1 — available */}
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

                {/* Row 2 — coming soon */}
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

            {/* Right: feature pills */}
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

      {/* ── SECTION 4: CANDELA ACADEMY DETAIL ────────────────────────────── */}
      <section id="academy" className="bg-[#EDE8DE] py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Product name */}
          <p className="font-mono text-5xl sm:text-6xl text-[#3A6B8A] uppercase tracking-[0.22em] leading-none mb-5">
            Candela Academy
          </p>

          {/* Heading */}
          <h2 className="font-fraunces font-normal text-3xl sm:text-4xl lg:text-5xl text-[#1B2B3A] leading-[1.15] tracking-tight mb-6">
            Know the programs. Serve the people.
          </h2>

          {/* Body */}
          <p className="font-jost font-light text-[#1B2B3A]/70 leading-[1.8] max-w-2xl mb-12">
            Case managers navigate some of the most complex programs in the
            social safety net. Candela Academy is a video training library
            built to help frontline staff actually understand these programs —
            not just process paperwork.
          </p>

          {/* Topic cards 2×3 grid */}
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

          {/* Waitlist CTA */}
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

      {/* ── SECTION 5: CANDELA CONSULTING DETAIL ─────────────────────────── */}
      <section
        id="consulting"
        style={{
          background: "linear-gradient(135deg, #0e1e2a 0%, #1B2B3A 100%)",
        }}
        className="py-20 sm:py-28"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Product name */}
          <p className="font-mono text-5xl sm:text-6xl text-[#E9C03A] uppercase tracking-[0.22em] leading-none mb-5">
            Candela Consulting
          </p>

          {/* Heading */}
          <h2 className="font-fraunces font-normal text-3xl sm:text-4xl lg:text-5xl text-[#EDE8DE] leading-[1.15] tracking-tight mb-6 max-w-3xl">
            Strategy and implementation for nonprofits ready to work smarter.
          </h2>

          {/* Body */}
          <p className="font-jost font-light text-[#EDE8DE]/70 leading-[1.8] max-w-2xl mb-12">
            Most nonprofits know AI could help — but don&apos;t know where to
            start, what&apos;s safe, or how to get their team on board. Candela
            Consulting bridges the gap between AI potential and nonprofit
            reality.
          </p>

          {/* Service cards */}
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

          {/* CTA */}
          <a
            href="mailto:hello@candela.education"
            className="inline-flex items-center justify-center gap-2 bg-[#E9C03A] text-[#1B2B3A] font-jost font-semibold text-xs uppercase tracking-[0.08em] px-7 py-3.5 rounded-lg hover:bg-[#C9A020] transition-colors duration-200"
          >
            Start a Conversation
          </a>
        </div>
      </section>

      {/* ── SECTION 6: FOOTER ────────────────────────────────────────────── */}
      <footer className="bg-[#1B2B3A] py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Top row: logo/name + nav links */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            {/* Logo + name */}
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/candela-logo-primary.svg"
                alt="Candela"
                width={32}
                height={32}
              />
              <span className="font-fraunces font-medium text-lg text-[#EDE8DE]">
                Candela
              </span>
            </div>

            {/* Anchor nav */}
            <nav className="flex gap-6" aria-label="Footer navigation">
              {[
                { label: "Assist", href: "#assist" },
                { label: "Academy", href: "#academy" },
                { label: "Consulting", href: "#consulting" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="font-jost font-light text-sm text-[#EDE8DE]/50 hover:text-[#EDE8DE]/80 transition-colors duration-200"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* Middle: contact */}
          <p className="font-mono text-[10px] text-[#EDE8DE]/40 uppercase tracking-[0.18em] mb-4">
            candela.education · hello@candela.education
          </p>

          {/* Bottom: legal */}
          <p className="font-mono text-[9px] text-[#EDE8DE]/25 uppercase tracking-[0.14em]">
            © 2026 Candela · Built for nonprofit case managers · La luz que guía
          </p>

        </div>
      </footer>

    </div>
  );
}
