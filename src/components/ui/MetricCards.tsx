"use client";

import { useState } from "react";

const METRICS = [
  { stat: "421", label: "Lives changed", subtitle: "this program year" },
  { stat: "89%", label: "Employment at exit", subtitle: "4pts above state avg" },
  { stat: "$19.40", label: "Avg starting wage", subtitle: "exceeds self-suff. standard" },
];

const CARD_TRANSFORMS = [
  "perspective(800px) rotateX(6deg) rotateY(8deg) translateY(-4px)",
  "perspective(800px) rotateX(6deg) translateY(-16px)",
  "perspective(800px) rotateX(6deg) rotateY(-8deg) translateY(-4px)",
];

const HOVER_TRANSFORM = "perspective(800px) rotateX(0) rotateY(0) translateY(-20px)";

export default function MetricCards() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 16,
        marginTop: 56,
        flexWrap: "wrap",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {METRICS.map((m, i) => (
        <div
          key={m.label}
          style={{
            background: "rgba(58,107,138,0.08)",
            border: "0.5px solid rgba(237,232,222,0.08)",
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(237,232,222,0.1)",
            borderRadius: 12,
            padding: "20px 24px",
            minWidth: 180,
            textAlign: "center",
            transform: hovered ? HOVER_TRANSFORM : CARD_TRANSFORMS[i],
            transition: "transform 400ms ease",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: 36,
              color: "#E9C03A",
              lineHeight: 1,
            }}
          >
            {m.stat}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "rgba(237,232,222,0.8)",
              marginTop: 4,
            }}
          >
            {m.label}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 10,
              color: "rgba(237,232,222,0.35)",
              marginTop: 2,
            }}
          >
            {m.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}
