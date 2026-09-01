'use client'

import { useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DottedMap from 'dotted-map'
import Image from 'next/image'
import { useTheme } from 'next-themes'

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string }
    end: { lat: number; lng: number; label?: string }
  }>
  lineColor?: string
  showLabels?: boolean
  animationDuration?: number
  loop?: boolean
  className?: string
}

export function WorldMap({
  dots = [],
  lineColor = '#22d3ee',
  showLabels = true,
  animationDuration = 2,
  loop = true,
  className = '',
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  const map = useMemo(() => new DottedMap({ height: 100, grid: 'diagonal' }), [])

  const svgMap = useMemo(
    () => map.getSVG({
      radius: 0.22,
      color: isDark ? '#22d3ee35' : '#00000040',
      shape: 'circle',
      backgroundColor: 'transparent',
    }),
    [map, isDark],
  )

  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360)
    const y = (90 - lat) * (400 / 180)
    return { x, y }
  }

  const createCurvedPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const midX = (start.x + end.x) / 2
    const midY = Math.min(start.y, end.y) - 50
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`
  }

  const staggerDelay = 0.3
  const totalAnimationTime = dots.length * staggerDelay + animationDuration
  const pauseTime = 2
  const fullCycleDuration = totalAnimationTime + pauseTime

  return (
    <div className={`world-map-root ${className}`}>
      <Image
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="world-map-dots"
        alt=""
        height={495}
        width={1056}
        draggable={false}
        priority
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="world-map-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feMorphology operator="dilate" radius="0.5" />
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng)
          const endPoint = projectPoint(dot.end.lat, dot.end.lng)
          const startTime = (i * staggerDelay) / fullCycleDuration
          const endTime = (i * staggerDelay + animationDuration) / fullCycleDuration
          const resetTime = totalAnimationTime / fullCycleDuration

          return (
            <g key={`path-${i}`}>
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={loop ? { pathLength: [0, 0, 1, 1, 0] } : { pathLength: 1 }}
                transition={loop ? {
                  duration: fullCycleDuration,
                  times: [0, startTime, endTime, resetTime, 1],
                  ease: 'easeInOut',
                  repeat: Infinity,
                } : {
                  duration: animationDuration,
                  delay: i * staggerDelay,
                  ease: 'easeInOut',
                }}
              />
            </g>
          )
        })}

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng)
          const endPoint = projectPoint(dot.end.lat, dot.end.lng)

          return (
            <g key={`points-${i}`}>
              {[startPoint, endPoint].map((pt, j) => {
                const label = j === 0 ? dot.start.label : dot.end.label
                const loc = label || `Hub ${i}-${j}`
                return (
                  <g key={`${i}-${j}`}>
                    <motion.g
                      onHoverStart={() => setHoveredLocation(loc)}
                      onHoverEnd={() => setHoveredLocation(null)}
                      className="cursor-pointer"
                      whileHover={{ scale: 1.2 }}
                    >
                      <circle cx={pt.x} cy={pt.y} r="3" fill={lineColor} filter="url(#glow)" />
                      <circle cx={pt.x} cy={pt.y} r="3" fill={lineColor} opacity="0.5">
                        <animate attributeName="r" from="3" to="12" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    </motion.g>
                    {showLabels && label && (
                      <foreignObject x={pt.x - 55} y={pt.y - 38} width="110" height="28">
                        <div className="map-label-pill">{label}</div>
                      </foreignObject>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>

      <AnimatePresence>
        {hoveredLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="map-tooltip-mobile"
          >
            {hoveredLocation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const TRADING_SESSION_DOTS = [
  { start: { lat: 51.5074, lng: -0.1278, label: 'London' }, end: { lat: 40.7128, lng: -74.006, label: 'New York' } },
  { start: { lat: 40.7128, lng: -74.006, label: 'New York' }, end: { lat: 35.6762, lng: 139.6503, label: 'Tokyo' } },
  { start: { lat: 35.6762, lng: 139.6503, label: 'Tokyo' }, end: { lat: -33.8688, lng: 151.2093, label: 'Sydney' } },
  { start: { lat: 48.8566, lng: 2.3522, label: 'Paris' }, end: { lat: 51.5074, lng: -0.1278, label: 'London' } },
  { start: { lat: 25.2048, lng: 55.2708, label: 'Dubai' }, end: { lat: 48.8566, lng: 2.3522, label: 'Paris' } },
  { start: { lat: 51.5074, lng: -0.1278, label: 'London' }, end: { lat: 1.3521, lng: 103.8198, label: 'Singapore' } },
  { start: { lat: 40.7128, lng: -74.006, label: 'New York' }, end: { lat: -23.5505, lng: -46.6333, label: 'São Paulo' } },
]
