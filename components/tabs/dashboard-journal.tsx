'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownRight, ArrowUpRight, ChevronRight, Minus, TrendingUp,
} from 'lucide-react'
import { CATEGORY_LABELS, getInstrument } from '@/lib/assets'
import type { AnalysisRecord } from '@/lib/types'

export function DashboardPanel() {
  const [items, setItems] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/history', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  const total = items.length
  const buys = items.filter((i) => i.ai.signal === 'BUY').length
  const sells = items.filter((i) => i.ai.signal === 'SELL').length
  const trades = items.filter((i) => i.ai.signal === 'BUY' || i.ai.signal === 'SELL')
  const avgConf = trades.length
    ? Math.round(trades.reduce((s, i) => s + i.ai.confidence, 0) / trades.length)
    : 0
  const last = items[0]

  if (loading) return <div className="tab-panel"><p className="muted">Chargement stats...</p></div>

  return (
    <div className="tab-panel fade-in">
      <div className="stats-grid">
        <div className="stat-card neon-card">
          <span className="stat-label">Analyses totales</span>
          <strong className="stat-value">{total}</strong>
        </div>
        <div className="stat-card neon-card">
          <span className="stat-label">Signaux BUY</span>
          <strong className="stat-value up">{buys}</strong>
        </div>
        <div className="stat-card neon-card">
          <span className="stat-label">Signaux SELL</span>
          <strong className="stat-value down">{sells}</strong>
        </div>
        <div className="stat-card neon-card">
          <span className="stat-label">Confiance moy.</span>
          <strong className="stat-value">{avgConf}%</strong>
        </div>
      </div>

      {last ? (
        <section className="dash-section neon-card">
          <h3><TrendingUp size={18} /> Dernière analyse</h3>
          <div className="dash-last">
            <span className={`signal-pill ${last.ai.signal.toLowerCase()}`}>{last.ai.signal}</span>
            <span>{getInstrument(last.instrument)?.label ?? last.instrument} · {last.timeframe}</span>
            <span>{last.ai.confidence}% confiance</span>
            <span className="muted">{new Date(last.createdAt).toLocaleString('fr-FR')}</span>
          </div>
        </section>
      ) : (
        <section className="dash-section neon-card empty-inline">
          <p>Aucune analyse encore. Lance ta première dans l&apos;onglet Analyser.</p>
        </section>
      )}
    </div>
  )
}

export function JournalPanel() {
  const [items, setItems] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/history', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

  if (loading) return <div className="tab-panel"><p className="muted">Chargement journal...</p></div>

  return (
    <div className="tab-panel fade-in">
      <div className="tab-panel-head">
        <h2>Journal de trading</h2>
        <Link href="/history" className="btn-ghost-sm">Voir tout →</Link>
      </div>
      {items.length === 0 ? (
        <div className="empty-inline neon-card"><p>Ton journal se remplit après chaque analyse.</p></div>
      ) : (
        <div className="history compact">
          {items.slice(0, 8).map((item) => {
            const spec = getInstrument(item.instrument)
            const trade = item.ai.signal === 'BUY' || item.ai.signal === 'SELL'
            return (
              <div key={item.id} className="history-item static">
                <div className={`hist-icon ${item.ai.signal.toLowerCase()}`}>
                  {!trade ? <Minus size={18} /> : item.ai.signal === 'BUY' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <div className="hist-info">
                  <strong>{spec?.label ?? item.instrument}</strong>
                  <span>{CATEGORY_LABELS[item.assetCategory]} · {item.timeframe} · {fmt(item.createdAt)}</span>
                </div>
                <div className="hist-conf">{item.ai.confidence}%</div>
                <ChevronRight size={16} className="muted" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
