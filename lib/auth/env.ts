/**
 * Secret auth — AUTH_SECRET explicite en prod, fallback stable sur Vercel
 * pour éviter error=Configuration quand la variable n'est pas encore posée.
 */
export function getAuthSecret(): string {
  const explicit = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (explicit) return explicit

  if (process.env.NODE_ENV === 'development') {
    return 'tradeai-local-dev-secret'
  }

  const projectId = process.env.VERCEL_PROJECT_ID
  if (projectId) {
    return `tradeai-vercel-${projectId}-v1`
  }

  return 'tradeai-fallback-secret-set-AUTH_SECRET-in-vercel'
}

export function getAuthBaseUrl(): string {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, '')
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}
