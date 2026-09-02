/** Horaires marchés — UTC. Forex : dim 22h → ven 22h. Or : même cycle CFD. Crypto : 24/7. */

export type SessionStatus = {
  open: boolean
  detail: string
  nextLabel?: string
}

export type ForexSession = {
  id: string
  name: string
  emoji: string
  openH: number
  openM: number
  closeH: number
  closeM: number
}

export type TopMarket = {
  id: string
  name: string
  symbol: string
  schedule: string
  bestWindow: string
  rank: number
}

export const FOREX_SESSIONS: ForexSession[] = [
  { id: 'sydney', name: 'Sydney', emoji: '🇦🇺', openH: 22, openM: 0, closeH: 7, closeM: 0 },
  { id: 'tokyo', name: 'Tokyo', emoji: '🇯🇵', openH: 0, openM: 0, closeH: 9, closeM: 0 },
  { id: 'london', name: 'Londres', emoji: '🇬🇧', openH: 8, openM: 0, closeH: 17, closeM: 0 },
  { id: 'newyork', name: 'New York', emoji: '🇺🇸', openH: 13, openM: 0, closeH: 22, closeM: 0 },
]

export const TOP_MARKETS: TopMarket[] = [
  {
    id: 'gold',
    name: "L'or",
    symbol: 'XAU/USD',
    schedule: 'Dim 23h → Ven 22h UTC · pause quotidienne ~22h–23h',
    bestWindow: '13h–17h UTC (Londres + New York)',
    rank: 1,
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC/USD',
    schedule: '24h/24 · 7j/7 — jamais fermé',
    bestWindow: 'Volatilité élevée aux ouvertures US & Asie',
    rank: 2,
  },
  {
    id: 'eurusd',
    name: 'Euro / Dollar',
    symbol: 'EUR/USD',
    schedule: 'Dim 22h → Ven 22h UTC (marché Forex)',
    bestWindow: '13h–17h UTC — chevauchement Londres / NY',
    rank: 3,
  },
  {
    id: 'us30',
    name: 'Dow Jones',
    symbol: 'US30',
    schedule: 'Dim 23h → Ven 22h UTC (futures CME)',
    bestWindow: '14h30–21h UTC — session américaine',
    rank: 4,
  },
]

function utcMinutes(d: Date) {
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function formatUtcTime(d: Date) {
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

export function formatUtcDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}

/** Forex fermé : samedi, dimanche avant 22h, vendredi après 22h UTC */
export function isForexWeekOpen(now: Date): boolean {
  const day = now.getUTCDay()
  const mins = utcMinutes(now)
  if (day === 6) return false
  if (day === 0 && mins < 22 * 60) return false
  if (day === 5 && mins >= 22 * 60) return false
  return true
}

function isInUtcRange(now: Date, openH: number, openM: number, closeH: number, closeM: number) {
  const mins = utcMinutes(now)
  const open = openH * 60 + openM
  const close = closeH * 60 + closeM
  if (open === close) return true
  if (open < close) return mins >= open && mins < close
  return mins >= open || mins < close
}

export function getForexSessionStatus(session: ForexSession, now: Date): SessionStatus {
  if (!isForexWeekOpen(now)) {
    return {
      open: false,
      detail: `${pad(session.openH)}h–${pad(session.closeH)}h UTC`,
      nextLabel: forexReopenLabel(now),
    }
  }
  const open = isInUtcRange(now, session.openH, session.openM, session.closeH, session.closeM)
  return {
    open,
    detail: `${pad(session.openH)}h–${pad(session.closeH)}h UTC`,
    nextLabel: open
      ? `Ferme ${pad(session.closeH)}h UTC`
      : `Ouvre ${pad(session.openH)}h UTC`,
  }
}

function forexReopenLabel(now: Date): string {
  const day = now.getUTCDay()
  if (day === 6 || day === 0) return 'Ouvre dimanche 22h UTC'
  if (day === 5) return 'Ouvre dimanche 22h UTC'
  return 'Ouvre dimanche 22h UTC'
}

export function getTopMarketStatus(marketId: string, now: Date): SessionStatus {
  if (marketId === 'btc') {
    return { open: true, detail: TOP_MARKETS.find((m) => m.id === 'btc')!.schedule, nextLabel: 'Toujours ouvert' }
  }

  const forexOpen = isForexWeekOpen(now)

  if (marketId === 'gold') {
    if (!forexOpen) {
      return { open: false, detail: 'Dim 23h → Ven 22h UTC', nextLabel: 'Ouvre dimanche 23h UTC' }
    }
    const inDailyBreak = isInUtcRange(now, 22, 0, 23, 0)
    if (inDailyBreak) {
      return { open: false, detail: 'Pause quotidienne', nextLabel: 'Ouvre 23h UTC' }
    }
    const prime = isInUtcRange(now, 13, 0, 17, 0)
    return {
      open: true,
      detail: 'Dim 23h → Ven 22h UTC',
      nextLabel: prime ? 'Fenêtre optimale en cours' : 'Pic : 13h–17h UTC',
    }
  }

  if (marketId === 'eurusd') {
    if (!forexOpen) {
      return { open: false, detail: 'Dim 22h → Ven 22h UTC', nextLabel: 'Ouvre dimanche 22h UTC' }
    }
    const prime = isInUtcRange(now, 13, 0, 17, 0)
    return {
      open: true,
      detail: 'Dim 22h → Ven 22h UTC',
      nextLabel: prime ? 'Chevauchement Londres/NY actif' : 'Pic : 13h–17h UTC',
    }
  }

  if (marketId === 'us30') {
    if (!forexOpen) {
      return { open: false, detail: 'Dim 23h → Ven 22h UTC', nextLabel: 'Ouvre dimanche 23h UTC' }
    }
    const usSession = isInUtcRange(now, 14, 30, 21, 0)
    return {
      open: true,
      detail: 'Futures CME · Dim 23h → Ven 22h UTC',
      nextLabel: usSession ? 'Session US en cours' : 'Pic : 14h30–21h UTC',
    }
  }

  return { open: false, detail: '—' }
}

export function countOpenForexSessions(now: Date): number {
  if (!isForexWeekOpen(now)) return 0
  return FOREX_SESSIONS.filter((s) => getForexSessionStatus(s, now).open).length
}
