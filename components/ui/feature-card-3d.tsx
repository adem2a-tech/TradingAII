'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'

type Accent = 'cyan' | 'violet' | 'emerald' | 'amber'

type Props = {
  icon: ReactNode
  title: string
  description: string
  accent?: Accent
}

export function FeatureCard3D({ icon, title, description, accent = 'cyan' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 240, damping: 26 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 240, damping: 26 })
  const glareX = useTransform(mx, [-0.5, 0.5], [18, 82])
  const glareY = useTransform(my, [-0.5, 0.5], [18, 82])
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,.18) 0%, transparent 55%)`

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
    <motion.article
      ref={ref}
      className={`feature-card-3d feature-card-3d--${accent}`}
      style={{ rotateX, rotateY }}
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
      <motion.div className="feature-card-3d-glare" aria-hidden style={{ background: glareBg }} />
      <div className="feature-card-3d-body">
        <div className="feature-card-3d-icon">{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="feature-card-3d-base" aria-hidden />
    </motion.article>
  )
}
