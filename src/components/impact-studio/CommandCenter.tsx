'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { X } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface MetricData {
  name: string
  value: string
  target: string
}

interface ProgramData {
  id: string
  name: string
  metrics: MetricData[]
}

interface CommandCenterProps {
  programs: ProgramData[]
  orgName: string
  logoUrl: string | null
  customCenterText?: string
  brandPrimary?: string
}

type Tier = 'agency' | 'program' | 'metric'

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getStatusColor(value: string, target: string): string {
  const v = parseFloat(value.replace(/[^0-9.-]/g, ''))
  const t = parseFloat(target.replace(/[^0-9.-]/g, ''))
  if (isNaN(v) || isNaN(t) || t === 0) return '#3A6B8A' // cerulean fallback
  const ratio = v / t
  if (ratio >= 0.9) return '#1D9E75'  // teal — on track
  if (ratio >= 0.6) return '#BA7517'  // amber — watch
  return '#D85A30'                     // coral — at risk
}

function getTopMetricValue(program: ProgramData): string {
  if (program.metrics.length === 0) return '—'
  return program.metrics[0].value
}

/* Sparkline: 5-quarter inline SVG bars */
function Sparkline({
  value,
  target,
  brandPrimary,
}: {
  value: string
  target: string
  brandPrimary: string
}) {
  const v = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
  const t = parseFloat(target.replace(/[^0-9.-]/g, '')) || 1
  // Simulate 5 quarters trending toward current ratio
  const ratio = Math.min(v / t, 1.3)
  const quarters = [
    ratio * 0.5,
    ratio * 0.65,
    ratio * 0.78,
    ratio * 0.9,
    ratio,
  ]
  const maxH = 28
  return (
    <svg width={60} height={maxH + 4} viewBox={`0 0 60 ${maxH + 4}`}>
      {quarters.map((q, i) => {
        const h = Math.max(3, q * maxH)
        return (
          <rect
            key={i}
            x={i * 12 + 1}
            y={maxH + 2 - h}
            width={8}
            height={h}
            rx={2}
            fill={q >= 0.9 ? '#1D9E75' : q >= 0.6 ? '#BA7517' : brandPrimary}
            opacity={0.85}
          />
        )
      })}
      {/* Target line */}
      <line
        x1={0}
        y1={maxH + 2 - maxH * 0.9}
        x2={60}
        y2={maxH + 2 - maxH * 0.9}
        stroke="#EDE8DE"
        strokeWidth={0.5}
        opacity={0.4}
        strokeDasharray="3 2"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function CommandCenter({
  programs,
  orgName,
  logoUrl,
  customCenterText,
  brandPrimary = '#E9C03A',
}: CommandCenterProps) {
  const [tier, setTier] = useState<Tier>('agency')
  const [selectedProgram, setSelectedProgram] = useState<ProgramData | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null)
  const [animating, setAnimating] = useState(false)
  const [bobPaused, setBobPaused] = useState(false)

  /* ---- navigation ---- */
  const goToProgram = useCallback(
    (program: ProgramData) => {
      if (animating) return
      setAnimating(true)
      setBobPaused(true)
      setTimeout(() => {
        setSelectedProgram(program)
        setSelectedMetric(null)
        setTier('program')
        setAnimating(false)
      }, 600)
    },
    [animating]
  )

  const goToMetric = useCallback(
    (metric: MetricData) => {
      if (animating) return
      setBobPaused(true)
      setSelectedMetric(metric)
      setTier('metric')
    },
    [animating]
  )

  const goToAgency = useCallback(() => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setSelectedProgram(null)
      setSelectedMetric(null)
      setTier('agency')
      setBobPaused(false)
      setAnimating(false)
    }, 400)
  }, [animating])

  const closeMetric = useCallback(() => {
    setSelectedMetric(null)
    setTier('program')
    setBobPaused(false)
  }, [])

  /* ---- nodes to display ---- */
  const orbitNodes = useMemo(() => {
    if (tier === 'agency' || (tier === 'metric' && selectedProgram)) {
      if (tier === 'agency') return programs
      // program tier or metric tier — show metrics of selected program
      return selectedProgram?.metrics.slice(0, 5) ?? []
    }
    return selectedProgram?.metrics.slice(0, 5) ?? []
  }, [tier, programs, selectedProgram])

  const nodeCount = tier === 'agency' ? programs.length : (selectedProgram?.metrics.length ?? 0)
  const radius = 160 // orbit radius in SVG units

  /* ---- center element ---- */
  const centerLabel = useMemo(() => {
    if (customCenterText) return customCenterText
    return getInitials(orgName)
  }, [customCenterText, orgName])

  /* ---- top-line impact number ---- */
  const topLineNumber = useMemo(() => {
    if (tier !== 'agency') return null
    // Sum first metric across all programs
    let total = 0
    programs.forEach((p) => {
      if (p.metrics.length > 0) {
        const n = parseFloat(p.metrics[0].value.replace(/[^0-9.-]/g, ''))
        if (!isNaN(n)) total += n
      }
    })
    return total > 0 ? total.toLocaleString() : null
  }, [tier, programs])

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        background: '#1B2B3A',
        minHeight: 520,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ---- CSS Keyframes ---- */}
      <style>{`
        @keyframes cc-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes cc-zoom-in {
          from { transform: scale(1); opacity: 1; }
          to   { transform: scale(2.5); opacity: 0; }
        }
        @keyframes cc-fade-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes cc-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes cc-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ---- SVG Canvas ---- */}
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full"
        style={{
          minHeight: 480,
          transition: 'opacity 0.6s ease-in-out',
          opacity: animating ? 0.3 : 1,
        }}
      >
        {/* Subtle grid pattern */}
        <defs>
          <radialGradient id="cc-bg-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#243847" />
            <stop offset="100%" stopColor="#1B2B3A" />
          </radialGradient>
        </defs>
        <rect width="500" height="500" fill="url(#cc-bg-grad)" />

        {/* Orbit ring */}
        <circle
          cx={250}
          cy={250}
          r={radius}
          fill="none"
          stroke="#EDE8DE"
          strokeWidth={0.5}
          opacity={0.12}
        />

        {/* Orbit nodes */}
        {tier === 'agency' &&
          programs.map((program, i) => {
            const angle = (i * 360) / programs.length - 90
            const rad = (angle * Math.PI) / 180
            const nx = 250 + radius * Math.cos(rad)
            const ny = 250 + radius * Math.sin(rad)
            const statusColor = getStatusColor(
              program.metrics[0]?.value ?? '0',
              program.metrics[0]?.target ?? '1'
            )
            return (
              <g
                key={program.id}
                onClick={() => goToProgram(program)}
                style={{ cursor: 'pointer' }}
              >
                {/* Status ring */}
                <circle
                  cx={nx}
                  cy={ny}
                  r={32}
                  fill="#0f1c27"
                  stroke={statusColor}
                  strokeWidth={3}
                />
                {/* Program name */}
                <text
                  x={nx}
                  y={ny - 6}
                  textAnchor="middle"
                  fill="#EDE8DE"
                  fontSize={9}
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
                >
                  {program.name.length > 12
                    ? program.name.substring(0, 11) + '…'
                    : program.name}
                </text>
                {/* Top-line metric */}
                <text
                  x={nx}
                  y={ny + 10}
                  textAnchor="middle"
                  fill={brandPrimary}
                  fontSize={12}
                  fontWeight="bold"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
                >
                  {getTopMetricValue(program)}
                </text>
              </g>
            )
          })}

        {/* Tier 2: metric nodes for selected program */}
        {(tier === 'program' || tier === 'metric') &&
          selectedProgram &&
          selectedProgram.metrics.slice(0, 5).map((metric, i) => {
            const count = Math.min(selectedProgram.metrics.length, 5)
            const angle = (i * 360) / count - 90
            const rad = (angle * Math.PI) / 180
            const nx = 250 + radius * Math.cos(rad)
            const ny = 250 + radius * Math.sin(rad)
            const statusColor = getStatusColor(metric.value, metric.target)
            const isSelected = tier === 'metric' && selectedMetric?.name === metric.name
            const dimmed = tier === 'metric' && !isSelected

            return (
              <g
                key={`metric-${i}`}
                onClick={() => goToMetric(metric)}
                style={{
                  cursor: 'pointer',
                  opacity: dimmed ? 0.3 : 1,
                  transition: 'opacity 0.4s ease',
                }}
              >
                <circle
                  cx={nx}
                  cy={ny}
                  r={28}
                  fill="#0f1c27"
                  stroke={statusColor}
                  strokeWidth={3}
                />
                <text
                  x={nx}
                  y={ny - 4}
                  textAnchor="middle"
                  fill="#EDE8DE"
                  fontSize={8}
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
                >
                  {metric.name.length > 14
                    ? metric.name.substring(0, 13) + '…'
                    : metric.name}
                </text>
                <text
                  x={nx}
                  y={ny + 10}
                  textAnchor="middle"
                  fill={brandPrimary}
                  fontSize={11}
                  fontWeight="bold"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
                >
                  {metric.value}
                </text>
              </g>
            )
          })}

        {/* ---- Center Element (Steps 16 + 17) ---- */}
        <g
          onClick={tier !== 'agency' ? goToAgency : undefined}
          style={{
            cursor: tier !== 'agency' ? 'pointer' : 'default',
            animation: 'cc-bob 3s ease-in-out infinite',
            animationPlayState: bobPaused ? 'paused' : 'running',
          }}
        >
          {/* Outer glow */}
          <circle cx={250} cy={250} r={52} fill={brandPrimary} opacity={0.08} />

          {/* Center circle */}
          <circle
            cx={250}
            cy={250}
            r={44}
            fill="#0f1c27"
            stroke={brandPrimary}
            strokeWidth={2.5}
          />

          {logoUrl ? (
            /* Step 17: logo image */
            <image
              href={logoUrl}
              x={218}
              y={218}
              width={64}
              height={64}
              clipPath="circle(30px at 32px 32px)"
            />
          ) : (
            /* Step 17: custom text or initials fallback */
            <text
              x={250}
              y={topLineNumber ? 248 : 254}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#EDE8DE"
              fontSize={customCenterText ? 14 : 22}
              fontWeight="bold"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
              }}
            >
              {centerLabel}
            </text>
          )}

          {/* Step 17: top-line impact number beneath center */}
          {topLineNumber && (
            <text
              x={250}
              y={270}
              textAnchor="middle"
              fill={brandPrimary}
              fontSize={10}
              opacity={0.8}
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              {topLineNumber} total
            </text>
          )}

          {/* Tier 2+: show program name under center */}
          {selectedProgram && tier !== 'agency' && (
            <text
              x={250}
              y={308}
              textAnchor="middle"
              fill="#EDE8DE"
              fontSize={10}
              opacity={0.6}
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              {selectedProgram.name}
            </text>
          )}
        </g>
      </svg>

      {/* ---- Tier 3: Metric Detail Card (HTML overlay) ---- */}
      {tier === 'metric' && selectedMetric && selectedProgram && (
        <div
          className="absolute top-4 right-4 bottom-4 w-80 rounded-xl p-5 shadow-2xl"
          style={{
            background: '#0f1c27',
            border: `1px solid ${brandPrimary}33`,
            animation: 'cc-slide-in 0.4s ease-out forwards',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            overflowY: 'auto',
          }}
        >
          {/* Close button */}
          <button
            onClick={closeMetric}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close detail"
          >
            <X size={16} color="#EDE8DE" />
          </button>

          {/* Metric name */}
          <h3
            className="text-lg font-bold mb-4"
            style={{
              color: '#EDE8DE',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}
          >
            {selectedMetric.name}
          </h3>

          {/* Current vs Target */}
          <div className="flex items-center gap-3 mb-4">
            <div>
              <div className="text-xs" style={{ color: '#EDE8DE', opacity: 0.5 }}>
                Current
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: brandPrimary }}
              >
                {selectedMetric.value}
              </div>
            </div>
            <div
              className="text-lg"
              style={{ color: '#EDE8DE', opacity: 0.3 }}
            >
              /
            </div>
            <div>
              <div className="text-xs" style={{ color: '#EDE8DE', opacity: 0.5 }}>
                Target
              </div>
              <div className="text-2xl font-bold" style={{ color: '#EDE8DE' }}>
                {selectedMetric.target}
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div className="mb-4">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor:
                  getStatusColor(selectedMetric.value, selectedMetric.target) + '22',
                color: getStatusColor(selectedMetric.value, selectedMetric.target),
                border: `1px solid ${getStatusColor(selectedMetric.value, selectedMetric.target)}44`,
              }}
            >
              {(() => {
                const v = parseFloat(selectedMetric.value.replace(/[^0-9.-]/g, ''))
                const t = parseFloat(selectedMetric.target.replace(/[^0-9.-]/g, ''))
                if (isNaN(v) || isNaN(t) || t === 0) return 'No Data'
                const ratio = v / t
                if (ratio >= 0.9) return 'On Track'
                if (ratio >= 0.6) return 'Watch'
                return 'At Risk'
              })()}
            </span>
          </div>

          {/* 5-quarter sparkline */}
          <div className="mb-4">
            <div
              className="text-xs mb-1"
              style={{ color: '#EDE8DE', opacity: 0.5 }}
            >
              5-Quarter Trend
            </div>
            <Sparkline
              value={selectedMetric.value}
              target={selectedMetric.target}
              brandPrimary={brandPrimary}
            />
          </div>

          {/* 4-metric breakdown (from program metrics) */}
          <div className="mb-4">
            <div
              className="text-xs mb-2"
              style={{ color: '#EDE8DE', opacity: 0.5 }}
            >
              Related Metrics
            </div>
            <div className="grid grid-cols-2 gap-2">
              {selectedProgram.metrics
                .filter((m) => m.name !== selectedMetric.name)
                .slice(0, 4)
                .map((m, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-2"
                    style={{ background: '#1B2B3A' }}
                  >
                    <div
                      className="text-xs truncate"
                      style={{ color: '#EDE8DE', opacity: 0.6 }}
                    >
                      {m.name}
                    </div>
                    <div
                      className="text-sm font-bold"
                      style={{ color: brandPrimary }}
                    >
                      {m.value}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* AI talking point */}
          <div
            className="rounded-lg p-3"
            style={{
              background: `${brandPrimary}11`,
              border: `1px solid ${brandPrimary}22`,
            }}
          >
            <div
              className="text-xs mb-1 font-semibold"
              style={{ color: brandPrimary }}
            >
              AI Talking Point
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#EDE8DE' }}>
              {`${selectedMetric.name} is at ${selectedMetric.value} against a target of ${selectedMetric.target}. `}
              {(() => {
                const v = parseFloat(selectedMetric.value.replace(/[^0-9.-]/g, ''))
                const t = parseFloat(selectedMetric.target.replace(/[^0-9.-]/g, ''))
                if (isNaN(v) || isNaN(t) || t === 0)
                  return 'Data is pending collection for this metric.'
                const pct = Math.round((v / t) * 100)
                if (pct >= 90)
                  return `At ${pct}% of target, this metric is performing well and can be highlighted in funder reports.`
                if (pct >= 60)
                  return `At ${pct}% of target, this metric needs attention. Consider reviewing program delivery strategies.`
                return `At ${pct}% of target, this metric requires immediate action. Recommend discussing with program leadership.`
              })()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
