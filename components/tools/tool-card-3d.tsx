'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'

type Accent = 'cyan' | 'emerald' | 'violet' | 'amber'

type Props = {
  children: ReactNode
  className?: string
  accent?: Accent
}

export function ToolCard3D({ children, className = '', accent = 'cyan' }: Props) {
  const ref = useRef<HTMLElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 220, damping: 24 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 220, damping: 24 })
  const glareX = useTransform(mx, [-0.5, 0.5], [15, 85])
  const glareY = useTransform(my, [-0.5, 0.5], [15, 85])
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,.14) 0%, transparent 58%)`

  const point = (clientX: number, clientY: number) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    mx.set((clientX - r.left) / r.width - 0.5)
    my.set((clientY - r.top) / r.height - 0.5)
  }

  const reset = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.section
      ref={ref}
      className={`tool-card-3d tool-card-3d--${accent}${className ? ` ${className}` : ''}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={(e) => point(e.clientX, e.clientY)}
      onMouseLeave={reset}
      onTouchStart={(e) => {
        const t = e.touches[0]
        if (t) point(t.clientX, t.clientY)
      }}
      onTouchMove={(e) => {
        const t = e.touches[0]
        if (t) point(t.clientX, t.clientY)
      }}
      onTouchEnd={reset}
    >
      <motion.div className="tool-card-3d-glare" aria-hidden style={{ background: glareBg }} />
      <div className="tool-card-3d-inner">{children}</div>
      <div className="tool-card-3d-shadow" aria-hidden />
    </motion.section>
  )
}
