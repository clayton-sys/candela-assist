import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Candela Assist — AI Documentation for Nonprofit Case Managers",
  description:
    "Help your case managers write professional notes, referral letters, and safety plans in minutes. No account required. No client data stored.",
};

export default function LandingPage() {
  return (
    <div className="font-jost">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, #0e1e2a 0%, #1B2B3A 60%, #243446 100%)",
        }}
        className="relative overflow-hidden"
      >
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #E9C03A 0%, transparent 50%), radial-gradient(circle at 80% 20%, #3A6B8A 0%, transparent 40%)",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          {/* Eyebrow */}
          <p className="font-mono text-[11px] text-[#3A6B8A] uppercase tracking-[0.22em] mb-6">
            AI tools for case managers
          </p>

          {/* Heading */}
          <h1 className="font-fraunces font-medium text-4xl sm:text-5xl lg:text-6xl text-[#EDE8DE] leading-[1.1] tracking-tight mb-6">
            Documentation that works{" "}
            <span className="font-fraunces italic text-[#E9C03A]">
              as hard as you do.
            </span>
          </h1>

          {/* Subheading */}
          <p className="font-jost font-light text-lg sm:text-xl text-[#EDE8DE]/70 leading-[1.7] max-w-2xl mb-10">
            Candela Assist helps nonprofit case managers write professional case
            notes, referral letters, and safety plans in minutes — not hours.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              href="/input"
              className="inline-flex items-center justify-center gap-2 bg-[#E9C03A] text-[#1B2B3A] font-jost font-semibold text-sm uppercase tracking-[0.06em] px-7 py-3.5 rounded-lg hover:bg-[#C9A020] transition-colors duration-200"
            >
              Try It Free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 border-2 border-[#3A6B8A] text-[#3A6B8A] font-jost font-semibold text-sm uppercase tracking-[0.06em] px-7 py-3.5 rounded-lg hover:bg-[#3A6B8A] hover:text-white transition-colors duration-200"
            >
              See How It Works
            </a>
          </div>

          {/* Trust line */}
          <p className="font-mono text-[10px] text-[#EDE8DE]/30 tracking-[0.18em] uppercase">
            No account required · No client data stored · Built for nonprofits
          </p>
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────────────────── */}
      <section className="bg-[#EDE8DE] py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Eyebrow */}
          <p className="font-mono text-[11px] text-[#3A6B8A] uppercase tracking-[0.22em] mb-5">
            The problem
          </p>

          {/* Heading */}
          <h2 className="font-fraunces font-medium text-3xl sm:text-4xl lg:text-5xl text-[#1B2B3A] leading-[1.15] tracking-tight mb-12">
            Case managers spend hours on documentation.{" "}
            <span className="font-fraunces italic">
              Time that should go to clients.
            </span>
          </h2>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { stat: "30–45 min", unit: "per case note", label: "spent writing after every client interaction" },
              { stat: "6–8 hrs", unit: "per week", label: "lost to paperwork that could go to direct service" },
              { stat: "#1 reason", unit: "for burnout", label: "administrative burden cited by nonprofit staff" },
            ].map(({ stat, unit, label }) => (
              <div
                key={unit}
                className="bg-white rounded-xl p-6 border-t-4 border-[#E9C03A] shadow-sm"
              >
                <p className="font-fraunces font-medium text-3xl text-[#1B2B3A] leading-none mb-1">
                  {stat}
                </p>
                <p className="font-mono text-[10px] text-[#3A6B8A] uppercase tracking-[0.18em] mb-3">
                  {unit}
                </p>
                <p className="font-jost text-sm text-[#1B2B3A]/60 leading-[1.6]">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-[#1B2B3A] py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Eyebrow */}
          <p className="font-mono text-[11px] text-[#3A6B8A] uppercase tracking-[0.22em] mb-5">
            How it works
          </p>

          {/* Heading */}
          <h2 className="font-fraunces font-medium text-3xl sm:text-4xl lg:text-5xl text-[#EDE8DE] leading-[1.15] tracking-tight mb-14">
            Three steps.{" "}
            <span className="font-fraunces italic text-[#E9C03A]">Minutes, not hours.</span>
          </h2>

          {/* Steps */}
          <div className="flex flex-col gap-10">
            {[
              {
                num: "01",
                title: "Choose your document type",
                body: "Select from case notes, referral letters, safety plans, progress summaries, and more — each with its own professional format.",
              },
              {
                num: "02",
                title: "Speak or type your notes",
                body: "Dictate a voice summary right after your meeting, or paste your raw notes. No templates, no rigid forms — just your words.",
              },
              {
                num: "03",
                title: "Review and copy your draft",
                body: "Candela Assist turns your notes into a polished, professional document in seconds. Edit as needed, then paste into your system.",
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="flex gap-6 sm:gap-8">
                <div className="flex-shrink-0 w-10 h-10 rounded-full border border-[#E9C03A]/40 flex items-center justify-center mt-0.5">
                  <span className="font-mono text-[11px] text-[#E9C03A] tracking-wider">{num}</span>
                </div>
                <div>
                  <h3 className="font-fraunces font-medium text-xl text-[#EDE8DE] mb-2">{title}</h3>
                  <p className="font-jost font-light text-[#EDE8DE]/60 leading-[1.7]">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14">
            <Link
              href="/input"
              className="inline-flex items-center justify-center gap-2 bg-[#E9C03A] text-[#1B2B3A] font-jost font-semibold text-sm uppercase tracking-[0.06em] px-7 py-3.5 rounded-lg hover:bg-[#C9A020] transition-colors duration-200"
            >
              Try It Free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="bg-[#EDE8DE] py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Eyebrow */}
          <p className="font-mono text-[11px] text-[#3A6B8A] uppercase tracking-[0.22em] mb-5">
            Built for the work
          </p>

          {/* Heading */}
          <h2 className="font-fraunces font-medium text-3xl sm:text-4xl lg:text-5xl text-[#1B2B3A] leading-[1.15] tracking-tight mb-14">
            Every feature designed{" "}
            <span className="font-fraunces italic">for nonprofit case management.</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: "Multiple document types",
                body: "Case notes, referral letters, safety plans, progress summaries, intake assessments — formatted for each.",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                  </svg>
                ),
                title: "Voice dictation",
                body: "Speak your post-meeting summary out loud. Candela converts your words into professional documentation.",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Seconds, not hours",
                body: "Powered by Claude — one of the most capable AI models available — to produce accurate, professional drafts fast.",
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: "No account required",
                body: "Open it, use it, close it. No sign-up, no login, no subscription. Just the tool when you need it.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-[#1B2B3A] flex items-center justify-center text-[#E9C03A] mb-4">
                  {icon}
                </div>
                <h3 className="font-fraunces font-medium text-lg text-[#1B2B3A] mb-2">{title}</h3>
                <p className="font-jost text-sm text-[#1B2B3A]/60 leading-[1.7]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIVACY ──────────────────────────────────────────────────────── */}
      <section className="bg-[#1B2B3A] py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-10 sm:gap-16 items-start">
            {/* Lock icon */}
            <div className="flex-shrink-0 w-14 h-14 rounded-full border border-[#3A6B8A] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3A6B8A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div>
              <p className="font-mono text-[11px] text-[#3A6B8A] uppercase tracking-[0.22em] mb-4">
                Privacy first
              </p>
              <h2 className="font-fraunces font-medium text-2xl sm:text-3xl text-[#EDE8DE] leading-[1.2] mb-5">
                Your clients&apos; information never leaves this session.
              </h2>
              <p className="font-jost font-light text-[#EDE8DE]/60 leading-[1.8] mb-6">
                Candela Assist does not store, log, or retain any client information you enter. Each session is stateless — when you close the tab, everything is gone. No database. No account. No audit trail tied to your clients.
              </p>
              <p className="font-jost font-light text-[#EDE8DE]/60 leading-[1.8]">
                We built this tool for the nonprofit sector, where confidentiality isn&apos;t optional. Use it with the same confidence you bring to every client interaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, #0e1e2a 0%, #1B2B3A 60%, #243446 100%)",
        }}
        className="py-24 sm:py-32"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-mono text-[11px] text-[#3A6B8A] uppercase tracking-[0.22em] mb-6">
            Get started now
          </p>
          <h2 className="font-fraunces font-medium text-3xl sm:text-4xl lg:text-5xl text-[#EDE8DE] leading-[1.15] tracking-tight mb-6">
            Give your team{" "}
            <span className="font-fraunces italic text-[#E9C03A]">their time back.</span>
          </h2>
          <p className="font-jost font-light text-lg text-[#EDE8DE]/60 leading-[1.7] max-w-xl mx-auto mb-10">
            No account. No training. No IT ticket. Just open it and start writing better documentation today.
          </p>
          <Link
            href="/input"
            className="inline-flex items-center justify-center gap-2 bg-[#E9C03A] text-[#1B2B3A] font-jost font-semibold text-sm uppercase tracking-[0.06em] px-8 py-4 rounded-lg hover:bg-[#C9A020] transition-colors duration-200"
          >
            Try Candela Assist Free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="font-mono text-[10px] text-[#EDE8DE]/25 tracking-[0.18em] uppercase mt-6">
            No account required · No client data stored · Built for nonprofits
          </p>
        </div>
      </section>
    </div>
  );
}
