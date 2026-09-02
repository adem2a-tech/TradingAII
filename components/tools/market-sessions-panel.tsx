'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock, Globe, TrendingUp } from 'lucide-react'
import { ToolCard3D } from '@/components/tools/tool-card-3d'
import {
  FOREX_SESSIONS,
  TOP_MARKETS,
  countOpenForexSessions,
  formatUtcDate,
  formatUtcTime,
  getForexSessionStatus,
  getTopMarketStatus,
  isForexWeekOpen,
} from '@/lib/market-sessions'

export function MarketSessionsPanel() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  const openCount = useMemo(() => countOpenForexSessions(now), [now])
  const forexOpen = isForexWeekOpen(now)

  return (
    <ToolCard3D accent="cyan" className="tools-sessions-card">
      <div className="tools-card-head">
        <div>
          <h3><Globe size={18} /> Sessions marché · live</h3>
          <p className="tools-card-sub">Mise à jour chaque minute · fuseau UTC</p>
        </div>
        <div className="tools-live-clock">
          <Clock size={16} />
          <div>
            <strong>{formatUtcTime(now)}</strong>
            <span>{formatUtcDate(now)}</span>
          </div>
        </div>
      </div>

      <div className="tools-forex-banner">
        <span className={`tools-forex-pill ${forexOpen ? 'on' : ''}`}>
          {forexOpen ? `${openCount} session${openCount > 1 ? 's' : ''} active${openCount > 1 ? 's' : ''}` : 'Forex fermé — week-end'}
        </span>
      </div>

      <div className="tools-session-grid">
        {FOREX_SESSIONS.map((session) => {
          const status = getForexSessionStatus(session, now)
          return (
            <div key={session.id} className={`tools-session-tile ${status.open ? 'open' : ''}`}>
              <span className="tools-session-emoji">{session.emoji}</span>
              <div className="tools-session-info">
                <strong>{session.name}</strong>
                <span>{status.detail}</span>
              </div>
              <div className="tools-session-meta">
                <span className={`tools-status-badge ${status.open ? 'on' : ''}`}>
                  {status.open ? 'Ouvert' : 'Fermé'}
                </span>
                {status.nextLabel && <small>{status.nextLabel}</small>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="tools-markets-divider">
        <TrendingUp size={16} />
        <span>Meilleurs marchés à trader</span>
      </div>

      <div className="tools-top-markets">
        {TOP_MARKETS.map((market) => {
          const status = getTopMarketStatus(market.id, now)
          return (
            <article key={market.id} className={`tools-market-row rank-${market.rank} ${status.open ? 'open' : ''}`}>
              <span className="tools-market-rank">#{market.rank}</span>
              <div className="tools-market-body">
                <div className="tools-market-title">
                  <strong>{market.name}</strong>
                  <span className="tools-market-symbol">{market.symbol}</span>
                </div>
                <p>{market.schedule}</p>
                <p className="tools-market-best">Meilleur créneau · {market.bestWindow}</p>
              </div>
              <div className="tools-market-status">
                <span className={`tools-status-badge ${status.open ? 'on' : ''}`}>
                  {status.open ? 'Ouvert' : 'Fermé'}
                </span>
                {status.nextLabel && <small>{status.nextLabel}</small>}
              </div>
            </article>
          )
        })}
      </div>
    </ToolCard3D>
  )
}
