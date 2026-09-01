import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { generateLeaderboard, type LeaderboardPeriod } from '@/lib/leaderboard/generator'

export const runtime = 'nodejs'

const VALID: LeaderboardPeriod[] = ['session', 'today', 'week', 'month']

export async function GET(req: NextRequest) {
  const session = await auth()
  const period = (req.nextUrl.searchParams.get('period') ?? 'week') as LeaderboardPeriod
  const safePeriod = VALID.includes(period) ? period : 'week'

  const data = generateLeaderboard({
    period: safePeriod,
    currentUserId: session?.user?.id,
    currentUserName: session?.user?.name ?? undefined,
  })

  return NextResponse.json(data)
}
