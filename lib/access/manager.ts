import { promises as fs } from 'fs'
import path from 'path'
import { getStripe } from '../stripe'
import type { AccessRecord, AccessStatus } from './types'
import { FREE_COOLDOWN_MS, PROMO_CODE, formatWaitUntil } from './types'
import { getDataSubdir } from '../storage/data-root'
import { setAccessPlanCookie } from './plan-cookie'
import { resolveAccessRecord } from './resolve'
import { updateUserAccess } from '../auth/store'

const DIR = getDataSubdir('access')

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true })
}

function filePath(userId: string) {
  return path.join(DIR, `${userId.replace(/[^a-zA-Z0-9-]/g, '')}.json`)
}

export async function getAccess(userId: string): Promise<AccessRecord> {
  await ensureDir()
  try {
    const raw = await fs.readFile(filePath(userId), 'utf-8')
    return JSON.parse(raw) as AccessRecord
  } catch {
    const record: AccessRecord = {
      userId,
      plan: 'free',
      lastAnalysisAt: null,
      createdAt: new Date().toISOString(),
    }
    await saveAccess(record)
    return record
  }
}

async function saveAccess(record: AccessRecord) {
  await fs.writeFile(filePath(record.userId), JSON.stringify(record, null, 2), 'utf-8')
}

async function loadResolvedAccess(userId: string, email?: string | null): Promise<AccessRecord> {
  let record = await getAccess(userId)
  record = await resolveAccessRecord({ record, email })
  if (record.plan !== 'free') await saveAccess(record)
  return record
}

export async function persistLifetimeAccess(
  userId: string,
  opts: { stripeCustomerId?: string; promoCode?: string; email?: string | null } = {},
) {
  const record = await getAccess(userId)
  record.plan = 'lifetime'
  record.proExpiresAt = null
  record.stripeSubscriptionId = undefined
  if (opts.stripeCustomerId) record.stripeCustomerId = opts.stripeCustomerId
  if (opts.promoCode) record.promoCode = opts.promoCode
  await saveAccess(record)
  await setAccessPlanCookie({
    userId,
    plan: 'lifetime',
    stripeCustomerId: opts.stripeCustomerId,
    promoCode: opts.promoCode,
  })
  await updateUserAccess(userId, {
    plan: 'lifetime',
    stripeCustomerId: opts.stripeCustomerId,
    promoCode: opts.promoCode,
  }).catch(() => {})
  return record
}

async function syncProWithStripe(record: AccessRecord): Promise<AccessRecord> {
  if (record.plan !== 'pro' || !record.stripeSubscriptionId) return record
  try {
    const stripe = getStripe()
    const sub = await stripe.subscriptions.retrieve(record.stripeSubscriptionId)
    if (sub.status === 'active' || sub.status === 'trialing') {
      record.proExpiresAt = new Date(sub.current_period_end * 1000).toISOString()
      await saveAccess(record)
      return record
    }
    record.plan = 'free'
    record.stripeSubscriptionId = undefined
    record.proExpiresAt = null
    await saveAccess(record)
  } catch {
    record.plan = 'free'
    record.proExpiresAt = null
    await saveAccess(record)
  }
  return record
}

export function buildStatus(record: AccessRecord): AccessStatus {
  const isLifetime = record.plan === 'lifetime'
  const isPro = record.plan === 'pro'

  if (isLifetime) {
    return {
      plan: 'lifetime', canAnalyze: true, nextAnalysisAt: null, waitMessage: null,
      message: 'Accès à vie · analyses illimitées', isLifetime: true, isPro: false, proExpiresAt: null,
    }
  }

  if (isPro) {
    const exp = record.proExpiresAt ?? null
    const expMsg = exp ? ` · actif jusqu'au ${new Date(exp).toLocaleDateString('fr-FR')}` : ''
    return {
      plan: 'pro', canAnalyze: true, nextAnalysisAt: null, waitMessage: null,
      message: `Pro actif · analyses illimitées${expMsg}`, isLifetime: false, isPro: true, proExpiresAt: exp,
    }
  }

  if (!record.lastAnalysisAt) {
    return {
      plan: 'free', canAnalyze: true, nextAnalysisAt: null, waitMessage: null,
      message: 'Gratuit · 1 analyse / 3 jours', isLifetime: false, isPro: false, proExpiresAt: null,
    }
  }

  const next = new Date(record.lastAnalysisAt).getTime() + FREE_COOLDOWN_MS
  const canAnalyze = Date.now() >= next
  const nextIso = new Date(next).toISOString()
  const waitMsg = canAnalyze ? null : `Vous devez attendre jusqu'au ${formatWaitUntil(nextIso)} pour refaire une analyse.`

  return {
    plan: 'free',
    canAnalyze,
    nextAnalysisAt: canAnalyze ? null : nextIso,
    waitMessage: waitMsg,
    message: canAnalyze ? 'Gratuit · 1 analyse / 3 jours' : 'Limite atteinte · passe Pro ou attends',
    isLifetime: false,
    isPro: false,
    proExpiresAt: null,
  }
}

export async function canUserAnalyze(userId: string, email?: string | null) {
  let record = await loadResolvedAccess(userId, email)
  if (record.plan === 'pro') record = await syncProWithStripe(record)
  return buildStatus(record)
}

export async function recordAnalysisUsage(userId: string) {
  const record = await getAccess(userId)
  if (record.plan === 'free') {
    record.lastAnalysisAt = new Date().toISOString()
    await saveAccess(record)
  }
}

export async function redeemPromo(userId: string, code: string) {
  const normalized = code.trim().toUpperCase()
  const expected = (process.env.PROMO_CODE ?? 'LUISSSE').toUpperCase()
  if (normalized !== expected) {
    return { ok: false, message: 'Code promo invalide.' }
  }
  const record = await getAccess(userId)
  if (record.plan === 'lifetime') {
    return { ok: false, message: 'Accès à vie déjà actif sur ce compte.' }
  }
  if (record.plan === 'pro') {
    return { ok: false, message: 'Accès Pro déjà actif sur ce compte.' }
  }
  await persistLifetimeAccess(userId, { promoCode: normalized })
  return {
    ok: true,
    message: 'Bienvenue dans TradeAI Pro à vie ! Analyses illimitées — bon trading !',
  }
}

export async function activateLifetimePurchase(userId: string, stripeCustomerId: string) {
  await persistLifetimeAccess(userId, { stripeCustomerId })
}

export async function activatePro(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string) {
  const record = await getAccess(userId)
  record.plan = 'pro'
  record.stripeCustomerId = stripeCustomerId
  if (stripeSubscriptionId) {
    record.stripeSubscriptionId = stripeSubscriptionId
    try {
      const stripe = getStripe()
      const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      record.proExpiresAt = new Date(sub.current_period_end * 1000).toISOString()
    } catch { record.proExpiresAt = null }
  } else {
    record.stripeSubscriptionId = undefined
    record.proExpiresAt = null
  }
  await saveAccess(record)
  await setAccessPlanCookie({
    userId,
    plan: 'pro',
    stripeCustomerId,
  })
  await updateUserAccess(userId, { plan: 'pro', stripeCustomerId }).catch(() => {})
}

export async function deactivatePro(userId: string) {
  const record = await getAccess(userId)
  if (record.plan === 'pro') {
    record.plan = 'free'
    record.stripeSubscriptionId = undefined
    record.proExpiresAt = null
    await saveAccess(record)
  }
}

export async function findByStripeCustomer(customerId: string) {
  await ensureDir()
  const files = await fs.readdir(DIR)
  for (const f of files) {
    if (!f.endsWith('.json')) continue
    const raw = await fs.readFile(path.join(DIR, f), 'utf-8')
    const record = JSON.parse(raw) as AccessRecord
    if (record.stripeCustomerId === customerId) return record
  }
  return null
}
