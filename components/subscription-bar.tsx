'use client'

import { useState } from 'react'
import { Crown, Ticket } from 'lucide-react'
import type { AccessStatus } from '@/lib/access/types'
import { PRO_PRICE, PRO_PRICE_LABEL } from '@/lib/access/types'

type Props = {
  status: AccessStatus | null
  onPromo: (code: string) => Promise<void>
  onSubscribe: () => Promise<void>
  loading?: boolean
}

export function SubscriptionBar({ status, onPromo, onSubscribe, loading }: Props) {
  const [code, setCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)

  if (!status || status.isLifetime || status.isPro) return null

  const handlePromo = async () => {
    if (!code.trim()) return
    setPromoLoading(true)
    try { await onPromo(code.trim()) } finally { setPromoLoading(false) }
  }

  return (
    <div className="sub-bar">
      <div className="sub-info">
        <Crown size={16} />
        <span>
          {status.canAnalyze
            ? 'Plan gratuit · 1 analyse / 3 jours'
            : status.waitMessage || `Limite · prochaine analyse ${status.nextAnalysisAt ? new Date(status.nextAnalysisAt).toLocaleString('fr-FR') : ''}`}
        </span>
      </div>
      <div className="sub-actions">
        <div className="promo-row">
          <Ticket size={14} />
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Code promo" />
          <button type="button" onClick={handlePromo} disabled={promoLoading}>{promoLoading ? '...' : 'OK'}</button>
        </div>
        <button type="button" className="btn-sub" onClick={onSubscribe} disabled={loading}>
          Pro {PRO_PRICE_LABEL}
        </button>
      </div>
    </div>
  )
}

export function WelcomeModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Bienvenue 🎉</h2>
        <p>{message}</p>
        <button type="button" className="btn-primary" onClick={onClose}>C&apos;est parti →</button>
      </div>
    </div>
  )
}

export function PlanBadge({ status }: { status: AccessStatus | null }) {
  if (!status) return null
  if (status.isLifetime) return <span className="plan-badge lifetime">À vie</span>
  if (status.isPro) return <span className="plan-badge pro">Pro</span>
  return <span className="plan-badge free">Gratuit</span>
}
