import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { createUser, verifyCredentials } from '@/lib/auth/users'
import { isValidEmail } from '@/lib/auth/validate-email'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        action: { label: 'Action', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const email = String(credentials?.email || '').trim()
          const password = String(credentials?.password || '')
          const action = String(credentials?.action || 'login')

          if (!email || !password) return null
          if (!isValidEmail(email)) return null

          if (action === 'register') {
            const name = String(credentials?.name || '')
            const user = await createUser({ email, name, password, provider: 'credentials' })
            return { id: user.id, email: user.email, name: user.name, image: user.image }
          }

          const user = await verifyCredentials(email, password)
          if (!user) return null
          return { id: user.id, email: user.email, name: user.name, image: user.image }
        } catch (err) {
          console.error('[auth] authorize failed:', err)
          return null
        }
      },
    }),
  ],
})
