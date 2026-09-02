/** Validation email simple côté client et serveur */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim()
  if (!trimmed || trimmed.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}
