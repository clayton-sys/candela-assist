import type { Metadata } from "next";
import Link from "next/link";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { GradientDivider } from "@/components/ui/GradientDivider";
import Button from "@/components/ui/Button";
import FaqAccordion from "@/components/ui/FaqAccordion";

export const metadata: Metadata = {
  title: "Pricing — Candela",
  description:
    "Contact Candela for pricing on AI tools, training, and consulting for nonprofit organizations.",
};

/* ── Comparison table data ────────────────────────────────────────────── */
const FEATURES = [
  { name: "Candela Assist", starter: "✓", growth: "✓", pro: "✓" },
  { name: "Grant Suite", starter: "Basic", growth: "Full", pro: "Full" },
  { name: "Brand kit", starter: "—", growth: "✓", pro: "✓" },
  { name: "Funder Command Center", starter: "—", growth: "✓", pro: "✓" },
  { name: "White-label", starter: "—", growth: "—", pro: "✓" },
  { name: "AI generations/mo", starter: "50", growth: "200", pro: "Unlimited" },
  { name: "Users", starter: "1", growth: "5", pro: "20" },
  { name: "Support", starter: "Email", growth: "Priority", pro: "Dedicated" },
];

const FAQ_ITEMS = [
  {
    question: "Can I change plans later?",
    answer:
      "Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle, and we'll prorate any difference.",
  },
  {
    question: "What counts as an AI generation?",
    answer:
      "An AI generation is any time Candela's AI produces output for you — a case note draft, a grant report section, a logic model, or an evaluation plan. Viewing, editing, or exporting existing content does not count.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "We offer a 14-day free trial on the Growth plan so you can explore the full feature set with your team. No credit card required to start.",
  },
  {
    question: "What happens if I exceed my generation limit?",
    answer:
      "You'll receive a notification when you're approaching your limit. Once reached, you can upgrade your plan or purchase additional generations as needed. We'll never cut off access to your existing work.",
  },
];

function CellValue({ value }: { value: string }) {
  if (value === "✓") {
    return <span style={{ color: "#1D9E75", fontSize: 16 }}>✓</span>;
  }
  if (value === "—") {
    return (
      <span style={{ color: "rgba(237,232,222,0.2)", fontSize: 14 }}>—</span>
    );
  }
  return (
    <span
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 12,
        color: "rgba(237,232,222,0.7)",
      }}
    >
      {value}
    </span>
  );
}

export default function PricingPage() {
  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 30%, rgba(58,107,138,0.18) 0%, transparent 65%),
            linear-gradient(175deg, #0f1c27 0%, #1B2B3A 50%, #0f1c27 100%)`,
          padding: "120px 24px 80px",
          textAlign: "center",
        }}
      >
        <SectionEyebrow>Pricing</SectionEyebrow>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: "clamp(36px, 6vw, 60px)",
            color: "var(--stone)",
            marginTop: 16,
            marginBottom: 12,
            lineHeight: 1.1,
          }}
        >
          Plans for every organization
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            fontSize: 16,
            color: "rgba(237,232,222,0.5)",
            maxWidth: 480,
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          We work with nonprofits of all sizes. Reach out and we&apos;ll find
          the right fit for your team.
        </p>
      </section>

      {/* ── PRICING CARDS ────────────────────────────────────────────────── */}
      <GradientDivider />
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
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
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "baseline",
                }}
              >
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
              <ul style={{ listStyle: "none", padding: 0, margin: "24px 0" }}>
                {[
                  "Candela Assist",
                  "Grant Suite (basic)",
                  "50 AI generations/mo",
                  "1 user",
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
              <Button variant="ghost" size="md" href="mailto:hello@candela.education">
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
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "baseline",
                }}
              >
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
              <ul style={{ listStyle: "none", padding: 0, margin: "24px 0" }}>
                {[
                  "Everything in Starter",
                  "Brand kit",
                  "Funder Command Center",
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
              <Button variant="primary" size="md" href="mailto:hello@candela.education">
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
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "baseline",
                }}
              >
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
              <ul style={{ listStyle: "none", padding: 0, margin: "24px 0" }}>
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
              <Button variant="ghost" size="md" href="mailto:hello@candela.education">
                Get started
              </Button>
            </div>
          </div>

          {/* ── COMPARISON TABLE ──────────────────────────────────────────── */}
          <div style={{ maxWidth: 900, margin: "48px auto 0" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "0.5px solid rgba(237,232,222,0.04)",
                  }}
                >
                  <th
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "rgba(237,232,222,0.4)",
                      fontWeight: 400,
                      padding: "12px 0",
                    }}
                  >
                    Feature
                  </th>
                  <th
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--stone)",
                      fontWeight: 500,
                      padding: "12px 16px",
                      textAlign: "center",
                    }}
                  >
                    Starter
                  </th>
                  <th
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#E9C03A",
                      fontWeight: 500,
                      padding: "12px 16px",
                      textAlign: "center",
                    }}
                  >
                    Growth
                  </th>
                  <th
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--cerulean-light)",
                      fontWeight: 500,
                      padding: "12px 16px",
                      textAlign: "center",
                    }}
                  >
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((row, i) => (
                  <tr
                    key={row.name}
                    style={{
                      borderBottom: "0.5px solid rgba(237,232,222,0.04)",
                      background:
                        i % 2 === 0
                          ? "rgba(237,232,222,0.02)"
                          : "transparent",
                    }}
                  >
                    <td
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        color: "rgba(237,232,222,0.7)",
                        padding: "14px 0",
                      }}
                    >
                      {row.name}
                    </td>
                    <td style={{ textAlign: "center", padding: "14px 16px" }}>
                      <CellValue value={row.starter} />
                    </td>
                    <td style={{ textAlign: "center", padding: "14px 16px" }}>
                      <CellValue value={row.growth} />
                    </td>
                    <td style={{ textAlign: "center", padding: "14px 16px" }}>
                      <CellValue value={row.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── FAQ ──────────────────────────────────────────────────────── */}
          <div style={{ maxWidth: 700, margin: "48px auto 0" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <SectionEyebrow>Common questions</SectionEyebrow>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: "clamp(28px, 4vw, 40px)",
                  color: "var(--stone)",
                  marginTop: 16,
                  lineHeight: 1.15,
                }}
              >
                Frequently asked
              </h2>
            </div>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>

          {/* ── CTA ──────────────────────────────────────────────────────── */}
          <GradientDivider />
          <div style={{ textAlign: "center", padding: "64px 0 0" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: "clamp(24px, 4vw, 36px)",
                color: "var(--stone)",
                marginBottom: 8,
                lineHeight: 1.2,
              }}
            >
              Let&apos;s talk
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "rgba(237,232,222,0.5)",
                marginBottom: 24,
              }}
            >
              We&apos;ll walk through your needs and put together a plan that
              works for your organization.
            </p>
            <Button
              variant="primary"
              size="lg"
              href="mailto:hello@candela.education"
            >
              Contact us &rarr;
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
