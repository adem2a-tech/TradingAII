import type { AnalysisRecord } from '../types'

export type UserRecord = {
  id: string
  email: string
  name: string
  passwordHash?: string
  image?: string
  provider?: 'credentials' | 'google' | 'apple'
  createdAt: string
  plan?: 'free' | 'pro' | 'lifetime'
  stripeCustomerId?: string
  promoCode?: string
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { findUserByEmail: find } = await import('./store')
  return find(email)
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const { findUserById: find } = await import('./store')
  return find(id)
}

export async function createUser(data: Omit<UserRecord, 'id' | 'createdAt'> & { password?: string }): Promise<UserRecord> {
  const { createUser: create } = await import('./store')
  return create(data)
}

export async function upsertOAuthUser(params: { email: string; name: string; image?: string; provider: 'google' | 'apple' }): Promise<UserRecord> {
  const { upsertOAuthUser: upsert } = await import('./store')
  return upsert(params)
}

export async function verifyCredentials(email: string, password: string): Promise<UserRecord | null> {
  const { verifyCredentials: verify } = await import('./store')
  return verify(email, password)
}

export async function updateUserAccess(
  userId: string,
  data: Pick<UserRecord, 'plan' | 'stripeCustomerId' | 'promoCode'>,
) {
  const { updateUserAccess: update } = await import('./store')
  return update(userId, data)
}
