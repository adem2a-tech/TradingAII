'use client'

import { useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import { SpotifyPricing } from '@/components/ui/spotify-pricing'
import { ToolCard3D } from '@/components/tools/tool-card-3d'
import { MarketSessionsPanel } from '@/components/tools/market-sessions-panel'
import { CATEGORY_LABELS, getInstrument, getInstrumentsByCategory } from '@/lib/assets'
import type { AssetCategory } from '@/lib/types'

type Props = {
  balance: string
  riskPercent: string
  instrument: string
}

export function ToolsPanel({ balance, riskPercent, instrument }: Props) {
  const defaultRisk = useMemo(() => {
    const bal = Number(balance) || 0
    const pct = Number(riskPercent) || 0
    if (bal <= 0 || pct <= 0) return ''
    return (bal * (pct / 100)).toFixed(2)
  }, [balance, riskPercent])

  const [localBalance, setLocalBalance] = useState(balance)
  const [riskEuros, setRiskEuros] = useState(defaultRisk)
  const [slPips, setSlPips] = useState('20')
  const [localInstrument, setLocalInstrument] = useState(instrument)

  const spec = getInstrument(localInstrument)
  const category = spec?.category ?? 'forex'

  const lotCalc = useMemo(() => {
    const riskAmount = Number(riskEuros) || 0
    const pips = Number(slPips) || 0
    if (!spec || riskAmount <= 0 || pips <= 0) return null
    const lot = riskAmount / (pips * spec.pipValuePerLot)
    const stepped = Math.floor(lot / spec.lotStep) * spec.lotStep
    return {
      riskAmount,
      lot: Math.max(spec.minLot, Math.min(spec.maxLot, stepped)),
      pipValue: spec.pipValuePerLot,
    }
  }, [riskEuros, slPips, spec])

  const onCategoryChange = (c: AssetCategory) => {
    const list = getInstrumentsByCategory(c)
    if (list[0]) setLocalInstrument(list[0].id)
  }

  return (
    <div className="tab-panel fade-in tools-panel">
      <div className="tools-grid tools-grid-v2">
        <ToolCard3D accent="amber" className="tools-lot-card">
          <h3><Calculator size={18} /> Calculateur de lot</h3>
          <p className="tools-card-sub">
            Indique combien tu veux risquer — on te suggère la taille de lot.
          </p>

          <div className="tools-lot-fields">
            <label className="tool-field-v2">
              <span>Balance (€)</span>
              <div className="input-box">
                <span>€</span>
                <input
                  inputMode="decimal"
                  value={localBalance}
                  onChange={(e) => setLocalBalance(e.target.value)}
                  placeholder="75"
                />
              </div>
            </label>
            <label className="tool-field-v2 highlight">
              <span>Je veux risquer par trade (€)</span>
              <div className="input-box">
                <span>€</span>
                <input
                  inputMode="decimal"
                  value={riskEuros}
                  onChange={(e) => setRiskEuros(e.target.value)}
                  placeholder="5"
                />
              </div>
            </label>
          </div>

          <label className="tool-field-v2">
            <span>Actif</span>
            <div className="pills wrap">
              {(Object.keys(CATEGORY_LABELS) as AssetCategory[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={category === c ? 'on' : ''}
                  onClick={() => onCategoryChange(c)}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
            <select value={localInstrument} onChange={(e) => setLocalInstrument(e.target.value)}>
              {getInstrumentsByCategory(category).map((i) => (
                <option key={i.id} value={i.id}>{i.label}</option>
              ))}
            </select>
          </label>

          <label className="tool-field-v2">
            <span>Stop loss (pips / points)</span>
            <input
              type="number"
              min={1}
              value={slPips}
              onChange={(e) => setSlPips(e.target.value)}
            />
          </label>

          {lotCalc ? (
            <div className="tools-lot-result">
              <div className="tools-lot-result-main">
                <span>Lot suggéré</span>
                <strong>{lotCalc.lot.toFixed(spec!.lotStep < 0.01 ? 3 : 2)}</strong>
              </div>
              <div className="tools-lot-result-meta">
                <div><span>Risque</span><strong>€{lotCalc.riskAmount.toFixed(2)}</strong></div>
                <div><span>SL</span><strong>{slPips} pips</strong></div>
                <div><span>Valeur pip</span><strong>€{lotCalc.pipValue}/lot</strong></div>
              </div>
              <p className="tools-lot-formula">
                Formule : Lot = Risque € ÷ (SL × Valeur pip) · {spec!.label}
              </p>
            </div>
          ) : (
            <p className="tools-lot-empty">Renseigne le montant à risquer et le stop loss.</p>
          )}
        </ToolCard3D>

        <MarketSessionsPanel />
      </div>
    </div>
  )
}

export function ProPanel({
  onSubscribe,
  onPromo,
  onPromoModal,
  isPro,
  isLifetime,
}: {
  onSubscribe: () => void
  onPromo: (code: string) => void
  onPromoModal?: () => void
  isPro?: boolean
  isLifetime?: boolean
}) {
  const [code, setCode] = useState('')

  return (
    <div className="tab-panel fade-in pro-pricing-tab">
      <SpotifyPricing
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
