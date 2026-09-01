import type { AssetCategory, Timeframe } from '../types'

const DEVICE_KEY = 'tradeai_device_id'
const PROFILE_KEY = 'tradeai_device_profile'

export type UserPrefs = {
  balance: string
  riskPercent: string
  category: AssetCategory
  instrument: string
  timeframe: Timeframe
}

export type DeviceProfile = {
  deviceId: string
  userId?: string
  name?: string
  email?: string
  prefs?: Partial<UserPrefs>
  updatedAt: string
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function loadDeviceProfile(): DeviceProfile {
  if (typeof window === 'undefined') {
    return { deviceId: '', updatedAt: new Date().toISOString() }
  }
  getDeviceId()
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DeviceProfile
      return { ...parsed, deviceId: getDeviceId() }
    }
  } catch { /* ignore */ }
  return { deviceId: getDeviceId(), updatedAt: new Date().toISOString() }
}

export function saveDeviceProfile(patch: Partial<Omit<DeviceProfile, 'deviceId'>>) {
  if (typeof window === 'undefined') return
  const current = loadDeviceProfile()
  const next: DeviceProfile = {
    ...current,
    ...patch,
    deviceId: getDeviceId(),
    updatedAt: new Date().toISOString(),
    prefs: patch.prefs ? { ...current.prefs, ...patch.prefs } : current.prefs,
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
}

export function loadPrefs(): Partial<UserPrefs> | null {
  const profile = loadDeviceProfile()
  return profile.prefs ?? null
}

export function savePrefs(prefs: UserPrefs) {
  saveDeviceProfile({ prefs })
}

export function rememberUser(params: { userId: string; name: string; email: string }) {
  saveDeviceProfile({ userId: params.userId, name: params.name, email: params.email })
}

export function isReturningUser(): boolean {
  const p = loadDeviceProfile()
  return !!(p.email || p.userId)
}
