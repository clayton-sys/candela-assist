"use client";

import React from "react";

interface ButtonProps {
  variant: "primary" | "ghost" | "cta";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}

const SIZE_STYLES: Record<"sm" | "md" | "lg", React.CSSProperties> = {
  sm: { padding: "6px 16px", fontSize: 11 },
  md: { padding: "10px 24px", fontSize: 12 },
  lg: { padding: "12px 28px", fontSize: 13 },
};

const VARIANT_STYLES: Record<"primary" | "ghost" | "cta", React.CSSProperties> = {
  primary: {
    background: "#E9C03A",
    color: "#0f1c27",
    border: "none",
    borderRadius: 24,
  },
  ghost: {
    background: "transparent",
    border: "0.5px solid rgba(237,232,222,0.25)",
    color: "rgba(237,232,222,0.6)",
    borderRadius: 24,
  },
  cta: {
    background: "rgba(233,192,58,0.1)",
    border: "0.5px solid rgba(233,192,58,0.35)",
    color: "#E9C03A",
    borderRadius: 24,
  },
};

export default function Button({
  variant,
  size = "md",
  children,
  onClick,
  href,
  className,
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    transition: "all 150ms ease",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    ...VARIANT_STYLES[variant],
    ...SIZE_STYLES[size],
  };

  const hoverHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget;
      if (variant === "primary") {
        el.style.filter = "brightness(1.08)";
      } else if (variant === "ghost") {
        el.style.borderColor = "rgba(237,232,222,0.6)";
        el.style.color = "rgba(237,232,222,1)";
      } else if (variant === "cta") {
        el.style.background = "rgba(233,192,58,0.2)";
        el.style.boxShadow = "0 0 20px rgba(233,192,58,0.2)";
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget;
      if (variant === "primary") {
        el.style.filter = "";
      } else if (variant === "ghost") {
        el.style.borderColor = "rgba(237,232,222,0.25)";
        el.style.color = "rgba(237,232,222,0.6)";
      } else if (variant === "cta") {
        el.style.background = "rgba(233,192,58,0.1)";
        el.style.boxShadow = "";
      }
    },
  };

  if (href) {
    return (
      <a href={href} style={baseStyle} className={className} {...hoverHandlers}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} style={baseStyle} className={className} {...hoverHandlers}>
      {children}
    </button>
  );
}
