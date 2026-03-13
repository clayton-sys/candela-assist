"use client";

import Link from "next/link";

interface ProductCardProps {
  number: string;
  name: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  accentColor: string;
  bgGradient: string;
  borderGradient: string;
}

export default function ProductCard({
  number,
  name,
  description,
  ctaLabel,
  ctaHref,
  accentColor,
  bgGradient,
  borderGradient,
}: ProductCardProps) {
  return (
    <Link
      href={ctaHref}
      style={{
        background: bgGradient,
        padding: "40px 32px",
        display: "flex",
        flexDirection: "column",
        borderBottom: "2px solid",
        borderImage: borderGradient,
        transition: "transform 200ms ease, box-shadow 200ms ease",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "rgba(237,232,222,0.2)",
        }}
      >
        {number}
      </span>

      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          color: "var(--stone)",
          marginTop: 8,
          fontWeight: 500,
        }}
      >
        {name}
      </span>

      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "rgba(237,232,222,0.6)",
          marginTop: 8,
          lineHeight: 1.65,
          flex: 1,
        }}
      >
        {description}
      </span>

      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 12,
          color: accentColor,
          marginTop: 20,
        }}
      >
        {ctaLabel}
      </span>
    </Link>
  );
}
