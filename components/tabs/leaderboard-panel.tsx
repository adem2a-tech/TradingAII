'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Clock, RefreshCw, TrendingUp } from 'lucide-react'
import { LeaderboardPodium } from '@/components/ui/leaderboard-podium'
import { UpstashLeaderboard } from '@/components/ui/upstash-leaderboard'
import type { LeaderboardPeriod } from '@/lib/leaderboard/generator'
import { THREE_HOURS_MS } from '@/lib/leaderboard/generator'

type LeaderboardData = {
  fromDate: string
  toDate: string
  nextUpdateAt: string
  podiumRankings: {
    userId: string
    userName: string
    rank: number
    value: number
  }[]
  rankings: {
    userId: string
    rank: number
    userName: string
    byline: string
    value: number
    displayed: boolean
  }[]
  runOptions: { id: string; label: string }[]
}

const PERIOD_SHORT: Record<string, string> = {
  session: '3h',
  today: 'Jour',
  week: 'Semaine',
  month: 'Mois',
}

function formatCountdown(ms: number) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatRange(from: string, to: string) {
  const f = new Date(from).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const t = new Date(to).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${f} — ${t}`
}

export function LeaderboardPanel() {
  const { data: session } = useSession()
  const [period, setPeriod] = useState<LeaderboardPeriod>('week')
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const load = useCallback(async (p: LeaderboardPeriod) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?period=${p}`, { cache: 'no-store' })
      setData(await res.json())
      setPage(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(period) }, [period, load])

  useEffect(() => {
    const tick = () => {
      if (!data?.nextUpdateAt) return
      const left = new Date(data.nextUpdateAt).getTime() - Date.now()
      if (left <= 0) { load(period); return }
      setCountdown(formatCountdown(left))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [data?.nextUpdateAt, period, load])

  useEffect(() => {
    const id = setInterval(() => load(period), THREE_HOURS_MS)
    return () => clearInterval(id)
  }, [period, load])

  const entries = useMemo(() => {
    if (!data) return []
    const slice = data.rankings.slice(page * pageSize, page * pageSize + pageSize)
    return slice.map((r) => ({
      id: r.userId,
      name: r.userName,
      score: r.value,
      byline: r.byline,
      rank: r.rank,
      highlight: session?.user?.id === r.userId,
    }))
  }, [data, page, session?.user?.id])

  const totalPages = data ? Math.max(1, Math.ceil(data.rankings.length / pageSize)) : 1

  if (loading && !data) {
    return (
      <div className="tab-panel leaderboard-tab">
        <div className="leaderboard-skeleton neon-card" />
        <p className="muted" style={{ textAlign: 'center' }}>Chargement...</p>
      </div>
    )
  }

  if (!data) {
    return <div className="tab-panel"><p className="muted">Classement indisponible.</p></div>
  }

  return (
    <div className="tab-panel fade-in leaderboard-tab">
      <div className="lb-hero-compact">
        <TrendingUp size={20} />
        <div>
          <h2>Argent généré grâce à Trade AI</h2>
          <p>Classement · refresh toutes les 3h</p>
        </div>
        <div className="lb-hero-timer">
          <Clock size={14} />
          <span>{countdown || '...'}</span>
          <button type="button" onClick={() => load(period)} aria-label="Rafraîchir">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="lb-card">
        <div className="lb-card-top">
          <div>
            <h3>Top traders Trade AI</h3>
            <p>{formatRange(data.fromDate, data.toDate)}</p>
          </div>
        </div>

        <div className="lb-period-pills" role="tablist">
          {data.runOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={period === opt.id}
              className={period === opt.id ? 'on' : ''}
              onClick={() => setPeriod(opt.id as LeaderboardPeriod)}
            >
              {PERIOD_SHORT[opt.id] ?? opt.label}
            </button>
          ))}
        </div>

        <LeaderboardPodium rankings={data.podiumRankings} />

        <UpstashLeaderboard
          entries={entries}
          title="Classement complet"
          maxEntries={pageSize}
          scoreLabel="Gains estimés"
        />

        {totalPages > 1 && (
          <div className="lb-pagination">
            <button type="button" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
              ← Préc.
            </button>
            <span>Page {page + 1} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              Suiv. →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
