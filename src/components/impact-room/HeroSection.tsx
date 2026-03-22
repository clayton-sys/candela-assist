"use client";

import { useEffect, useRef, useState } from "react";

interface HeroSectionProps {
  orgName: string;
  missionShort: string | null;
  logoUrl: string | null;
  heroPhotoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export default function HeroSection({
  orgName,
  missionShort,
  logoUrl,
  heroPhotoUrl,
  primaryColor,
  secondaryColor,
}: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      if (!heroRef.current) return;
      const h = heroRef.current.offsetHeight;
      const raw = window.scrollY / h;
      setProgress(Math.min(1, Math.max(0, raw)));
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Phase calculations
  const phase1Opacity = progress < 0.4 ? 1 : Math.max(0, 1 - (progress - 0.4) / 0.3);
  const locationOpacity = progress < 0.3 ? 1 : Math.max(0, 1 - (progress - 0.3) / 0.2);
  const nameTranslateY = progress < 0.4 ? 0 : -28 * Math.min(1, (progress - 0.4) / 0.3);
  const logoTranslateY = progress < 0.4 ? 0 : -14 * Math.min(1, (progress - 0.4) / 0.3);
  const ghostOpacity = 0.07 * (1 - Math.min(1, progress / 0.7));
  const scrollHintOpacity = Math.max(0, 1 - progress / 0.3);

  const phase2Opacity = progress < 0.7 ? 0 : Math.min(1, (progress - 0.7) / 0.3);

  const bgStyle = heroPhotoUrl
    ? { backgroundImage: `url(${heroPhotoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` };

  return (
    <section
      ref={heroRef}
      id="section-hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={bgStyle}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,10,18,0.68) 0%, rgba(5,10,18,0.52) 40%, rgba(5,10,18,0.86) 100%)",
        }}
      />

      {/* Ghost text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ opacity: ghostOpacity }}
      >
        <span
          className="font-display font-black text-white uppercase text-center"
          style={{ fontSize: "clamp(80px, 12vw, 150px)", letterSpacing: "-2px" }}
        >
          {orgName}
        </span>
      </div>

      {/* Phase 1 content */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6"
        style={{ opacity: phase1Opacity }}
      >
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`${orgName} logo`}
            className="h-[52px] w-auto mb-6 brightness-0 invert"
            style={{ transform: `translateY(${logoTranslateY}px)` }}
          />
        )}
        <h1
          className="font-display font-black text-white"
          style={{
            fontSize: "clamp(32px, 5vw, 54px)",
            letterSpacing: "-2px",
            transform: `translateY(${nameTranslateY}px)`,
          }}
        >
          {orgName}
        </h1>
        <p
          className="font-jakarta uppercase text-white/[0.38] mt-3"
          style={{
            fontSize: "10px",
            fontWeight: 200,
            letterSpacing: "4px",
            opacity: locationOpacity,
          }}
        >
          Impact Report
        </p>
      </div>

      {/* Phase 2 content */}
      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
        style={{ opacity: phase2Opacity, pointerEvents: phase2Opacity > 0.1 ? "auto" : "none" }}
      >
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`${orgName} logo`}
            className="h-[52px] w-auto mb-6 brightness-0 invert"
          />
        )}
        <div className="w-8 h-px mb-6" style={{ backgroundColor: "#E9C03A" }} />
        {missionShort && (
          <p
            className="font-quote italic text-white/[0.72] text-center"
            style={{
              fontSize: "21px",
              lineHeight: 1.65,
              maxWidth: "500px",
            }}
          >
            {missionShort}
          </p>
        )}
      </div>

      {/* Scroll hint */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3"
        style={{ opacity: scrollHintOpacity }}
      >
        <span
          className="font-jakarta"
          style={{ fontSize: "7px", fontWeight: 300, color: "#E9C03A" }}
        >
          Scroll to explore
        </span>
        <div
          className="w-px h-6"
          style={{
            background: "linear-gradient(180deg, #E9C03A 0%, transparent 100%)",
          }}
        />
      </div>
    </section>
  );
}
