'use client'

import React from 'react'
import { generateInfernoPalette } from '@/lib/brand-kit/inferno-palette'

interface InfernoLogoProps {
  flamePrimary?: string   // default '#ff8800'
  flameSecondary?: string // default '#cc2000'
  size?: number           // default 200
  className?: string
  brandPrimary?: string   // Step 19 wiring — overrides flamePrimary/flameSecondary
}

export default function InfernoLogo({
  flamePrimary,
  flameSecondary,
  size = 200,
  className = '',
  brandPrimary,
}: InfernoLogoProps) {
  // Step 19: if brandPrimary supplied, generate palette from it
  const palette = generateInfernoPalette(brandPrimary)
  const primary = flamePrimary ?? palette.primary
  const secondary = flameSecondary ?? palette.darkest
  const lightest = palette.lightest
  const darker = palette.darker

  const uid = React.useId().replace(/:/g, '')
  const filterId = `inferno-light-${uid}`
  const glowId = `inferno-glow-${uid}`
  const shadowId = `inferno-shadow-${uid}`
  const specId = `inferno-spec-${uid}`

  // Stylized "C" path centered at ~100,100 in 200×200 viewBox
  const cPath =
    'M130 55 C105 38 65 42 50 65 C35 88 38 125 55 145 C72 165 105 168 130 155'

  // Ray angles and lengths
  const rays = [
    { angle: -48, length: 15 },
    { angle: -24, length: 20 },
    { angle: 0, length: 24 },
    { angle: 24, length: 20 },
    { angle: 48, length: 15 },
  ]

  // Ray origin (opening of C, roughly at 130,100)
  const rayOriginX = 130
  const rayOriginY = 105

  // Particle ring — 12 particles on orbit
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 360) / 12
    const r = i % 3 === 0 ? 3 : 1.8
    return { angle, r }
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Candela Inferno Logo"
    >
      <defs>
        {/* Dome lighting filter */}
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDiffuseLighting
            in="SourceGraphic"
            surfaceScale="4"
            diffuseConstant="0.75"
            result="diffuse"
          >
            <feDistantLight azimuth={315} elevation={36} />
          </feDiffuseLighting>
          <feComposite in="diffuse" in2="SourceGraphic" operator="in" result="lit" />
          <feSpecularLighting
            in="SourceGraphic"
            surfaceScale="5"
            specularConstant="0.8"
            specularExponent={20}
            result="spec"
          >
            <feDistantLight azimuth={315} elevation={36} />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" operator="in" result="specComp" />
          <feMerge>
            <feMergeNode in="lit" />
            <feMergeNode in="specComp" />
          </feMerge>
        </filter>

        {/* Glow filter for edge rim */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Drop shadow filter */}
        <filter id={shadowId} x="-30%" y="-10%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>

        {/* Specular glint filter */}
        <filter id={specId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      <style>{`
        @keyframes f1 {
          0%   { transform: scaleY(1) translateY(0); }
          40%  { transform: scaleY(1.11) translateY(-8px); }
          80%  { transform: scaleY(0.92) translateY(4px); }
          100% { transform: scaleY(1) translateY(0); }
        }
        @keyframes f2 {
          0%   { transform: scaleY(1) rotate(0deg); }
          45%  { transform: scaleY(1.16) rotate(2deg); }
          80%  { transform: scaleY(0.91) rotate(-1deg); }
          100% { transform: scaleY(1) rotate(0deg); }
        }
        @keyframes f3 {
          0%   { transform: scaleY(1) translateY(0); }
          35%  { transform: scaleY(1.08) translateY(-6px); }
          75%  { transform: scaleY(0.94) translateY(3px); }
          100% { transform: scaleY(1) translateY(0); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(78px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(78px) rotate(-360deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.18; }
          50%      { opacity: 0.38; }
        }
      `}</style>

      {/* Drop shadow */}
      <ellipse
        cx={105}
        cy={175}
        rx={40}
        ry={8}
        fill="rgba(0,0,0,0.5)"
        filter={`url(#${shadowId})`}
      />

      {/* Glow pulse */}
      <circle
        cx={100}
        cy={100}
        r={68}
        fill={primary}
        opacity={0.18}
        style={{ animation: 'glowPulse 3s ease-in-out infinite' }}
      />

      {/* Back flame layer — large blurry */}
      <g style={{ transformOrigin: '100px 100px' }}>
        <ellipse
          cx={90}
          cy={70}
          rx={28}
          ry={40}
          fill={secondary}
          opacity={0.5}
          style={{
            animation: 'f3 3.5s ease-in-out infinite',
            transformOrigin: '90px 100px',
            filter: 'blur(12px)',
          }}
        />
        <ellipse
          cx={110}
          cy={65}
          rx={22}
          ry={35}
          fill={darker}
          opacity={0.45}
          style={{
            animation: 'f3 4s ease-in-out infinite 0.5s',
            transformOrigin: '110px 100px',
            filter: 'blur(12px)',
          }}
        />
      </g>

      {/* Mid flame layer — medium blur */}
      <g style={{ transformOrigin: '100px 100px' }}>
        <ellipse
          cx={95}
          cy={72}
          rx={18}
          ry={30}
          fill={primary}
          opacity={0.6}
          style={{
            animation: 'f2 2.4s ease-in-out infinite',
            transformOrigin: '95px 100px',
            filter: 'blur(6px)',
          }}
        />
        <ellipse
          cx={108}
          cy={68}
          rx={16}
          ry={28}
          fill={lightest}
          opacity={0.5}
          style={{
            animation: 'f2 3.1s ease-in-out infinite 0.3s',
            transformOrigin: '108px 100px',
            filter: 'blur(6px)',
          }}
        />
      </g>

      {/* Front flame layer — small tight */}
      <ellipse
        cx={98}
        cy={78}
        rx={8}
        ry={16}
        fill={lightest}
        opacity={0.8}
        style={{
          animation: 'f1 1.8s ease-in-out infinite 0.45s',
          transformOrigin: '98px 100px',
          filter: 'blur(2px)',
        }}
      />
      <ellipse
        cx={105}
        cy={75}
        rx={7}
        ry={14}
        fill={lightest}
        opacity={0.75}
        style={{
          animation: 'f1 2.1s ease-in-out infinite 0.9s',
          transformOrigin: '105px 100px',
          filter: 'blur(2px)',
        }}
      />
      <ellipse
        cx={92}
        cy={80}
        rx={6}
        ry={12}
        fill={primary}
        opacity={0.7}
        style={{
          animation: 'f1 2.4s ease-in-out infinite 1.2s',
          transformOrigin: '92px 100px',
          filter: 'blur(2px)',
        }}
      />

      {/* Extrusion: 10 copies of C, offset progressively */}
      {Array.from({ length: 10 }, (_, i) => {
        const offset = i * 0.8
        const darkness = 0.1 + i * 0.08
        return (
          <path
            key={`extrude-${i}`}
            d={cPath}
            fill="none"
            stroke={`rgba(${Math.round(27 * (1 - darkness))}, ${Math.round(43 * (1 - darkness))}, ${Math.round(58 * (1 - darkness))}, 0.9)`}
            strokeWidth={8}
            strokeLinecap="round"
            transform={`translate(${offset * 2.2}, ${offset * 1.6})`}
          />
        )
      })}

      {/* Main C path with lighting filter */}
      <path
        d={cPath}
        fill="none"
        stroke="#EDE8DE"
        strokeWidth={9}
        strokeLinecap="round"
        filter={`url(#${filterId})`}
      />

      {/* Edge rim light */}
      <path
        d={cPath}
        fill="none"
        stroke={lightest}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
        filter={`url(#${glowId})`}
      />

      {/* Specular glint — two ellipses upper-left */}
      <g transform="rotate(-34 75 70)">
        <ellipse
          cx={75}
          cy={70}
          rx={12}
          ry={4}
          fill="white"
          opacity={0.6}
          filter={`url(#${specId})`}
        />
        <ellipse
          cx={80}
          cy={66}
          rx={8}
          ry={3}
          fill="white"
          opacity={0.4}
          filter={`url(#${specId})`}
        />
      </g>

      {/* Rays from C opening */}
      {rays.map((ray, i) => {
        const rad = (ray.angle * Math.PI) / 180
        const x2 = rayOriginX + Math.cos(rad) * ray.length
        const y2 = rayOriginY + Math.sin(rad) * ray.length
        return (
          <line
            key={`ray-${i}`}
            x1={rayOriginX}
            y1={rayOriginY}
            x2={x2}
            y2={y2}
            stroke={lightest}
            strokeWidth={1.5}
            opacity={0.6}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
          />
        )
      })}

      {/* Outer particle ring — 12 particles, 22s orbit */}
      <g style={{ transformOrigin: '100px 100px' }}>
        {particles.map((p, i) => (
          <circle
            key={`particle-${i}`}
            cx={100}
            cy={100}
            r={p.r}
            fill={lightest}
            opacity={0.7}
            style={{
              animation: `orbit 22s linear infinite`,
              animationDelay: `${-(i * 22) / 12}s`,
              transformOrigin: '100px 100px',
            }}
          />
        ))}
      </g>
    </svg>
  )
}
