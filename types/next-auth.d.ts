import type { DefaultSession } from 'next-auth'
import type { Plan } from '@/lib/access/types'

declare module 'next-auth' {
  interface Session {
    user: { id: string; plan?: Plan } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string
    plan?: Plan
  }
}
