import { findUserById, updateUserAccess } from '@/lib/auth/store'
import type { AccessRecord, Plan } from './types'
import { readAccessPlanCookie, setAccessPlanCookie } from './plan-cookie'
import { findLifetimePurchaseByEmail } from './stripe-sync'

type ResolveOpts = {
  email?: string | null
  record: AccessRecord
}

/** Fusionne fichier local, cookie signé, profil user et Stripe — persiste sur Vercel. */
export async function resolveAccessRecord({ record, email }: ResolveOpts): Promise<AccessRecord> {
  if (record.plan === 'lifetime' || record.plan === 'pro') return record

  const cookie = await readAccessPlanCookie(record.userId)
  if (cookie?.plan === 'lifetime' || cookie?.plan === 'pro') {
    record.plan = cookie.plan
    if (cookie.stripeCustomerId) record.stripeCustomerId = cookie.stripeCustomerId
    if (cookie.promoCode) record.promoCode = cookie.promoCode
    await persistResolved(record)
    return record
  }

  const user = await findUserById(record.userId)
  if (user?.plan === 'lifetime' || user?.plan === 'pro') {
    record.plan = user.plan
    if (user.stripeCustomerId) record.stripeCustomerId = user.stripeCustomerId
    if (user.promoCode) record.promoCode = user.promoCode
    await persistResolved(record)
    return record
  }

  if (email) {
    const stripeHit = await findLifetimePurchaseByEmail(email)
    if (stripeHit) {
      record.plan = 'lifetime'
      record.stripeCustomerId = stripeHit.customerId
      await persistResolved(record)
      return record
    }
  }

  return record
}

async function persistResolved(record: AccessRecord) {
  await setAccessPlanCookie({
    userId: record.userId,
    plan: record.plan as Plan,
    stripeCustomerId: record.stripeCustomerId,
    promoCode: record.promoCode,
  })

  await updateUserAccess(record.userId, {
    plan: record.plan,
    stripeCustomerId: record.stripeCustomerId,
    promoCode: record.promoCode,
  }).catch(() => {})
}
