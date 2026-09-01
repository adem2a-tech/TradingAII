'use client'

import { useCallback, useState } from 'react'
import { Link2, Loader2, Newspaper } from 'lucide-react'
import type { TradingViewContext } from '@/lib/types'
import { getInstrument } from '@/lib/assets'
import { isTradingViewUrl } from '@/lib/tradingview/parse-url'

type Props = {
  value: string
  onChange: (url: string) => void
  context: TradingViewContext | null
  onContext: (ctx: TradingViewContext | null) => void
  onInstrumentDetected?: (instrumentId: string, category: string) => void
}

export function TradingViewLinkInput({
  value,
  onChange,
  context,
  onContext,
  onInstrumentDetected,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const fetchContext = useCallback(async (url: string) => {
    if (!isTradingViewUrl(url)) {
      onContext(null)
      return
    }
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/tradingview/context?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lien TradingView invalide')
      onContext(data as TradingViewContext)
      if (data.instrumentId && onInstrumentDetected) {
        const spec = getInstrument(data.instrumentId)
        if (spec) onInstrumentDetected(spec.id, spec.category)
      }
    } catch (e) {
      onContext(null)
      setErr(e instanceof Error ? e.message : 'Erreur TradingView')
    } finally {
      setLoading(false)
    }
  }, [onContext, onInstrumentDetected])

  const handleChange = (raw: string) => {
    onChange(raw)
    setErr(null)
    if (!raw.trim()) {
      onContext(null)
      return
    }
    if (isTradingViewUrl(raw)) {
      void fetchContext(raw.trim())
    } else {
      onContext(null)
    }
  }

  return (
    <div className="tv-link-block">
      <label className="tv-link-label">
        <Link2 size={14} /> Lien TradingView partagé <span className="hint">(optionnel)</span>
      </label>
      <input
        type="url"
        className="tv-link-input"
        placeholder="https://fr.tradingview.com/chart/...?symbol=OANDA:XAUUSD"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
      />
      {loading && (
        <p className="tv-link-status"><Loader2 size={14} className="spin" /> Lecture des annonces TradingView…</p>
      )}
      {err && <p className="field-error">{err}</p>}
      {context && !loading && (
        <div className="tv-link-preview">
          <div className="tv-link-preview-head">
            <Newspaper size={14} />
            <strong>{context.instrumentLabel}</strong>
            <span className="hint">· {context.tvSymbol}</span>
            {context.hasHighImpactNews && <span className="tv-impact-badge">Annonces macro</span>}
          </div>
          {context.news.length > 0 ? (
            <ul className="tv-news-list">
              {context.news.slice(0, 4).map((n) => (
                <li key={n.id}>{n.title}</li>
              ))}
            </ul>
          ) : (
            <p className="tv-link-empty">Aucune annonce récente — l&apos;IA utilisera le symbole du lien.</p>
          )}
        </div>
      )}
    </div>
  )
}
