import { scrypt, randomBytes, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'
import type { UserRecord } from './users'
import { isValidEmail } from './validate-email'
import { getDataSubdir } from '../storage/data-root'

const scryptAsync = promisify(scrypt)
const DIR = getDataSubdir('users')

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true })
}

function filePath(id: string) {
  return path.join(DIR, `${id.replace(/[^a-zA-Z0-9-]/g, '')}.json`)
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

async function checkPassword(password: string, hash: string) {
  const [salt, key] = hash.split(':')
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return timingSafeEqual(derived, Buffer.from(key, 'hex'))
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  await ensureDir()
  const files = await fs.readdir(DIR).catch(() => [] as string[])
  for (const f of files) {
    if (!f.endsWith('.json')) continue
    const raw = await fs.readFile(path.join(DIR, f), 'utf-8')
    const u = JSON.parse(raw) as UserRecord
    if (u.email.toLowerCase() === email.toLowerCase()) return u
  }
  return null
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  try {
    const raw = await fs.readFile(filePath(id), 'utf-8')
    return JSON.parse(raw) as UserRecord
  } catch { return null }
}

async function save(user: UserRecord) {
  await fs.writeFile(filePath(user.id), JSON.stringify(user, null, 2), 'utf-8')
}

export async function createUser(data: Omit<UserRecord, 'id' | 'createdAt'> & { password?: string }): Promise<UserRecord> {
  if (!isValidEmail(data.email)) throw new Error('Email invalide')
  if (await findUserByEmail(data.email)) throw new Error('Email déjà utilisé')
  if (data.password && data.password.length < 8) throw new Error('Mot de passe : 8 caractères minimum')

  const user: UserRecord = {
    id: crypto.randomUUID(),
    email: data.email.toLowerCase().trim(),
    name: data.name.trim() || data.email.split('@')[0],
    passwordHash: data.password ? await hashPassword(data.password) : data.passwordHash,
    image: data.image,
    provider: data.provider || 'credentials',
    createdAt: new Date().toISOString(),
  }
  await save(user)
  return user
}

export async function upsertOAuthUser(params: { email: string; name: string; image?: string; provider: 'google' | 'apple' }): Promise<UserRecord> {
  const existing = await findUserByEmail(params.email)
  if (existing) {
    existing.name = params.name || existing.name
    existing.image = params.image || existing.image
    existing.provider = params.provider
    await save(existing)
    return existing
  }
  return createUser({ email: params.email, name: params.name, image: params.image, provider: params.provider })
}

export async function verifyCredentials(email: string, password: string): Promise<UserRecord | null> {
  const user = await findUserByEmail(email)
  if (!user?.passwordHash) return null
  if (!(await checkPassword(password, user.passwordHash))) return null
  return user
}

export async function updateUserAccess(
  userId: string,
  data: Pick<UserRecord, 'plan' | 'stripeCustomerId' | 'promoCode'>,
): Promise<UserRecord | null> {
  const user = await findUserById(userId)
  if (!user) return null
  if (data.plan !== undefined) user.plan = data.plan
  if (data.stripeCustomerId !== undefined) user.stripeCustomerId = data.stripeCustomerId
  if (data.promoCode !== undefined) user.promoCode = data.promoCode
  await save(user)
  return user
}
