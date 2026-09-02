import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

const PUBLIC = ['/', '/login', '/success']
const PUBLIC_API = ['/api/stripe/webhook', '/api/auth']

export default auth((req) => {
  const path = req.nextUrl.pathname
  const isPublic = PUBLIC.some((p) => path === p) || PUBLIC_API.some((p) => path.startsWith(p))
  const isApi = path.startsWith('/api/')

  // Connecté → app (évite de rester bloqué sur la landing après login)
  if (req.auth && (path === '/' || path === '/login')) {
    return NextResponse.redirect(new URL('/analyze', req.url))
  }

  if (!req.auth && !isPublic) {
    if (isApi) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const login = new URL('/login', req.url)
    login.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(login)
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
