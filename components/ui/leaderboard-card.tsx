'use client'

import * as React from 'react'
import { CalendarRange } from 'lucide-react'
import {
  LeaderboardPodium,
  type LeaderboardRanking as LeaderboardPodiumRanking,
} from '@/components/ui/leaderboard-podium'
import {
  LeaderboardRankings,
  type LeaderboardRankingItem,
} from '@/components/ui/leaderboard-rankings'

interface LeaderboardRunOption {
  id: string
  label: string
}

interface LeaderboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  fromDate: string | Date
  toDate: string | Date
  podiumRankings: LeaderboardPodiumRanking[]
  rankings: LeaderboardRankingItem[]
  currentUserId?: string
  runOptions?: LeaderboardRunOption[]
  selectedRunId?: string
  onRunChange?: (runId: string) => void
}

function formatRangeDate(date: string | Date) {
  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })
}

const PERIOD_SHORT: Record<string, string> = {
  session: '3h',
  today: 'Jour',
  week: 'Semaine',
  month: 'Mois',
}

const LeaderboardCard = React.forwardRef<HTMLDivElement, LeaderboardCardProps>(
  (
    {
      className,
      title = 'Leaderboard',
      fromDate,
      toDate,
      podiumRankings,
      rankings,
      currentUserId,
      runOptions,
      selectedRunId,
      onRunChange,
      ...props
    },
    ref,
  ) => {
    const fromLabel = formatRangeDate(fromDate)
    const toLabel = formatRangeDate(toDate)
    const activeId = selectedRunId ?? runOptions?.[0]?.id ?? ''

    return (
      <div ref={ref} className={`lb-card${className ? ` ${className}` : ''}`} {...props}>
        <div className="lb-card-head">
          <div>
            <h3>{title}</h3>
            <p><CalendarRange size={14} /> {fromLabel} — {toLabel}</p>
          </div>
        </div>

        {runOptions && runOptions.length > 0 && (
          <div className="lb-period-pills" role="tablist" aria-label="Période du classement">
            {runOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={activeId === opt.id}
                className={activeId === opt.id ? 'on' : ''}
                onClick={() => onRunChange?.(opt.id)}
              >
                {PERIOD_SHORT[opt.id] ?? opt.label}
              </button>
            ))}
          </div>
        )}

        <LeaderboardPodium rankings={podiumRankings} />

        <LeaderboardRankings
          rankings={rankings}
          currentUserId={currentUserId}
          showPagination
          defaultPageSize={10}
        />
      </div>
    )
  },
)

LeaderboardCard.displayName = 'LeaderboardCard'

export { LeaderboardCard }
export type { LeaderboardCardProps, LeaderboardRunOption }
