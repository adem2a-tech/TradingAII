'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus, RefreshCw } from 'lucide-react'
import { Header } from '@/components/header'
import { ResultCard } from '@/components/result-card'
import { useSync } from '@/components/sync-indicator'
import { useToast } from '@/components/toast'
import { CATEGORY_LABELS, getInstrument } from '@/lib/assets'
import type { AnalysisRecord } from '@/lib/types'

function HistorySkeleton() {
  return (
    <div className="history skeleton-list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="history-item skeleton-row">
          <div className="skeleton-circle" />
          <div className="skeleton-block" style={{ flex: 1 }} />
          <div className="skeleton-block sm" />
        </div>
      ))}
    </div>
  )
}

export default function HistoryPage() {
  const { toast } = useToast()
  const { sync } = useSync()
  const [items, setItems] = useState<AnalysisRecord[]>([])
  const [selected, setSelected] = useState<AnalysisRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const r = await fetch('/api/history', { cache: 'no-store' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Erreur')
      setItems(data as AnalysisRecord[])
      if (silent) toast('Historique synchronisé ✓')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const onFocus = () => { load(true) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  const refresh = async () => {
    await sync('history')
    await load(true)
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <>
      <Header />
      <main className="page">
        <div className="hero compact hero-row">
          <div>
            <h1>Historique</h1>
            <p>Toutes vos analyses précédentes</p>
          </div>
          <button type="button" className="btn-refresh" onClick={refresh} disabled={refreshing || loading}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Sync...' : 'Actualiser'}
          </button>
        </div>

        {selected ? (
          <div className="result-section fade-in">
            <button type="button" className="btn-ghost" onClick={() => setSelected(null)}>← Retour</button>
            <ResultCard data={selected} />
          </div>
        ) : loading ? (
          <HistorySkeleton />
        ) : error ? (
          <div className="empty"><p>{error}</p><button type="button" className="btn-primary sm" onClick={() => load()}>Réessayer</button></div>
        ) : items.length === 0 ? (
          <div className="empty fade-in">
            <p>Aucune analyse pour l&apos;instant.</p>
            <Link href="/analyze" className="btn-primary">Lancer une analyse →</Link>
          </div>
        ) : (
          <div className="history stagger-in">
            {items.map((item, i) => {
              const spec = getInstrument(item.instrument)
              const trade = item.ai.signal === 'BUY' || item.ai.signal === 'SELL'
              return (
                <button
                  type="button"
                  key={item.id}
                  className="history-item nav-link-fx"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => setSelected(item)}
                >
                  <div className={`hist-icon ${item.ai.signal.toLowerCase()}`}>
                    {!trade ? <Minus size={18} /> : item.ai.signal === 'BUY' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div className="hist-info">
                    <strong>{spec?.label ?? item.instrument}</strong>
                    <span>{CATEGORY_LABELS[item.assetCategory]} · {item.timeframe} · {fmt(item.createdAt)}</span>
                  </div>
                  <div className="hist-conf">{item.ai.confidence}%</div>
                  <ChevronRight size={16} />
                </button>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
