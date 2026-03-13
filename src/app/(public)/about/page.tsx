import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Candela",
  description:
    "Candela builds AI tools, training, and consulting for nonprofit case managers and the organizations that support them.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
      <p className="font-mono text-[10px] text-cerulean uppercase tracking-[0.2em] mb-2">
        About
      </p>
      <h1 className="font-fraunces text-3xl sm:text-4xl text-midnight leading-tight mb-6">
        Built for the people who do the hardest work
      </h1>
      <p className="font-jost text-base text-midnight/70 leading-relaxed mb-8">
        Candela builds AI-powered tools, professional training, and strategic
        consulting purpose-built for nonprofit case managers and the
        organizations that support them. We believe the people closest to
        communities deserve the best technology — not afterthoughts.
      </p>
      <div className="bg-stone rounded-xl border border-stone/60 p-6 text-center">
        <p className="font-jost text-sm text-midnight/50">
          Full page coming soon.
        </p>
        <a
          href="mailto:hello@candela.education"
          className="inline-block mt-3 font-jost text-sm text-cerulean hover:text-cerulean-dark transition-colors"
        >
          hello@candela.education
        </a>
      </div>
    </div>
  );
}
