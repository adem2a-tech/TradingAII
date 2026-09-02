import type { NextAuthConfig } from 'next-auth'
import { getAuthSecret } from '@/lib/auth/env'

export const authConfig = {
  secret: getAuthSecret(),
  trustHost: true,
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: [],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/analyze`
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id!
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.name = (token.name as string) || session.user.name
      }
      return session
    },
  },
} satisfies NextAuthConfig
