import { Suspense } from 'react'
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="auth-page"><p className="muted">Chargement...</p></main>}>
      <LoginForm />
    </Suspense>
  )
}
