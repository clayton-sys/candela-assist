import type { Metadata } from "next";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { GradientDivider } from "@/components/ui/GradientDivider";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Grant Suite — Candela",
  description:
    "Logic models, evaluation plans, grant reports, and funder-ready dashboards — generated from your program data in minutes.",
};

/* ── Feature data ─────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" stroke="#3A6B8A" strokeWidth="1.5" />
        <circle cx="16" cy="10" r="2" fill="#3A6B8A" />
        <circle cx="10" cy="20" r="2" fill="#3A6B8A" />
        <circle cx="22" cy="20" r="2" fill="#3A6B8A" />
        <path d="M16 12v2M12 19l3-3M20 19l-3-3" stroke="#3A6B8A" strokeWidth="1" />
      </svg>
    ),
    name: "Constellation Visualization",
    description:
      "See your entire program logic at a glance. Interactive visual maps connect inputs, activities, outputs, and outcomes in a constellation-style layout.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="6" y="6" width="20" height="20" rx="3" stroke="#3A6B8A" strokeWidth="1.5" />
        <path d="M10 14h12M10 18h8" stroke="#3A6B8A" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="22" r="4" fill="#3A6B8A" opacity="0.3" />
        <path d="M23 22l1 1 2-2" stroke="#3A6B8A" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    name: "Inline Editing",
    description:
      "Refine AI-generated content directly in the editor. Every section is editable — adjust language, add context, or restructure before exporting.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="3" stroke="#3A6B8A" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="4" stroke="#3A6B8A" strokeWidth="1.5" />
        <path d="M12 16h-4M20 16h4" stroke="#3A6B8A" strokeWidth="1" />
      </svg>
    ),
    name: "Brand Kit Integration",
    description:
      "Upload your logo, choose your colors, and set your fonts. Every PDF export matches your organization's brand identity automatically.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M8 4h12l6 6v18a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="#3A6B8A" strokeWidth="1.5" />
        <path d="M20 4v6h6" stroke="#3A6B8A" strokeWidth="1.5" />
        <path d="M10 18h12M10 22h8" stroke="#3A6B8A" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    name: "PDF Export",
    description:
      "Generate funder-ready PDFs with a single click. Professional formatting, branded headers, and clean typography — ready to attach to any application.",
  },
];

/* ── Steps data ───────────────────────────────────────────────────────── */
const STEPS = [
  {
    number: "01",
    title: "Input your program data",
    description:
      "Enter your program details, target population, activities, and outcomes through a guided intake flow.",
  },
  {
    number: "02",
    title: "AI generates your deliverables",
    description:
      "Candela analyzes your data and produces logic models, evaluation plans, and grant report sections in seconds.",
  },
  {
    number: "03",
    title: "Edit, brand, and export",
    description:
      "Refine the output inline, apply your brand kit, and export publication-ready PDFs for funders.",
  },
];

export default function GrantSuitePage() {
  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 30%, rgba(58,107,138,0.22) 0%, transparent 65%),
            linear-gradient(175deg, #0f1c27 0%, #1B2B3A 50%, #0f1c27 100%)
          `,
          padding: "120px 24px 80px",
          textAlign: "center",
        }}
      >
        <SectionEyebrow color="cerulean">Grant Suite</SectionEyebrow>
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
          Logic models, evaluation plans, and grant reports — in minutes.
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
          Generated from your program data. Branded to your organization. Ready
          for funders.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Button variant="primary" size="lg" href="/app/grants-reporting-suite">
            Open Grant Suite &rarr;
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
            <SectionEyebrow color="cerulean">Features</SectionEyebrow>
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
              Everything you need for funder-ready deliverables
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
                  border: "0.5px solid rgba(58,107,138,0.2)",
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
            <SectionEyebrow color="cerulean">How it works</SectionEyebrow>
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
              Three steps to funder-ready output
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 32,
              position: "relative",
            }}
          >
            {STEPS.map((step, i) => (
              <div key={step.number} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 48,
                    fontWeight: 500,
                    color: "rgba(58,107,138,0.3)",
                    lineHeight: 1,
                    marginBottom: 12,
                  }}
                >
                  {step.number}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      display: "none",
                    }}
                    className="md:!block"
                  />
                )}
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

          {/* Connector lines */}
          <div
            style={{
              display: "none",
              justifyContent: "center",
              marginTop: -160,
              marginBottom: 120,
              gap: 0,
            }}
            className="md:!flex"
          >
            <div
              style={{
                width: "25%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(58,107,138,0.4), transparent)",
              }}
            />
            <div
              style={{
                width: "25%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(58,107,138,0.4), transparent)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── PRICING CTA ──────────────────────────────────────────────────── */}
      <GradientDivider />
      <section
        style={{
          background: "rgba(58,107,138,0.08)",
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
          Ready to streamline your grant reporting?
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
          Start building logic models, evaluation plans, and grant reports
          today.
        </p>
        <Button variant="primary" size="lg" href="/app/grants-reporting-suite">
          Get started &rarr;
        </Button>
      </section>
    </div>
  );
}
