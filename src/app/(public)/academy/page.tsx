import type { Metadata } from "next";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { GradientDivider } from "@/components/ui/GradientDivider";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Candela Academy — Candela",
  description:
    "Video training library for case managers navigating HCV, SNAP, CCAP, Medicaid, TANF, WIOA, and other complex benefits programs.",
};

/* ── Course categories ────────────────────────────────────────────────── */
const COURSES = [
  { acronym: "HCV", name: "Housing Choice Voucher Program" },
  { acronym: "SNAP", name: "Supplemental Nutrition Assistance" },
  { acronym: "CCAP", name: "Colorado Child Care Assistance" },
  { acronym: "Medicaid", name: "Colorado Health Coverage" },
  { acronym: "TANF", name: "Temporary Assistance for Needy Families" },
  { acronym: "WIOA", name: "Workforce Innovation and Opportunity Act" },
];

export default function AcademyPage() {
  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 30%, rgba(29,158,117,0.15) 0%, transparent 65%),
            linear-gradient(175deg, #0f1c27 0%, #1B2B3A 50%, #0f1c27 100%)
          `,
          padding: "120px 24px 80px",
          textAlign: "center",
        }}
      >
        <SectionEyebrow>Candela Academy</SectionEyebrow>
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
          Know the programs. Serve the people.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            fontSize: 17,
            color: "rgba(237,232,222,0.5)",
            maxWidth: 540,
            margin: "0 auto 32px",
            lineHeight: 1.7,
          }}
        >
          Case managers navigate some of the most complex programs in the social
          safety net. Candela Academy is a video training library built to help
          frontline staff actually understand these programs — not just process
          paperwork.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Button variant="primary" size="lg" href="mailto:hello@candela.education">
            Join the Waitlist &rarr;
          </Button>
          <Button variant="ghost" size="lg" href="mailto:hello@candela.education">
            Start a Conversation
          </Button>
        </div>
      </section>

      {/* ── COURSE CATEGORIES ────────────────────────────────────────────── */}
      <GradientDivider />
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionEyebrow>Course categories</SectionEyebrow>
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
              Programs your team needs to master
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {COURSES.map(({ acronym, name }) => (
              <div
                key={acronym}
                style={{
                  background: "rgba(237,232,222,0.03)",
                  border: "0.5px solid rgba(29,158,117,0.25)",
                  borderLeft: "3px solid #1D9E75",
                  borderRadius: 12,
                  padding: "20px 24px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "#1D9E75",
                    marginBottom: 4,
                  }}
                >
                  {acronym}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "rgba(237,232,222,0.6)",
                    lineHeight: 1.5,
                  }}
                >
                  {name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTRUCTOR BIO ───────────────────────────────────────────────── */}
      <GradientDivider />
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <SectionEyebrow>Your instructor</SectionEyebrow>

          <div
            style={{
              background: "rgba(237,232,222,0.04)",
              border: "0.5px solid rgba(237,232,222,0.08)",
              borderRadius: 16,
              padding: 40,
              marginTop: 24,
            }}
          >
            {/* Avatar circle */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#1D9E75",
                color: "var(--stone)",
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              CG
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 24,
                color: "var(--stone)",
                marginBottom: 8,
              }}
            >
              Clayton Gustafson
            </h3>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              {[
                "Nonprofit Leadership",
                "OIF Veteran",
                "Clinical Mental Health Counseling (M.A.)",
              ].map((cred) => (
                <span
                  key={cred}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "rgba(29,158,117,0.8)",
                    background: "rgba(29,158,117,0.1)",
                    border: "0.5px solid rgba(29,158,117,0.2)",
                    borderRadius: 100,
                    padding: "4px 12px",
                  }}
                >
                  {cred}
                </span>
              ))}
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "rgba(237,232,222,0.55)",
                lineHeight: 1.7,
                maxWidth: 500,
                margin: "0 auto",
              }}
            >
              With years of frontline experience in case management and nonprofit
              leadership, Clayton brings real-world expertise to every training
              module. Each lesson is built from the challenges case managers
              actually face.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING CTA ──────────────────────────────────────────────────── */}
      <GradientDivider />
      <section
        style={{
          background: "rgba(29,158,117,0.06)",
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
          Be the first to access Candela Academy
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            color: "rgba(237,232,222,0.5)",
            maxWidth: 480,
            margin: "0 auto 12px",
            lineHeight: 1.7,
          }}
        >
          Candela Academy is in development. Join the waitlist to be notified at
          launch.
        </p>
        <div style={{ marginTop: 24 }}>
          <Button variant="primary" size="lg" href="mailto:hello@candela.education">
            Join the Waitlist &rarr;
          </Button>
        </div>
      </section>
    </div>
  );
}
