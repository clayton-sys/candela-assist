"use client";

import { useEffect, useRef, useState } from "react";

const GOLD = "#E9C03A";

interface ProgramData {
  id: string;
  name: string;
  name_descriptor: string | null;
  name_bold: string;
  photo_url: string | null;
  headline_metric: { label: string; value: string } | null;
  outcome_sentence: string | null;
  quote: { text: string; attribution: string } | null;
}

interface ProgramsSectionProps {
  programs: ProgramData[];
  primaryColor: string;
}

export default function ProgramsSection({
  programs,
  primaryColor,
}: ProgramsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const rightPanelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    rightPanelRefs.current.forEach((el, i) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIndex(i);
        },
        { threshold: 0.5 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [programs.length]);

  if (programs.length === 0) return null;

  const active = programs[activeIndex] ?? programs[0];
  const photoStyle = active.photo_url
    ? {
        backgroundImage: `url(${active.photo_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundColor: primaryColor };

  return (
    <section id="section-programs" className="relative">
      <div className="flex min-h-screen">
        {/* Left panel — sticky */}
        <div
          className="hidden md:block w-[42%] sticky top-0 h-screen"
          style={{ zIndex: 1 }}
        >
          <div className="relative w-full h-full" style={photoStyle}>
            {/* 50% dark overlay */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-end p-10 pb-16">
              {/* Program eyebrow */}
              <p
                className="font-jakarta uppercase mb-3"
                style={{
                  fontSize: "11px",
                  fontWeight: 300,
                  color: GOLD,
                  letterSpacing: "5px",
                }}
              >
                Program {activeIndex + 1} of {programs.length}
              </p>

              {/* Descriptor (thin) */}
              {active.name_descriptor && (
                <p
                  className="font-jakarta uppercase text-white/[0.45] mb-1"
                  style={{
                    fontSize: "14px",
                    fontWeight: 200,
                    letterSpacing: "2px",
                  }}
                >
                  {active.name_descriptor}
                </p>
              )}

              {/* Program name (bold) */}
              <h2
                className="font-display font-black text-white mb-6"
                style={{
                  fontSize: "36px",
                  letterSpacing: "-0.5px",
                }}
              >
                {active.name_bold}
              </h2>

              {/* Headline metric */}
              {active.headline_metric && (
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span
                      className="font-display font-black text-white"
                      style={{ fontSize: "88px", letterSpacing: "-4px", lineHeight: 1 }}
                    >
                      {active.headline_metric.value}
                    </span>
                  </div>
                  <p
                    className="font-jakarta uppercase text-white/[0.35] mt-2"
                    style={{
                      fontSize: "16px",
                      fontWeight: 300,
                      letterSpacing: "4px",
                    }}
                  >
                    {active.headline_metric.label}
                  </p>
                </div>
              )}

              {/* Progress dots */}
              <div className="flex gap-2 mt-4">
                {programs.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: "5px",
                      height: "5px",
                      backgroundColor:
                        i === activeIndex ? GOLD : "rgba(255,255,255,0.18)",
                      transform: i === activeIndex ? "scale(1.5)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — scrolling */}
        <div className="w-full md:w-[58%]" style={{ backgroundColor: "#111111" }}>
          {programs.map((prog, i) => (
            <div
              key={prog.id}
              ref={(el) => { rightPanelRefs.current[i] = el; }}
              className="min-h-screen flex flex-col justify-center p-8 md:p-16"
            >
              {/* Mobile: program name (hidden on desktop where left panel shows it) */}
              <div className="md:hidden mb-8">
                <p
                  className="font-jakarta uppercase mb-2"
                  style={{
                    fontSize: "11px",
                    fontWeight: 300,
                    color: GOLD,
                    letterSpacing: "5px",
                  }}
                >
                  Program {i + 1} of {programs.length}
                </p>
                {prog.name_descriptor && (
                  <p
                    className="font-jakarta uppercase text-white/[0.45] mb-1"
                    style={{ fontSize: "14px", fontWeight: 200, letterSpacing: "2px" }}
                  >
                    {prog.name_descriptor}
                  </p>
                )}
                <h2
                  className="font-display font-black text-white"
                  style={{ fontSize: "30px", letterSpacing: "-0.5px" }}
                >
                  {prog.name_bold}
                </h2>
                {prog.headline_metric && (
                  <div className="mt-4">
                    <span
                      className="font-display font-black text-white"
                      style={{ fontSize: "64px", letterSpacing: "-3px", lineHeight: 1 }}
                    >
                      {prog.headline_metric.value}
                    </span>
                    <p
                      className="font-jakarta uppercase text-white/[0.35] mt-1"
                      style={{ fontSize: "16px", fontWeight: 300, letterSpacing: "4px" }}
                    >
                      {prog.headline_metric.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Outcome */}
              {prog.outcome_sentence && (
                <div className="mb-12">
                  <p
                    className="font-jakarta uppercase mb-4"
                    style={{
                      fontSize: "11px",
                      fontWeight: 300,
                      color: GOLD,
                      letterSpacing: "5px",
                    }}
                  >
                    Outcome
                  </p>
                  <p
                    className="font-jakarta text-white/[0.65]"
                    style={{
                      fontSize: "20px",
                      fontWeight: 300,
                      lineHeight: 1.75,
                    }}
                  >
                    {prog.outcome_sentence}
                  </p>
                </div>
              )}

              {/* Quote */}
              {prog.quote && (
                <div>
                  <p
                    className="font-jakarta uppercase mb-4"
                    style={{
                      fontSize: "11px",
                      fontWeight: 300,
                      color: "rgba(255,255,255,0.22)",
                      letterSpacing: "4px",
                    }}
                  >
                    In their words —
                  </p>
                  <div className="relative">
                    {/* Decorative quote mark */}
                    <span
                      className="font-quote font-bold absolute -top-4 -left-2 select-none pointer-events-none"
                      style={{
                        fontSize: "100px",
                        color: "rgba(233,192,58,0.12)",
                        lineHeight: 0.45,
                      }}
                    >
                      &ldquo;
                    </span>
                    <blockquote
                      className="font-quote italic text-white relative z-10"
                      style={{
                        fontSize: "28px",
                        lineHeight: 1.55,
                      }}
                    >
                      {prog.quote.text}
                    </blockquote>
                    <p
                      className="font-jakarta uppercase mt-4"
                      style={{
                        fontSize: "12px",
                        fontWeight: 300,
                        color: GOLD,
                        letterSpacing: "4px",
                      }}
                    >
                      — {prog.quote.attribution}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
