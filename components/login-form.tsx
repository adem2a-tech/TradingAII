'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/toast'
import { isValidEmail } from '@/lib/auth/validate-email'
import { loadDeviceProfile, saveDeviceProfile } from '@/lib/storage/device-profile'

function safeCallback(raw: string | null) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/analyze'
  if (raw.startsWith('/login')) return '/analyze'
  return raw
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = safeCallback(searchParams.get('callbackUrl'))
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [returningName, setReturningName] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('error') !== 'CredentialsSignin') return
    toast('Email ou mot de passe incorrect — vérifie tes identifiants')
  }, [searchParams])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      window.location.replace(callbackUrl)
      return
    }
    const profile = loadDeviceProfile()
    if (profile.email) setEmail(profile.email)
    if (profile.name) {
      setName(profile.name)
      setReturningName(profile.name.split(' ')[0])
      setMode('login')
    }
  }, [status, session, callbackUrl])

  const submitCredentials = async () => {
    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
      toast('Email et mot de passe requis')
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      toast('Email invalide — il faut une adresse avec @')
      return
    }
    if (mode === 'register' && password.length < 8) {
      toast('Mot de passe : 8 caractères minimum')
      return
    }

    setLoading(true)
    const displayName = name || trimmedEmail.split('@')[0]
    saveDeviceProfile({ email: trimmedEmail, name: displayName })

    // Redirect serveur NextAuth = cookie session posé avant d'aller sur /analyze
    await signIn('credentials', {
      email: trimmedEmail,
      password,
      name,
      action: mode,
      callbackUrl,
      redirect: true,
    })
  }

  return (
    <main className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card premium auth-enter">
        <div className="auth-logo-wrap">TRADE<span>AI</span></div>
        <h1>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>
        {returningName && mode === 'login' ? (
          <p className="auth-sub auth-welcome-back">
            Content de te revoir, <strong>{returningName}</strong> — tes réglages seront restaurés
          </p>
        ) : (
          <p className="auth-sub">Compte obligatoire · mémorisé sur cet appareil</p>
        )}

        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Connexion</button>
          <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Inscription</button>
        </div>

        <div className="auth-fields">
          {mode === 'register' && (
            <label>Prénom<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan" autoComplete="given-name" /></label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@email.com"
              autoComplete="email"
              inputMode="email"
            />
          </label>
          <label>Mot de passe<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères min." autoComplete={mode === 'register' ? 'new-password' : 'current-password'} /></label>
        </div>

        <button type="button" className="btn-primary full" onClick={submitCredentials} disabled={loading}>
          {loading ? <><Loader2 size={16} className="spin" /> Connexion...</> : mode === 'login' ? 'Se connecter →' : 'Créer mon compte →'}
        </button>

        <Link href="/" className="auth-back-link">← Retour à l&apos;accueil</Link>

        <p className="auth-legal">Profil mémorisé sur cet appareil · sessions chiffrées · historique privé</p>
      </div>
    </main>
  )
}
