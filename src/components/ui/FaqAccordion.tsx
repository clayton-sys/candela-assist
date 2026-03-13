"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.question}
            style={{
              borderBottom: "0.5px solid rgba(237,232,222,0.06)",
            }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  color: "var(--stone)",
                  fontWeight: 400,
                }}
              >
                {item.question}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 18,
                  color: "rgba(237,232,222,0.4)",
                  marginLeft: 16,
                  flexShrink: 0,
                  transition: "transform 200ms ease",
                  transform: isOpen ? "rotate(45deg)" : "none",
                }}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "rgba(237,232,222,0.6)",
                  padding: "0 0 16px",
                  lineHeight: 1.7,
                }}
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
