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

  if (!req.auth && !isPublic) {
    if (isApi) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    return NextResponse.redirect(new URL('/', req.url))
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
