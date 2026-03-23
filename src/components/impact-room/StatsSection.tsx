"use client";

import { useEffect, useRef, useState } from "react";

const GOLD = "#E9C03A";
const INK = "#1B2B3A";

interface StatItem {
  value: number;
  unit: string;
  label: string;
}

interface StatsSectionProps {
  periodLabel: string;
  stats: StatItem[];
  pullQuoteBold: string | null;
  pullQuoteThin: string | null;
}

function AnimatedNumber({ target, started }: { target: number; started: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!started) return;
    const duration = 1100;
    const steps = 60;
    const stepDuration = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      setCurrent(Math.round(target * progress));
      if (step >= steps) clearInterval(interval);
    }, stepDuration);

    return () => clearInterval(interval);
  }, [target, started]);

  return <>{started ? current.toLocaleString() : "0"}</>;
}

export default function StatsSection({
  periodLabel,
  stats,
  pullQuoteBold,
  pullQuoteThin,
}: StatsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (stats.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="section-stats"
      className="min-h-screen flex items-center justify-center bg-white px-6"
    >
      <div className="max-w-4xl w-full">
        {/* Eyebrow */}
        <p
          className="font-jakarta uppercase mb-9"
          style={{
            fontSize: "12px",
            fontWeight: 300,
            letterSpacing: "6px",
            color: "#bbbbbb",
          }}
        >
          {periodLabel} — By the numbers
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-0">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex-1 min-w-[140px] py-4"
              style={{
                borderRight:
                  i < stats.length - 1 ? "0.5px solid #eeeeee" : "none",
                paddingLeft: i > 0 ? "32px" : "0",
                paddingRight: i < stats.length - 1 ? "32px" : "0",
              }}
            >
              <div className="flex items-baseline">
                <span
                  className="font-display font-black"
                  style={{
                    fontSize: "clamp(72px, 8vw, 96px)",
                    color: INK,
                    letterSpacing: "-4px",
                    lineHeight: 1,
                  }}
                >
                  <AnimatedNumber target={stat.value} started={started} />
                </span>
                {stat.unit && (
                  <span
                    className="font-jakarta ml-1"
                    style={{
                      fontSize: "18px",
                      fontWeight: 200,
                      color: GOLD,
                    }}
                  >
                    {stat.unit}
                  </span>
                )}
              </div>
              <p
                className="font-jakarta uppercase mt-2"
                style={{
                  fontSize: "16px",
                  fontWeight: 300,
                  letterSpacing: "4px",
                  color: "#cccccc",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Gold rule */}
        <div
          className="my-5"
          style={{ width: "24px", height: "1px", backgroundColor: GOLD }}
        />

        {/* Pull quote */}
        {pullQuoteBold && (
          <div className="max-w-lg">
            <p className="font-display font-bold" style={{ fontSize: "24px", color: INK }}>
              {pullQuoteBold}
            </p>
            {pullQuoteThin && (
              <p
                className="font-jakarta mt-2"
                style={{
                  fontSize: "18px",
                  fontWeight: 300,
                  color: "#aaaaaa",
                  lineHeight: 1.7,
                }}
              >
                {pullQuoteThin}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
