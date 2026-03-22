"use client";

import { useEffect, useRef, useState } from "react";

const GOLD = "#E9C03A";

interface SpineNavProps {
  sections: Array<{ id: string; label: string }>;
}

export default function SpineNav({ sections }: SpineNavProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isStatsBg, setIsStatsBg] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect active section
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((section, i) => {
      const el = document.getElementById(section.id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(i);
            setIsStatsBg(section.id === "section-stats");
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  // Show/hide on mouse movement
  useEffect(() => {
    function show() {
      setVisible(true);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => setVisible(false), 2400);
    }

    window.addEventListener("mousemove", show, { passive: true });
    window.addEventListener("touchstart", show, { passive: true });

    return () => {
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  const trackColor = isStatsBg ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.14)";
  const inactiveDotColor = isStatsBg ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.20)";
  const labelColor = isStatsBg ? "#1B2B3A" : "#ffffff";

  return (
    <>
      {/* Desktop spine */}
      <nav
        className="fixed right-[18px] top-1/2 -translate-y-1/2 z-50 hidden md:flex items-end transition-opacity duration-700"
        style={{
          opacity: visible ? 1 : 0,
          width: "130px",
        }}
      >
        <div className="relative flex flex-col items-end gap-6">
          {/* Track line */}
          <div
            className="absolute right-[2px] top-0 bottom-0 transition-colors duration-300"
            style={{ width: "1px", backgroundColor: trackColor }}
          />

          {sections.map((section, i) => (
            <button
              key={section.id}
              onClick={() => {
                document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="relative flex items-center gap-3 group"
            >
              {/* Label */}
              <span
                className="font-jakarta uppercase transition-opacity duration-300 whitespace-nowrap"
                style={{
                  fontSize: "8px",
                  fontWeight: 300,
                  letterSpacing: "2px",
                  opacity: i === activeIndex ? 1 : 0,
                  color: i === activeIndex ? labelColor : "transparent",
                }}
              >
                {section.label}
              </span>

              {/* Dot */}
              <div
                className="relative z-10 rounded-full transition-all duration-300"
                style={{
                  width: "4px",
                  height: "4px",
                  backgroundColor: i === activeIndex ? GOLD : inactiveDotColor,
                  transform: i === activeIndex ? "scale(1.5)" : "scale(1)",
                }}
              />
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile dots — bottom center */}
      <nav
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex md:hidden gap-3 transition-opacity duration-700"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {sections.map((section, i) => (
          <button
            key={section.id}
            onClick={() => {
              document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-full transition-all duration-300"
            style={{
              width: "4px",
              height: "4px",
              backgroundColor: i === activeIndex ? GOLD : "rgba(255,255,255,0.20)",
              transform: i === activeIndex ? "scale(1.5)" : "scale(1)",
            }}
          />
        ))}
      </nav>
    </>
  );
}
