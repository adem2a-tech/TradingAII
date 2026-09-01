import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  trustHost: true,
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: [],
  callbacks: {
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
