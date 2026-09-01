export type LeaderboardTrader = {
  id: string
  name: string
  baseSkill: number
  streakDays: number
  pair: string
  isPro: boolean
  volatile: number
}

export type LeaderboardEntry = {
  userId: string
  userName: string
  rank: number
  value: number
  byline: string
  displayed: boolean
}

export type LeaderboardPeriod = 'session' | 'today' | 'week' | 'month'

export type LeaderboardPayload = {
  period: LeaderboardPeriod
  fromDate: string
  toDate: string
  epoch: number
  nextUpdateAt: string
  podiumRankings: { userId: string; userName: string; rank: number; value: number }[]
  rankings: LeaderboardEntry[]
  runOptions: { id: string; label: string }[]
}

export const THREE_HOURS_MS = 3 * 60 * 60 * 1000

const TRADERS: LeaderboardTrader[] = [
  { id: 't-01', name: 'Karim', baseSkill: 0.94, streakDays: 89, pair: 'XAUUSD', isPro: true, volatile: 0.12 },
  { id: 't-02', name: 'Sarah', baseSkill: 0.91, streakDays: 64, pair: 'EURUSD', isPro: true, volatile: 0.15 },
  { id: 't-03', name: 'Youssef', baseSkill: 0.88, streakDays: 41, pair: 'NAS100', isPro: true, volatile: 0.18 },
  { id: 't-04', name: 'Emma', baseSkill: 0.86, streakDays: 52, pair: 'XAUUSD', isPro: true, volatile: 0.14 },
  { id: 't-05', name: 'Lucas', baseSkill: 0.84, streakDays: 37, pair: 'GBPUSD', isPro: false, volatile: 0.2 },
  { id: 't-06', name: 'Salma', baseSkill: 0.82, streakDays: 28, pair: 'BTCUSD', isPro: true, volatile: 0.22 },
  { id: 't-07', name: 'Mehdi', baseSkill: 0.8, streakDays: 45, pair: 'XAUUSD', isPro: true, volatile: 0.16 },
  { id: 't-08', name: 'Inès', baseSkill: 0.78, streakDays: 19, pair: 'EURUSD', isPro: false, volatile: 0.24 },
  { id: 't-09', name: 'Nathan', baseSkill: 0.77, streakDays: 33, pair: 'US30', isPro: true, volatile: 0.19 },
  { id: 't-10', name: 'Aya', baseSkill: 0.75, streakDays: 22, pair: 'USDJPY', isPro: false, volatile: 0.21 },
  { id: 't-11', name: 'Camille', baseSkill: 0.74, streakDays: 15, pair: 'XAUUSD', isPro: true, volatile: 0.25 },
  { id: 't-12', name: 'Bilal', baseSkill: 0.72, streakDays: 26, pair: 'ETHUSD', isPro: false, volatile: 0.23 },
  { id: 't-13', name: 'Manon', baseSkill: 0.71, streakDays: 11, pair: 'EURUSD', isPro: false, volatile: 0.27 },
  { id: 't-14', name: 'Hugo', baseSkill: 0.7, streakDays: 31, pair: 'NAS100', isPro: true, volatile: 0.2 },
  { id: 't-15', name: 'Nour', baseSkill: 0.68, streakDays: 8, pair: 'GBPUSD', isPro: false, volatile: 0.28 },
  { id: 't-16', name: 'Amine', baseSkill: 0.67, streakDays: 18, pair: 'XAUUSD', isPro: true, volatile: 0.22 },
  { id: 't-17', name: 'Théo', baseSkill: 0.65, streakDays: 14, pair: 'BTCUSD', isPro: false, volatile: 0.26 },
  { id: 't-18', name: 'Zineb', baseSkill: 0.64, streakDays: 9, pair: 'EURUSD', isPro: false, volatile: 0.29 },
  { id: 't-19', name: 'Antoine', baseSkill: 0.62, streakDays: 21, pair: 'XAUUSD', isPro: true, volatile: 0.24 },
  { id: 't-20', name: 'Lina', baseSkill: 0.6, streakDays: 6, pair: 'USDJPY', isPro: false, volatile: 0.3 },
  { id: 't-21', name: 'Rayan', baseSkill: 0.58, streakDays: 12, pair: 'US30', isPro: false, volatile: 0.31 },
  { id: 't-22', name: 'Chloé', baseSkill: 0.56, streakDays: 4, pair: 'EURUSD', isPro: false, volatile: 0.32 },
  { id: 't-23', name: 'Omar', baseSkill: 0.55, streakDays: 16, pair: 'XAUUSD', isPro: true, volatile: 0.25 },
  { id: 't-24', name: 'Léa', baseSkill: 0.53, streakDays: 7, pair: 'GBPUSD', isPro: false, volatile: 0.33 },
  { id: 't-25', name: 'Sami', baseSkill: 0.51, streakDays: 10, pair: 'NAS100', isPro: false, volatile: 0.34 },
  { id: 't-26', name: 'Yasmine', baseSkill: 0.49, streakDays: 3, pair: 'BTCUSD', isPro: false, volatile: 0.35 },
  { id: 't-27', name: 'Enzo', baseSkill: 0.47, streakDays: 5, pair: 'EURUSD', isPro: false, volatile: 0.36 },
  { id: 't-28', name: 'Fatima', baseSkill: 0.45, streakDays: 2, pair: 'XAUUSD', isPro: false, volatile: 0.38 },
  { id: 't-29', name: 'Adam', baseSkill: 0.43, streakDays: 1, pair: 'ETHUSD', isPro: false, volatile: 0.4 },
  { id: 't-30', name: 'Romain', baseSkill: 0.41, streakDays: 8, pair: 'USDJPY', isPro: false, volatile: 0.37 },
]

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function getLeaderboardEpoch(now = Date.now()) {
  return Math.floor(now / THREE_HOURS_MS)
}

export function getNextUpdateAt(now = Date.now()) {
  return new Date((getLeaderboardEpoch(now) + 1) * THREE_HOURS_MS).toISOString()
}

const PERIOD_MULT: Record<LeaderboardPeriod, number> = {
  session: 1,
  today: 2.8,
  week: 9.5,
  month: 28,
}

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  session: 'Session actuelle (3h)',
  today: 'Aujourd\'hui',
  week: 'Cette semaine',
  month: 'Ce mois',
}

function periodRange(period: LeaderboardPeriod, now = Date.now()) {
  const end = new Date(now)
  const start = new Date(now)
  if (period === 'session') {
    start.setTime(getLeaderboardEpoch(now) * THREE_HOURS_MS)
  } else if (period === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    const day = start.getDay()
    const diff = day === 0 ? 6 : day - 1
    start.setDate(start.getDate() - diff)
    start.setHours(0, 0, 0, 0)
  } else {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }
  return { fromDate: start.toISOString(), toDate: end.toISOString() }
}

function bylineFor(trader: LeaderboardTrader, analyses: number): string {
  const tier = trader.isPro ? 'Pro' : 'Gratuit'
  const days = trader.streakDays > 1 ? `${trader.streakDays}j actif` : 'Nouveau'
  return `${tier} · ${trader.pair} · ${analyses} analyses · ${days}`
}

function computeValue(
  trader: LeaderboardTrader,
  rand: () => number,
  period: LeaderboardPeriod,
  epoch: number,
): number {
  const periodMult = PERIOD_MULT[period]
  const epochDrift = 0.88 + ((hashString(`${trader.id}-${epoch}`) % 240) / 1000)
  const noise = 1 - trader.volatile / 2 + rand() * trader.volatile
  const activity = trader.streakDays > 20 ? 1.08 : trader.streakDays < 5 ? 0.72 : 0.92
  const inactiveChance = trader.streakDays < 4 ? 0.35 : 0.08
  if (rand() < inactiveChance) return Math.round(180 + rand() * 900 * periodMult)

  const base = 420 + trader.baseSkill * 5200
  const raw = base * periodMult * epochDrift * noise * activity
  return Math.round(Math.max(120, raw))
}

export function generateLeaderboard(params: {
  period?: LeaderboardPeriod
  currentUserId?: string
  currentUserName?: string
  now?: number
}): LeaderboardPayload {
  const now = params.now ?? Date.now()
  const period = params.period ?? 'week'
  const epoch = getLeaderboardEpoch(now)
  const seed = hashString(`${period}-${epoch}`)
  const rand = mulberry32(seed)
  const { fromDate, toDate } = periodRange(period, now)

  const entries = TRADERS.map((trader) => {
    const analyses = Math.max(3, Math.round(trader.baseSkill * 40 + rand() * 18))
    const value = computeValue(trader, rand, period, epoch)
    return {
      userId: trader.id,
      userName: trader.name,
      rank: 0,
      value,
      byline: bylineFor(trader, analyses),
      displayed: true,
    }
  })

  if (params.currentUserId) {
    const userSeed = hashString(`${params.currentUserId}-${epoch}`)
    const userRand = mulberry32(userSeed)
    const userSkill = 0.35 + (userSeed % 300) / 1000
    const userValue = Math.round(
      (680 + userSkill * 3200) * PERIOD_MULT[period] * (0.9 + userRand() * 0.22),
    )
    const userName = params.currentUserName?.split(' ')[0] ?? 'Toi'
    entries.push({
      userId: params.currentUserId,
      userName,
      rank: 0,
      value: userValue,
      byline: `Trade AI · ${Math.max(2, Math.round(userSkill * 22))} analyses cette période`,
      displayed: true,
    })
  }

  entries.sort((a, b) => b.value - a.value)
  entries.forEach((e, i) => { e.rank = i + 1 })

  const podiumRankings = entries.slice(0, 3).map((e) => ({
    userId: e.userId,
    userName: e.userName,
    rank: e.rank,
    value: e.value,
  }))

  return {
    period,
    fromDate,
    toDate,
    epoch,
    nextUpdateAt: getNextUpdateAt(now),
    podiumRankings,
    rankings: entries,
    runOptions: (['session', 'today', 'week', 'month'] as LeaderboardPeriod[]).map((p) => ({
      id: p,
      label: PERIOD_LABELS[p],
    })),
  }
}
