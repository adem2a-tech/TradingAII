'use client'

import { Crown } from 'lucide-react'
import { pseudoColor, pseudoInitials } from '@/lib/leaderboard/initials'

export type LeaderboardRanking = {
  userId: string
  userName: string | null
  rank: number
  value: number
}

type LeaderboardPodiumProps = React.HTMLAttributes<HTMLDivElement> & {
  rankings: LeaderboardRanking[]
}

function formatEur(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function LeaderboardPodium({ rankings, className, ...props }: LeaderboardPodiumProps) {
  const top3 = rankings.slice(0, 3)
  const order = [
    top3.find((r) => r.rank === 2),
    top3.find((r) => r.rank === 1),
    top3.find((r) => r.rank === 3),
  ].filter(Boolean) as LeaderboardRanking[]

  if (!order.length) return null

  return (
    <div className={`lb-podium${className ? ` ${className}` : ''}`} {...props}>
      {order.map((r) => {
        const name = r.userName || 'Trader'
        const initials = pseudoInitials(name)
        return (
          <div key={r.userId} className={`lb-podium-slot rank-${r.rank}`}>
            <div className="lb-podium-user">
              <div className="lb-podium-avatar-wrap">
                <div
                  className="lb-podium-initials"
                  style={{ background: pseudoColor(r.userId) }}
                  aria-hidden
                >
                  {initials}
                </div>
                <span className="lb-podium-medal" aria-hidden>
                  <Crown size={12} />
                </span>
              </div>
              <p className="lb-podium-name" title={name}>{name}</p>
              <p className="lb-podium-value">{formatEur(r.value)}</p>
            </div>
            <div className="lb-podium-block">
              <span className="lb-podium-rank">{r.rank}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
