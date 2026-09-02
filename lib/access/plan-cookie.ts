import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getAuthSecret } from '@/lib/auth/env'
import type { Plan } from './types'

const COOKIE = 'tradeai_access'
const MAX_AGE = 60 * 60 * 24 * 3650 // ~10 ans — accès à vie

type Payload = {
  userId: string
  plan: Plan
  stripeCustomerId?: string
  promoCode?: string
}

function secretKey() {
  return new TextEncoder().encode(getAuthSecret())
}

export async function setAccessPlanCookie(payload: Payload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey())

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function readAccessPlanCookie(userId: string): Promise<Payload | null> {
  const jar = await cookies()
  const raw = jar.get(COOKIE)?.value
  if (!raw) return null
  try {
    const { payload } = await jwtVerify(raw, secretKey())
    if (payload.userId !== userId) return null
    const plan = payload.plan as Plan
    if (plan !== 'lifetime' && plan !== 'pro') return null
    return {
      userId,
      plan,
      stripeCustomerId: payload.stripeCustomerId as string | undefined,
      promoCode: payload.promoCode as string | undefined,
    }
  } catch {
    return null
  }
}

export async function clearAccessPlanCookie() {
  const jar = await cookies()
  jar.delete(COOKIE)
}
