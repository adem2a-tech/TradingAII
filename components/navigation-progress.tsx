'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    setActive(true)
    setWidth(15)
    const steps = [
      setTimeout(() => setWidth(45), 80),
      setTimeout(() => setWidth(72), 180),
      setTimeout(() => setWidth(92), 320),
      setTimeout(() => {
        setWidth(100)
        setTimeout(() => {
          setActive(false)
          setWidth(0)
        }, 280)
      }, 480),
    ]
    return () => steps.forEach(clearTimeout)
  }, [pathname])

  if (!active && width === 0) return null

  return (
    <div className="nav-progress-track" aria-hidden>
      <div className="nav-progress-bar" style={{ width: `${width}%` }} />
    </div>
  )
}
