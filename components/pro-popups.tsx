'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Crown, X, Zap } from 'lucide-react'
import type { AccessStatus } from '@/lib/access/types'
import { PRO_PRICE_LABEL } from '@/lib/access/types'

type Props = {
  access: AccessStatus | null
  onSubscribe: () => void
  onPromo: () => void
}

const MESSAGES = [
  'Analyses illimitées avec Pro',
  'Plus de limite 3 jours — passe Pro',
  'Les traders Pro analysent sans limite',
  `Débloque tout pour ${PRO_PRICE_LABEL}`,
]

export function ProPopups({ access, onSubscribe, onPromo }: Props) {
  const path = usePathname()
  const [top, setTop] = useState(false)
  const [side, setSide] = useState(false)
  const [msg, setMsg] = useState(MESSAGES[0])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isFree = access && !access.isPro && !access.isLifetime
  const onAnalyze = path === '/analyze'

  const schedule = useCallback(() => {
    if (!isFree) return
    const delay = 25000 + Math.random() * 40000
    timer.current = setTimeout(() => {
      setMsg(MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
      if (onAnalyze) {
        setTop(false)
        setSide(true)
      } else {
        setTop(Math.random() > 0.4)
        setSide(Math.random() > 0.3)
      }
      setTimeout(() => { setTop(false); setSide(false) }, 8000)
      schedule()
    }, delay)
  }, [isFree, onAnalyze])

  useEffect(() => {
    if (isFree) {
      const t = setTimeout(() => { setSide(true); setTimeout(() => setSide(false), 8000) }, 8000)
      schedule()
      return () => { clearTimeout(t); if (timer.current) clearTimeout(timer.current) }
    }
    setTop(false); setSide(false)
  }, [isFree, schedule])

  if (!isFree) return null

  return (
    <>
      {top && (
        <div className="popup-neon top">
          <Zap size={16} />
          <span><strong>PRO {PRO_PRICE_LABEL}</strong> — analyses illimitées</span>
          <button type="button" onClick={onSubscribe}>Passer Pro</button>
          <button type="button" className="popup-x" onClick={() => setTop(false)}><X size={14} /></button>
        </div>
      )}
      {side && (
        <div className="popup-neon side">
          <Crown size={20} className="neon-icon" />
          <strong>{msg}</strong>
          <p>{PRO_PRICE_LABEL} · WhatsApp · code promo disponible</p>
          <button type="button" className="btn-primary sm" onClick={onSubscribe}>Passer Pro · WhatsApp →</button>
          <button type="button" className="link-sm" onClick={onPromo}>J&apos;ai un code promo</button>
          <button type="button" className="popup-x" onClick={() => setSide(false)}><X size={14} /></button>
        </div>
      )}
    </>
  )
}

export function LimitBlockModal({ access, onSubscribe, onClose }: { access: AccessStatus; onSubscribe: () => void; onClose: () => void }) {
  if (access.canAnalyze) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box limit-modal" onClick={(e) => e.stopPropagation()}>
        <Crown size={32} className="neon-icon" />
        <h2>Limite atteinte</h2>
        <p className="wait-msg">{access.waitMessage}</p>
        <p className="sub-text">Plan gratuit : 1 analyse tous les 3 jours.</p>
        <button type="button" className="btn-primary" onClick={onSubscribe}>Passer Pro · WhatsApp →</button>
        <button type="button" className="btn-ghost-sm" onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}
