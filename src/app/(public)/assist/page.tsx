import type { Metadata } from "next";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { GradientDivider } from "@/components/ui/GradientDivider";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Candela Assist — Candela",
  description:
    "AI-powered documentation tools for nonprofit case managers. Write professional case notes, referral letters, and safety plans in minutes — not hours.",
};

/* ── Feature data ─────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="6" y="4" width="20" height="24" rx="3" stroke="#E9C03A" strokeWidth="1.5" />
        <path d="M10 10h12M10 14h12M10 18h8" stroke="#E9C03A" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    name: "Case Notes",
    description:
      "Speak or paste your notes after a meeting and receive a professional DAP progress note draft in seconds. Voice dictation included.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M6 8h20v16H6z" stroke="#E9C03A" strokeWidth="1.5" />
        <path d="M6 12h20" stroke="#E9C03A" strokeWidth="1" />
        <path d="M16 12v12" stroke="#E9C03A" strokeWidth="1" />
        <path d="M10 20l2-4 3 2 4-6 3 4" stroke="#E9C03A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    name: "Referral Letters",
    description:
      "Generate professional referral letters tailored to the receiving agency, including relevant client context and program eligibility.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4l3 6h7l-5.5 4.5L22 22l-6-4-6 4 1.5-7.5L6 10h7l3-6z" stroke="#E9C03A" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    name: "Safety Plans",
    description:
      "Create structured safety plan summaries with warning signs, coping strategies, and emergency contacts — formatted for clinical review.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="8" y="6" width="16" height="20" rx="2" stroke="#E9C03A" strokeWidth="1.5" />
        <path d="M12 12h8M12 16h6" stroke="#E9C03A" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="16" cy="22" r="1.5" fill="#E9C03A" opacity="0.5" />
        <path d="M13 22h6" stroke="#E9C03A" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    name: "No PII Stored",
    description:
      "Candela Assist processes your input in real time and never stores personally identifiable information. Your clients' data stays yours.",
  },
];

/* ── Steps data ───────────────────────────────────────────────────────── */
const STEPS = [
  {
    number: "01",
    title: "Speak or paste your notes",
    description:
      "Use voice dictation or paste raw session notes after a client meeting.",
  },
  {
    number: "02",
    title: "AI drafts your documentation",
    description:
      "Candela generates a professional case note, referral letter, or safety plan in seconds.",
  },
  {
    number: "03",
    title: "Review, edit, and use",
    description:
      "Fine-tune the draft, copy it into your system, and move on to the next client.",
  },
];

export default function AssistPage() {
  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 30%, rgba(233,192,58,0.12) 0%, transparent 65%),
            linear-gradient(175deg, #0f1c27 0%, #1B2B3A 50%, #0f1c27 100%)
          `,
          padding: "120px 24px 80px",
          textAlign: "center",
        }}
      >
        <SectionEyebrow color="gold">Candela Assist</SectionEyebrow>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: "clamp(36px, 6vw, 64px)",
            color: "var(--stone)",
            marginTop: 20,
            marginBottom: 16,
            lineHeight: 1.1,
          }}
        >
          Documentation that works as hard as you do.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            fontSize: 17,
            color: "rgba(237,232,222,0.5)",
            maxWidth: 520,
            margin: "0 auto 32px",
            lineHeight: 1.7,
          }}
        >
          Case managers spend 30–45 minutes writing a single progress note.
          Candela Assist changes that. Speak or paste your notes and receive a
          professional draft in seconds.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Button variant="primary" size="lg" href="/app/assist">
            Open Candela Assist &rarr;
          </Button>
          <Button variant="ghost" size="lg" href="mailto:hello@candela.education">
            Start a Conversation
          </Button>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <GradientDivider />
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionEyebrow color="gold">Features</SectionEyebrow>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: "clamp(28px, 4vw, 42px)",
                color: "var(--stone)",
                marginTop: 16,
                lineHeight: 1.15,
              }}
            >
              Built for the way case managers actually work
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 24,
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.name}
                style={{
                  background: "rgba(237,232,222,0.03)",
                  border: "0.5px solid rgba(233,192,58,0.15)",
                  borderRadius: 12,
                  padding: 28,
                }}
              >
                <div style={{ marginBottom: 12 }}>{f.icon}</div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontSize: 20,
                    color: "var(--stone)",
                    marginBottom: 8,
                  }}
                >
                  {f.name}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "rgba(237,232,222,0.6)",
                    lineHeight: 1.65,
                  }}
                >
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <GradientDivider />
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionEyebrow color="gold">How it works</SectionEyebrow>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: "clamp(28px, 4vw, 42px)",
                color: "var(--stone)",
                marginTop: 16,
                lineHeight: 1.15,
              }}
            >
              From raw notes to polished documentation
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 32,
            }}
          >
            {STEPS.map((step) => (
              <div key={step.number} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 48,
                    fontWeight: 500,
                    color: "rgba(233,192,58,0.3)",
                    lineHeight: 1,
                    marginBottom: 12,
                  }}
                >
                  {step.number}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontSize: 18,
                    color: "var(--stone)",
                    marginBottom: 8,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "rgba(237,232,222,0.55)",
                    lineHeight: 1.65,
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING CTA ──────────────────────────────────────────────────── */}
      <GradientDivider />
      <section
        style={{
          background: "rgba(233,192,58,0.06)",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: "clamp(28px, 4vw, 42px)",
            color: "var(--stone)",
            marginBottom: 12,
            lineHeight: 1.15,
          }}
        >
          Spend less time on paperwork. More time with clients.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            color: "rgba(237,232,222,0.5)",
            maxWidth: 480,
            margin: "0 auto 32px",
            lineHeight: 1.7,
          }}
        >
          Try Candela Assist free and see how much time you can save.
        </p>
        <Button variant="primary" size="lg" href="/app/assist">
          Try it free &rarr;
        </Button>
      </section>
    </div>
  );
}
