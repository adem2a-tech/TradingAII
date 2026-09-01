'use client'

import { useEffect, useState } from 'react'

const BASE = 491
const MIN = 468
const MAX = 524

export function LiveVisitorsBadge({ className = '' }: { className?: string }) {
  const [count, setCount] = useState(BASE)

  useEffect(() => {
    const tick = () => {
      setCount((c) => {
        const dir = Math.random() > 0.42 ? 1 : -1
        const step = Math.floor(Math.random() * 3) + 1
        return Math.max(MIN, Math.min(MAX, c + dir * step))
      })
    }
    const schedule = () => {
      const delay = 2500 + Math.random() * 3500
      return setTimeout(() => {
        tick()
        timer = schedule()
      }, delay)
    }
    let timer = schedule()
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`badge live-visitors-badge ${className}`.trim()}>
      <span className="dot dot-live" aria-hidden />
      <span>
        <strong>{count.toLocaleString('fr-FR')}</strong> visiteurs connectés
      </span>
    </div>
  )
}
