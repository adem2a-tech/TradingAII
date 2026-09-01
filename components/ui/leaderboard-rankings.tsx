'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { pseudoColor, pseudoInitials } from '@/lib/leaderboard/initials'

export type LeaderboardRankingItem = {
  userId: string
  rank: number
  userName: string
  byline: string
  value: number
  displayed: boolean
}

type LeaderboardRankingsProps = {
  rankings: LeaderboardRankingItem[]
  currentUserId?: string
  showPagination?: boolean
  defaultPageSize?: number
  className?: string
}

function formatEur(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}


export function LeaderboardRankings({
  rankings,
  currentUserId,
  showPagination = false,
  defaultPageSize = 10,
  className,
}: LeaderboardRankingsProps) {
  const visible = rankings.filter((r) => r.displayed)
  const [page, setPage] = React.useState(0)
  const pageSize = defaultPageSize
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const slice = showPagination
    ? visible.slice(safePage * pageSize, safePage * pageSize + pageSize)
    : visible.slice(0, pageSize)

  React.useEffect(() => { setPage(0) }, [rankings.length])

  return (
    <div className={`lb-list-wrap${className ? ` ${className}` : ''}`}>
      <ul className="lb-list">
        {slice.map((item) => {
          const isYou = currentUserId && item.userId === currentUserId
          return (
            <li
              key={item.userId}
              className={`lb-row${isYou ? ' is-you' : ''}${item.rank <= 3 ? ` top-${item.rank}` : ''}`}
            >
              <span className={`lb-row-rank lb-rank-${item.rank <= 3 ? item.rank : 'n'}`}>
                {item.rank}
              </span>
              <div
                className="ulb-avatar-fallback"
                style={{ background: pseudoColor(item.userId) }}
                aria-hidden
              >
                {pseudoInitials(item.userName)}
              </div>
              <div className="lb-row-info">
                <strong>{item.userName}{isYou && <em> · toi</em>}</strong>
                <span>{item.byline}</span>
              </div>
              <div className="lb-row-gain">
                <strong>{formatEur(item.value)}</strong>
                <small>Trade AI</small>
              </div>
            </li>
          )
        })}
      </ul>

      {showPagination && totalPages > 1 && (
        <div className="lb-pagination">
          <button type="button" disabled={safePage <= 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={16} /> Préc.
          </button>
          <span>Page {safePage + 1} / {totalPages}</span>
          <button type="button" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Suiv. <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
