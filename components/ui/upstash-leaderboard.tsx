'use client'

import { Crown, Trophy } from 'lucide-react'
import { pseudoColor, pseudoInitials } from '@/lib/leaderboard/initials'

export interface LeaderboardEntry {
  id: string
  name: string
  score: number
  highlight?: boolean
  byline?: string
  rank?: number
}

interface UpstashLeaderboardProps {
  entries: LeaderboardEntry[]
  title?: string
  showRank?: boolean
  maxEntries?: number
  scoreLabel?: string
  scoreFormat?: (score: number) => string
  className?: string
}

function formatEur(score: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(score)
}

export function UpstashLeaderboard({
  entries,
  title = 'Leaderboard',
  showRank = true,
  maxEntries = 10,
  scoreLabel = 'Trade AI',
  scoreFormat = formatEur,
  className,
}: UpstashLeaderboardProps) {
  const displayEntries = entries.slice(0, maxEntries)

  return (
    <div data-slot="upstash-leaderboard" className={`ulb-root${className ? ` ${className}` : ''}`}>
      <div className="ulb-head">
        <div className="ulb-head-left">
          <Trophy size={18} className="ulb-trophy" />
          <h3>{title}</h3>
        </div>
        <span className="ulb-score-label">{scoreLabel}</span>
      </div>

      <div className="ulb-body">
        {displayEntries.map((entry, index) => {
          const rank = entry.rank ?? index + 1
          const top = rank <= 3
          const initials = pseudoInitials(entry.name)

          return (
            <div
              key={entry.id}
              className={`ulb-row${entry.highlight ? ' highlight' : ''}${top ? ` top-${rank}` : ''}`}
            >
              {showRank && (
                <div className={`ulb-rank${top ? ` r-${rank}` : ''}`}>
                  {rank === 1 ? <Crown size={16} /> : rank}
                </div>
              )}

              <div
                className="ulb-avatar-fallback"
                style={{ background: pseudoColor(entry.id) }}
                aria-hidden
              >
                {initials}
              </div>

              <div className="ulb-info">
                <span className="ulb-name">
                  {entry.name}
                  {entry.highlight && <em className="ulb-you"> · toi</em>}
                </span>
                {entry.byline && <span className="ulb-byline">{entry.byline}</span>}
              </div>

              <span className={`ulb-score${top ? ` s-${rank}` : ''}`}>
                {scoreFormat(entry.score)}
              </span>
            </div>
          )
        })}
      </div>

      {entries.length > maxEntries && (
        <div className="ulb-more">+{entries.length - maxEntries} traders</div>
      )}
    </div>
  )
}

export default UpstashLeaderboard
