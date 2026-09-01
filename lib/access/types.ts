export type Plan = 'free' | 'pro' | 'lifetime'

export type AccessRecord = {
  userId: string
  plan: Plan
  lastAnalysisAt: string | null
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  proExpiresAt?: string | null
  promoCode?: string
  createdAt: string
}

export type AccessStatus = {
  plan: Plan
  canAnalyze: boolean
  nextAnalysisAt: string | null
  waitMessage: string | null
  message: string
  isLifetime: boolean
  isPro: boolean
  proExpiresAt: string | null
}

export const PROMO_CODE = process.env.PROMO_CODE ?? 'LUISSSE'
export const FREE_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000 // 3 jours
export const PRO_PRICE = 79
/** @deprecated use PRO_PRICE */
export const SUBSCRIPTION_PRICE = PRO_PRICE
export const PRO_PRICE_LABEL = '79€'

export function formatWaitUntil(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}
