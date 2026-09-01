'use client'

import { useMemo, useState } from 'react'
import { Calculator, CheckSquare, Clock, Globe } from 'lucide-react'
import { SpotifyPricing } from '@/components/ui/spotify-pricing'
import { getInstrument } from '@/lib/assets'

type Props = {
  balance: string
  riskPercent: string
  instrument: string
}

const CHECKLIST = [
  'Trend confirmé sur timeframe supérieur',
  'Risk/Reward minimum 1:2',
  'Stop loss placé avant entrée',
  'Taille de lot ≤ 1–2% du capital',
  'Pas de news majeure dans 30 min',
  'Setup aligné avec le plan du jour',
]

function sessionStatus(name: string, openH: number, closeH: number) {
  const now = new Date()
  const h = now.getUTCHours()
  const open = h >= openH && h < closeH
  return { name, open, hours: `${openH}h–${closeH}h UTC` }
}

export function ToolsPanel({ balance, riskPercent, instrument }: Props) {
  const [slPips, setSlPips] = useState('20')
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  const spec = getInstrument(instrument)
  const lotCalc = useMemo(() => {
    const bal = Number(balance) || 0
    const risk = Number(riskPercent) || 0
    const pips = Number(slPips) || 0
    if (!spec || bal <= 0 || risk <= 0 || pips <= 0) return null
    const riskAmount = bal * (risk / 100)
    const pipValue = spec.pipValuePerLot
    const lot = riskAmount / (pips * pipValue)
    const stepped = Math.floor(lot / spec.lotStep) * spec.lotStep
    return {
      riskAmount,
      lot: Math.max(spec.minLot, Math.min(spec.maxLot, stepped)),
    }
  }, [balance, riskPercent, slPips, spec])

  const sessions = [
    sessionStatus('Londres', 8, 17),
    sessionStatus('New York', 13, 22),
    sessionStatus('Tokyo', 0, 9),
  ]

  const doneCount = Object.values(checked).filter(Boolean).length

  return (
    <div className="tab-panel fade-in tools-panel">
      <div className="tools-grid">
        <section className="tool-card neon-card">
          <h3><Calculator size={18} /> Calculateur de lot</h3>
          <p className="tool-desc">Basé sur {spec?.label ?? instrument} · risque {riskPercent}% · balance €{balance}</p>
          <label className="tool-field">
            Stop loss (pips)
            <input type="number" value={slPips} onChange={(e) => setSlPips(e.target.value)} min={1} />
          </label>
          {lotCalc ? (
            <div className="tool-result">
              <div><span>Risque €</span><strong>{lotCalc.riskAmount.toFixed(2)}</strong></div>
              <div><span>Lot suggéré</span><strong className="accent">{lotCalc.lot.toFixed(2)}</strong></div>
            </div>
          ) : (
            <p className="muted">Renseigne balance, risque et pips SL.</p>
          )}
        </section>

        <section className="tool-card neon-card">
          <h3><Globe size={18} /> Sessions marché</h3>
          <div className="session-list">
            {sessions.map((s) => (
              <div key={s.name} className={`session-row ${s.open ? 'open' : ''}`}>
                <Clock size={14} />
                <span>{s.name}</span>
                <span className="muted">{s.hours}</span>
                <span className={`session-badge ${s.open ? 'on' : ''}`}>{s.open ? 'Ouvert' : 'Fermé'}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="tool-card neon-card full">
          <h3><CheckSquare size={18} /> Checklist pré-trade · {doneCount}/{CHECKLIST.length}</h3>
          <ul className="checklist">
            {CHECKLIST.map((item, i) => (
              <li key={item}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!checked[i]}
                    onChange={() => setChecked((p) => ({ ...p, [i]: !p[i] }))}
                  />
                  <span className={checked[i] ? 'done' : ''}>{item}</span>
                </label>
              </li>
            ))}
          </ul>
          {doneCount === CHECKLIST.length && (
            <p className="checklist-ok">Setup validé — tu peux analyser ton graphique ✓</p>
          )}
        </section>
      </div>
    </div>
  )
}

export function ProPanel({
  onSubscribe,
  onPromo,
  onPromoModal,
  loading,
  isPro,
  isLifetime,
}: {
  onSubscribe: () => void
  onPromo: (code: string) => void
  onPromoModal?: () => void
  loading?: boolean
  isPro?: boolean
  isLifetime?: boolean
}) {
  const [code, setCode] = useState('')

  return (
    <div className="tab-panel fade-in pro-pricing-tab">
      <SpotifyPricing
        loading={loading}
        isProActive={isPro}
        isLifetime={isLifetime}
        onSubscribe={onSubscribe}
        onPromo={onPromoModal}
        onPromoSubmit={onPromo}
        promoCode={code}
        onPromoCodeChange={setCode}
      />
    </div>
  )
}
